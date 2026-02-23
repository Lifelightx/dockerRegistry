const axios = require('axios');
const { signToken } = require('../utils/jwt');
const https = require('https');
const fs = require('fs');
const path = require('path');

const REGISTRY_URL = process.env.REGISTRY_PUBLIC_URL || 'http://localhost:5000';

const getAdminToken = (scope) => {
    let access = [];
    if (scope === 'catalog') {
        access.push({ type: 'registry', name: 'catalog', actions: ['*'] });
    } else if (scope.startsWith('repository:')) {
        const parts = scope.split(':');
        if (parts.length >= 3) {
            const name = parts[1];
            const actions = parts[2].split(',');
            access.push({ type: 'repository', name: name, actions: actions });
        }
    }

    return signToken('internal-admin', access);
};

const getCatalog = async () => {
    try {
        const token = getAdminToken('catalog');
        const response = await axios.get(`${REGISTRY_URL}/v2/_catalog`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.repositories || [];
    } catch (error) {
        console.error('Error fetching catalog:', error.message);
        throw error;
    }
};

const getTags = async (repoName) => {
    try {
        const token = getAdminToken(`repository:${repoName}:pull`);
        const response = await axios.get(`${REGISTRY_URL}/v2/${repoName}/tags/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.tags || [];
    } catch (error) {
        if (error.response && error.response.status === 404) return [];
        console.error(`Error fetching tags for ${repoName}:`, error.message);
        throw error;
    }
};

const getManifest = async (repoName, reference) => {
    try {
        const token = getAdminToken(`repository:${repoName}:pull`);
        // Accept header is crucial. We must accept info about Manifests, Manifest Lists, OCI Manifests, and OCI Indexes.
        const response = await axios.get(`${REGISTRY_URL}/v2/${repoName}/manifests/${reference}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': [
                    'application/vnd.docker.distribution.manifest.v2+json',
                    'application/vnd.docker.distribution.manifest.list.v2+json',
                    'application/vnd.oci.image.manifest.v1+json',
                    'application/vnd.oci.image.index.v1+json'
                ].join(', ')
            }
        });

        const contentType = response.headers['content-type'];
        const isIndex = contentType?.includes('manifest.list') || contentType?.includes('image.index');

        if (isIndex && response.data.manifests) {
            // Select platform (Default to linux/amd64, or fallback to first)
            const platforms = response.data.manifests;
            const target = platforms.find(p => p.platform?.architecture === 'amd64' && p.platform?.os === 'linux')
                || platforms.find(p => p.platform?.architecture === 'arm64' && p.platform?.os === 'linux') // Fallback common
                || platforms[0]; // Fallback any

            if (target && target.digest) {
                console.log(`Resolved OCI Index ${reference} to ${target.digest} (${target.platform?.os}/${target.platform?.architecture})`);
                // Recursive call to get the actual manifest
                return getManifest(repoName, target.digest);
            }
        }

        // Digest is in Docker-Content-Digest header
        const digest = response.headers['docker-content-digest'];
        return { manifest: response.data, digest };
    } catch (error) {
        console.error(`Error fetching manifest for ${repoName}:${reference}:`, error.message);
        // Throwing error allows the controller to handle it (e.g. 404)
        throw error;
    }
};

const deleteImage = async (repoName, digest) => {
    try {
        const token = getAdminToken(`repository:${repoName}:pull,push,*`);
        const response = await axios.delete(`${REGISTRY_URL}/v2/${repoName}/manifests/${digest}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.status === 202;
    } catch (error) {
        console.error(`Error deleting image ${repoName}:${digest}:`, error.message);
        throw error;
    }
}

const getBlob = async (repoName, digest) => {
    try {
        const token = getAdminToken(`repository:${repoName}:pull`);
        const response = await axios.get(`${REGISTRY_URL}/v2/${repoName}/blobs/${digest}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching blob ${repoName}:${digest}:`, error.message);
        throw error;
    }
};

module.exports = { getCatalog, getTags, getManifest, deleteImage, getBlob };
