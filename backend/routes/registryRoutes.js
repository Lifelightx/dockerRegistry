const express = require('express');
const router = express.Router();
const { listRepositories, getRepositoryDetails, getTagDetails, deleteTag, getStatistics, triggerGC, scanImage, getScanStatus } = require('../controllers/registryController');
const authenticateToken = require('../middleware/auth');

// Note: Repo names can contain slashes. Express routing with params containing slashes requires care.
// For now, assuming simple repo names or clients encoding them correctly.

router.get('/repositories', authenticateToken(['admin', 'maintainer', 'user']), listRepositories);
router.get('/statistics', authenticateToken(['admin', 'maintainer', 'user']), getStatistics);
router.post('/gc', authenticateToken(['admin']), triggerGC);

// Scan routes
router.post('/repositories/:name/tags/:tag/scan', authenticateToken(['admin', 'maintainer']), scanImage);
router.get('/repositories/:name/tags/:tag/scan', authenticateToken(['admin', 'maintainer', 'user']), getScanStatus);

router.get('/repositories/:name', authenticateToken(['admin', 'maintainer', 'user']), getRepositoryDetails);
router.get('/repositories/:name/tags/:tag', authenticateToken(['admin', 'maintainer', 'user']), getTagDetails);
router.delete('/repositories/:name/tags/:tag', authenticateToken(['admin']), deleteTag);

// Retention routes
const { getPolicy, setPolicy, executePolicies } = require('../controllers/retentionController');
router.get('/retention/:repo', authenticateToken(['admin']), getPolicy);
router.post('/retention/:repo', authenticateToken(['admin']), setPolicy);
router.post('/retention/execute', authenticateToken(['admin']), executePolicies);

// Webhook handling
const { handleWebhook } = require('../controllers/webhookController');
// No authenticateToken here because it receives requests from the Docker registry daemon
router.post('/webhook', handleWebhook);

module.exports = router;