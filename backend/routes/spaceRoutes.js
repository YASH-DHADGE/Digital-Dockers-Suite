const express = require('express');
const {
  createSpace,
  getProjectSpaces,
  getSpace,
  updateSpace,
  deleteSpace,
  getVersionHistory,
  revertToVersion
} = require('../controllers/spaceController');

const {
  updateContent,
  getContentDiff,
  autosaveContent
} = require('../controllers/spaceContentController');

const {
  addMember,
  updateMemberRole,
  removeMember,
  getMembers
} = require('../controllers/spaceMemberController');

const { protect } = require('../middlewares/authMiddleware');
const { spacePermissionCheck } = require('../middlewares/spaceMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

/**
 * Space CRUD Routes
 */

// Create space
router.post('/', createSpace);

// Get spaces for a project
router.get('/project/:projectId', getProjectSpaces);

// Get single space with content
router.get('/:spaceId', spacePermissionCheck, getSpace);

// Update space metadata
router.patch('/:spaceId', spacePermissionCheck, updateSpace);

// Delete/archive space
router.delete('/:spaceId', spacePermissionCheck, deleteSpace);

/**
 * Content Routes
 */

// Update content
router.patch('/:spaceId/content', spacePermissionCheck, updateContent);

// Autosave content
router.post('/:spaceId/autosave', spacePermissionCheck, autosaveContent);

// Get version history
router.get('/:spaceId/versions', spacePermissionCheck, getVersionHistory);

// Revert to version
router.post('/:spaceId/versions/:versionId/revert', spacePermissionCheck, revertToVersion);

// Get diff between versions
router.get('/:spaceId/content/diff/:v1/:v2', spacePermissionCheck, getContentDiff);

/**
 * Member Management Routes
 */

// Get space members
router.get('/:spaceId/members', spacePermissionCheck, getMembers);

// Add member
router.post('/:spaceId/members', spacePermissionCheck, addMember);

// Update member role
router.patch('/:spaceId/members/:memberId', spacePermissionCheck, updateMemberRole);

// Remove member
router.delete('/:spaceId/members/:memberId', spacePermissionCheck, removeMember);

module.exports = router;
