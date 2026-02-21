const express = require('express');
const router = express.Router();
const { getNotificationSettings, updateNotificationSettings } = require('../controllers/settingsController');
const authenticateToken = require('../middleware/auth');

const { testEmailConfig } = require('../controllers/webhookController');

router.get('/notifications', authenticateToken(['admin']), getNotificationSettings);
router.post('/notifications', authenticateToken(['admin']), updateNotificationSettings);
router.post('/notifications/test', authenticateToken(['admin']), testEmailConfig);

module.exports = router;
