const registryService = require('../services/registryService');
const axios = require('axios');
const { signToken } = require('../utils/jwt');
const pool = require('../config/db');

const listRepositories = async (req, res) => {
    try {
        const repos = await registryService.getCatalog();

        // Fetch stats for all repos in one query for efficiency
        const statsResult = await pool.query(`
            SELECT repository, action, COUNT(*) as count 
            FROM registry_stats 
            WHERE action IN ('push', 'pull') 
            GROUP BY repository, action
        `);

        // Create a map for quick lookup: repoName -> { push: N, pull: M }
        const statsMap = {};
        statsResult.rows.forEach(row => {
            if (!statsMap[row.repository]) {
                statsMap[row.repository] = { push: 0, pull: 0 };
            }
            statsMap[row.repository][row.action] = parseInt(row.count);
        });

        // Enrich with basic tag info for the dashboard
        const enrichedRepos = await Promise.all(repos.map(async (name) => {
            try {
                const tags = await registryService.getTags(name);
                const repoStats = statsMap[name] || { push: 0, pull: 0 };
                return {
                    name,
                    tagsCount: tags.length,
                    tags: tags.slice(0, 5),
                    pushCount: repoStats.push,
                    pullCount: repoStats.pull
                };
            } catch (e) {
                return { name, tagsCount: 0, tags: [], pushCount: 0, pullCount: 0 };
            }
        }));

        res.json(enrichedRepos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch repositories' });
    }
};

const getRepositoryDetails = async (req, res) => {
    try {
        const { name } = req.params;
        const tags = await registryService.getTags(name);

        // Return public registry URL for UI
        const registryHost = process.env.REGISTRY_INTERNAL_HOST || 'localhost:5000';

        res.json({ name, tags, registryHost });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch repository details' });
    }
};

const getTagDetails = async (req, res) => {
    try {
        const { name, tag } = req.params;
        const { manifest, digest } = await registryService.getManifest(name, tag);

        let created = null;
        let history = [];
        let architecture;
        let os;

        // Try to fetch Config Blob to get Creation Date and History
        // V2 Schema 2
        if (manifest.config && manifest.config.digest) {
            try {
                const config = await registryService.getBlob(name, manifest.config.digest);
                if (config.created) created = config.created;
                if (config.history) history = config.history;
                architecture = config.architecture;
                os = config.os;
            } catch (e) {
                console.warn(`Failed to fetch config blob for ${name}:${tag}`, e.message);
            }
        }
        // V1 Compatibility (Schema 1)
        else if (manifest.history && manifest.history.length > 0) {
            try {
                const v1Compatibility = JSON.parse(manifest.history[0].v1Compatibility);
                if (v1Compatibility.created) created = v1Compatibility.created;
                if (v1Compatibility.architecture) architecture = v1Compatibility.architecture;
                if (v1Compatibility.os) os = v1Compatibility.os;
            } catch (e) { }
        }

        // Fetch repo stats
        const repoStatsResult = await pool.query(
            "SELECT action, COUNT(*) as count FROM registry_stats WHERE repository = $1 AND action IN ('push', 'pull') GROUP BY action",
            [name]
        );
        const repoStats = { push: 0, pull: 0 };
        repoStatsResult.rows.forEach(row => {
            repoStats[row.action] = parseInt(row.count);
        });

        let pushedBy = 'Unknown';
        if (created) {
            const createdDate = new Date(created);
            const pusherResult = await pool.query(
                "SELECT username FROM registry_stats WHERE repository = $1 AND action = 'push' AND timestamp >= $2 ORDER BY timestamp ASC LIMIT 1",
                [name, createdDate]
            );
            if (pusherResult.rows.length > 0) {
                pushedBy = pusherResult.rows[0].username;
            }
        }

        res.json({
            name,
            tag,
            digest,
            size: manifest.layers?.reduce((acc, l) => acc + l.size, 0) || 0,
            created,
            architecture,
            os,
            history,
            manifest,
            stats: repoStats,
            pushedBy
        });
    } catch (err) {
        if (err.isAxiosError && err.response && err.response.status === 404) {
            console.warn(`Tag detail fetch 404: ${req.params.name}:${req.params.tag}`);
            return res.status(404).json({ message: 'Tag manifest not found' });
        }
        console.error(err.message);
        res.status(500).json({ message: 'Failed to fetch tag details' });
    }
}

const deleteTag = async (req, res) => {
    try {
        const { name, tag } = req.params;
        // 1. Get digest
        const { digest } = await registryService.getManifest(name, tag);
        if (!digest) return res.status(404).json({ message: 'Tag not found' });

        // 2. Delete digest
        await registryService.deleteImage(name, digest);

        // 3. Remove the tag folder directly from the registry container (to fix the Docker Registry V2 phantom tag issue)
        try {
            const axios = require('axios');
            const containerName = process.env.REGISTRY_CONTAINER_NAME || 'registry';
            const socketConfig = { socketPath: '/var/run/docker.sock', headers: { 'Content-Type': 'application/json' } };
            const execCreateBody = {
                AttachStdout: true,
                AttachStderr: true,
                Cmd: ["rm", "-rf", `/var/lib/registry/docker/registry/v2/repositories/${name}/_manifests/tags/${tag}`]
            };
            const createRes = await axios.post(`http://localhost/containers/${containerName}/exec`, execCreateBody, socketConfig);
            await axios.post(`http://localhost/exec/${createRes.data.Id}/start`, { Detach: false, Tty: false }, socketConfig);
        } catch (e) {
            console.error('Failed to hard delete tag folder:', e.message);
        }

        res.json({ message: 'Image deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete image' });
    }
};

const deleteRepository = async (req, res) => {
    try {
        const { name } = req.params;

        // 1. Remove from database
        await pool.query("DELETE FROM registry_stats WHERE repository = $1", [name]);
        await pool.query("DELETE FROM vulnerability_scans WHERE repository = $1", [name]);

        // 2. Remove the entire repository folder from the registry container
        try {
            const axios = require('axios');
            const containerName = process.env.REGISTRY_CONTAINER_NAME || 'registry';
            const socketConfig = { socketPath: '/var/run/docker.sock', headers: { 'Content-Type': 'application/json' } };
            const execCreateBody = {
                AttachStdout: true,
                AttachStderr: true,
                Cmd: ["rm", "-rf", `/var/lib/registry/docker/registry/v2/repositories/${name}`]
            };
            const createRes = await axios.post(`http://localhost/containers/${containerName}/exec`, execCreateBody, socketConfig);
            await axios.post(`http://localhost/exec/${createRes.data.Id}/start`, { Detach: false, Tty: false }, socketConfig);
        } catch (e) {
            console.error('Failed to hard delete repository folder:', e.message);
            return res.status(500).json({ message: 'Failed to physically delete repository' });
        }

        res.json({ message: 'Repository deleted successfully' });
    } catch (err) {
        console.error('Error deleting repository:', err);
        res.status(500).json({ message: 'Failed to delete repository' });
    }
};

const getStatistics = async (req, res) => {
    try {
        const totalPushes = await pool.query("SELECT COUNT(*) FROM registry_stats WHERE action = 'push'");
        const totalPulls = await pool.query("SELECT COUNT(*) FROM registry_stats WHERE action = 'pull'");
        const recentActivity = await pool.query("SELECT * FROM registry_stats ORDER BY timestamp DESC LIMIT 10");

        res.json({
            totalPushes: parseInt(totalPushes.rows[0].count),
            totalPulls: parseInt(totalPulls.rows[0].count),
            recentActivity: recentActivity.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
};

const triggerGC = async (req, res) => {
    try {
        const socketPath = '/var/run/docker.sock';
        const containerName = process.env.REGISTRY_CONTAINER_NAME || 'registry';

        // 1. Create Exec Instance
        const execCreateUrl = `http://localhost/containers/${containerName}/exec`;
        const execCreateConfig = {
            socketPath,
            headers: { 'Content-Type': 'application/json' }
        };
        const execCreateBody = {
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ["bin/registry", "garbage-collect", "/etc/docker/registry/config.yml"]
        };

        const createRes = await axios.post(execCreateUrl, execCreateBody, execCreateConfig);
        const execId = createRes.data.Id;

        // 2. Start Exec Instance
        const execStartUrl = `http://localhost/exec/${execId}/start`;
        const execStartConfig = {
            socketPath,
            headers: { 'Content-Type': 'application/json' }
        };
        const execStartBody = {
            Detach: false,
            Tty: false
        };

        const startRes = await axios.post(execStartUrl, execStartBody, execStartConfig);
        res.json({ message: 'Garbage Collection triggered', output: startRes.data });

    } catch (err) {
        console.error('GC Trigger Error:', err.message);
        if (err.response) {
            console.error('Docker API Error:', err.response.data);
            return res.status(500).json({ message: 'Failed to trigger GC: ' + (err.response.data.message || err.message) });
        }
        res.status(500).json({ message: 'Failed to trigger GC' });
    }
};

const scanImage = async (req, res) => {
    try {
        const { name, tag } = req.params;
        const digest = req.body.digest || '';

        // 1. Upsert as pending
        const existing = await pool.query(
            "SELECT * FROM vulnerability_scans WHERE repository = $1 AND tag = $2",
            [name, tag]
        );

        if (existing.rows.length > 0 && existing.rows[0].scan_status === 'pending') {
            return res.json({ message: 'Scan already in progress', status: 'pending' });
        }

        if (existing.rows.length === 0) {
            await pool.query(
                "INSERT INTO vulnerability_scans (repository, tag, digest, scan_status) VALUES ($1, $2, $3, 'pending')",
                [name, tag, digest]
            );
        } else {
            await pool.query(
                "UPDATE vulnerability_scans SET scan_status = 'pending', last_scanned = CURRENT_TIMESTAMP WHERE repository = $1 AND tag = $2",
                [name, tag]
            );
        }

        // 2. Respond immediately; run scan in background
        res.json({ message: 'Scan started', status: 'pending' });

        (async () => {
            const containerName = `trivy_scan_${Date.now()}`;
            const socketConfig = { socketPath: '/var/run/docker.sock' };

            try {
                const network = process.env.REGISTRY_NETWORK || 'registryui_default';
                const registryHost = process.env.REGISTRY_INTERNAL_HOST || 'localhost:5000';
                const imageRef = `${registryHost}/${name}:${tag}`;

                const trivyToken = signToken('admin', [{ type: 'repository', name: name, actions: ['pull'] }]);

                const createBody = {
                    Image: 'aquasec/trivy:latest',
                    Cmd: ['image', '--format', 'json', '--insecure', imageRef],
                    Env: [
                        `TRIVY_REGISTRY_TOKEN=${trivyToken}`,
                        'TRIVY_INSECURE=true',
                        `TRIVY_SERVER=${process.env.TRIVY_SERVER || 'http://localhost:4954'}`
                    ],
                    HostConfig: {
                        AutoRemove: false,  // MUST be false — we read logs after container stops
                        NetworkMode: 'host',
                    }
                };

                // Create container
                await axios.post(
                    `http://localhost/containers/create?name=${containerName}`,
                    createBody,
                    { ...socketConfig, headers: { 'Content-Type': 'application/json' } }
                );

                // Start container
                await axios.post(`http://localhost/containers/${containerName}/start`, {}, socketConfig);

                // Wait for container to finish
                const waitRes = await axios.post(`http://localhost/containers/${containerName}/wait`, {}, socketConfig);
                const exitCode = waitRes.data.StatusCode;

                // Read logs (stdout + stderr)
                const logsRes = await axios.get(
                    `http://localhost/containers/${containerName}/logs?stdout=true&stderr=true`,
                    { ...socketConfig, responseType: 'arraybuffer' }
                );

                // Parse Docker multiplex format: [type(1)][0,0,0(3)][size(4)][payload]
                const rawBuf = Buffer.from(logsRes.data);
                let stdoutStr = '';
                let stderrStr = '';
                let pos = 0;
                while (pos < rawBuf.length) {
                    const streamType = rawBuf[pos];
                    const frameSize = rawBuf.readUInt32BE(pos + 4);
                    const payload = rawBuf.subarray(pos + 8, pos + 8 + frameSize).toString('utf8');
                    if (streamType === 1) stdoutStr += payload;
                    else stderrStr += payload;
                    pos += 8 + frameSize;
                }

                // Cleanup container
                await axios.delete(`http://localhost/containers/${containerName}?force=true`, socketConfig)
                    .catch(() => { });

                if (exitCode !== 0) {
                    console.error(`[Trivy] Exit code ${exitCode}.\nStderr: ${stderrStr.slice(0, 600)}`);
                    throw new Error(`Trivy failed (code ${exitCode}): ${stderrStr.slice(0, 200)}`);
                }

                // Parse the JSON report
                const report = JSON.parse(stdoutStr);
                // Aggregate ALL result sections (OS, npm, pip, etc.)
                const allVulns = (report.Results || []).flatMap(r => r.Vulnerabilities || []);

                const summary = {
                    Critical: allVulns.filter(v => v.Severity === 'CRITICAL').length,
                    High: allVulns.filter(v => v.Severity === 'HIGH').length,
                    Medium: allVulns.filter(v => v.Severity === 'MEDIUM').length,
                    Low: allVulns.filter(v => v.Severity === 'LOW').length,
                };

                await pool.query(
                    "UPDATE vulnerability_scans SET scan_status = 'completed', severity_summary = $1, vulnerabilities = $2, last_scanned = CURRENT_TIMESTAMP WHERE repository = $3 AND tag = $4",
                    [JSON.stringify(summary), JSON.stringify(allVulns), name, tag]
                );

                console.log(`[Trivy] Scan completed for ${name}:${tag} — ${allVulns.length} vulnerabilities.`);

            } catch (err) {
                console.error('[Trivy] Async Scan Error:', err.message);
                await axios.delete(
                    `http://localhost/containers/${containerName}?force=true`,
                    socketConfig
                ).catch(() => { });
                await pool.query(
                    "UPDATE vulnerability_scans SET scan_status = 'failed' WHERE repository = $1 AND tag = $2",
                    [name, tag]
                );
            }
        })();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to trigger scan' });
    }
};

const getScanStatus = async (req, res) => {
    try {
        const { name, tag } = req.params;
        const result = await pool.query(
            "SELECT * FROM vulnerability_scans WHERE repository = $1 AND tag = $2",
            [name, tag]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json({ scan_status: 'unscanned' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch scan status' });
    }
};

module.exports = { listRepositories, getRepositoryDetails, getTagDetails, deleteTag, deleteRepository, getStatistics, triggerGC, scanImage, getScanStatus };
