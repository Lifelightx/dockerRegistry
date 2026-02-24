const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const iamController = require('../controllers/iamController');

// All IAM routes require basic authentication
router.use(authenticateToken());

// Group CRUD
router.get('/groups', iamController.getGroups);
router.post('/groups', iamController.createGroup);
router.delete('/groups/:id', iamController.deleteGroup);

// Group Members
router.get('/groups/:id/members', iamController.getGroupMembers);
router.post('/groups/:id/members', iamController.addGroupMember);
router.put('/groups/:id/members/:userId', iamController.updateGroupMemberRole);
router.delete('/groups/:id/members/:userId', iamController.removeGroupMember);

// Group Repositories
router.get('/groups/:id/repositories', iamController.getGroupRepositories);
router.post('/groups/:id/repositories', iamController.addGroupRepository);
router.delete('/groups/:id/repositories/:repoName', iamController.removeGroupRepository);

module.exports = router;
