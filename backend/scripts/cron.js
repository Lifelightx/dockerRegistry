const cron = require('node-cron');
const pool = require('../config/db');
const registryService = require('../services/registryService');
const axios = require('axios');

async function runRetentionCleanup() {
    console.log('[Retention] Starting retention policy cleanup...');
    try {
        // Fetch all policies
        const policiesResult = await pool.query("SELECT * FROM retention_policies");
        const policies = policiesResult.rows;

        if (policies.length === 0) {
            console.log('[Retention] No policies configured.');
            return;
        }

        // Create a map of repo -> policy rules
        const rules = {};
        let globalKeepN = null;

        for (const p of policies) {
            if (p.repository === 'global') {
                globalKeepN = p.keep_n;
            } else {
                rules[p.repository] = p.keep_n;
            }
        }

        // Get all repositories
        const repos = await registryService.getCatalog();
        let deletedAny = false;

        for (const repo of repos) {
            // Determine limit. Specific limit overrides global
            const keepN = rules[repo] !== undefined ? rules[repo] : globalKeepN;
            if (keepN === null) continue; // No policy applies to this repo

            console.log(`[Retention] Checking ${repo} (Keep: ${keepN})`);
            const tags = await registryService.getTags(repo);

            if (!tags || tags.length <= keepN) {
                continue; // Nothing to delete
            }

            // We need to fetch creation dates to sort them.
            // Alternatively, we could just sort them by assuming the order returned by registry or fetching manifest for each
            const tagDetails = await Promise.all(tags.map(async (tag) => {
                try {
                    const { manifest, digest } = await registryService.getManifest(repo, tag);
                    let created = new Date(0); // Default to very old

                    // Attempt fetching creation date
                    if (manifest?.config?.digest) {
                        try {
                            const config = await registryService.getBlob(repo, manifest.config.digest);
                            if (config?.created) created = new Date(config.created);
                        } catch (e) { }
                    } else if (manifest?.history && manifest.history.length > 0) {
                        try {
                            const v1Compatibility = JSON.parse(manifest.history[0].v1Compatibility);
                            if (v1Compatibility?.created) created = new Date(v1Compatibility.created);
                        } catch (e) { }
                    }

                    return { tag, digest, created };
                } catch (e) {
                    console.log(`[Retention] Error fetching info for ${repo}:${tag}`);
                    return { tag, digest: null, created: new Date(0) };
                }
            }));

            // Filter out tags that couldn't be fetched properly
            const validTags = tagDetails.filter(t => t.digest !== null);

            // Sort by creation date DESCENDING (newest first)
            validTags.sort((a, b) => b.created - a.created);

            // Identify tags to delete (the ones beyond index keepN - 1)
            const tagsToDelete = validTags.slice(keepN);

            for (const t of tagsToDelete) {
                try {
                    console.log(`[Retention] Deleting ${repo}:${t.tag} (Digest: ${t.digest})`);
                    await registryService.deleteImage(repo, t.digest);
                    deletedAny = true;
                } catch (err) {
                    console.error(`[Retention] Failed to delete ${repo}:${t.tag} -`, err.message);
                }
            }
        }

        console.log('[Retention] Cleanup finished.');

        // Optionally trigger GC if things were deleted
        if (deletedAny) {
            console.log('[Retention] Tags were deleted. Triggering Garbage Collection...');
            try {
                // To maintain simplicity we make a local request to GC endpoint or reuse the logic.
                const socketPath = '/var/run/docker.sock';
                const containerName = process.env.REGISTRY_CONTAINER_NAME || 'registry';

                const execCreateUrl = `http://localhost/containers/${containerName}/exec`;
                const execCreateConfig = { socketPath, headers: { 'Content-Type': 'application/json' } };
                const execCreateBody = { AttachStdout: true, AttachStderr: true, Cmd: ["bin/registry", "garbage-collect", "/etc/docker/registry/config.yml"] };

                const createRes = await axios.post(execCreateUrl, execCreateBody, execCreateConfig);
                const execId = createRes.data.Id;

                const execStartUrl = `http://localhost/exec/${execId}/start`;
                const execStartConfig = { socketPath, headers: { 'Content-Type': 'application/json' } };
                const execStartBody = { Detach: false, Tty: false };

                await axios.post(execStartUrl, execStartBody, execStartConfig);
                console.log('[Retention] Garbage Collection triggered successfully.');
            } catch (gcErr) {
                console.error('[Retention] Error triggering Garbage Collection dynamically:', gcErr.message);
            }
        }

    } catch (err) {
        console.error('[Retention] Error during retention cleanup:', err.message);
    }
}

function initCron() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', () => {
        runRetentionCleanup();
    });
    console.log('Cron jobs initialized: Retention cleanup scheduled at 00:00 every day.');
}

module.exports = { initCron, runRetentionCleanup };
