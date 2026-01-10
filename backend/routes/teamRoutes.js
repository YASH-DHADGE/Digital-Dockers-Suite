const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getTeams,
    getTeam,
    getTeamMetrics,
    getGlobalMetrics,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamMembers,
    getAvailableUsers
} = require('../controllers/teamController');

// All routes require authentication
router.use(protect);

// Global metrics route (must come before :id routes)
router.get('/metrics/global', getGlobalMetrics);

// Get available users for team assignment (admin only)
router.get('/users/available', admin, getAvailableUsers);

// Team CRUD routes
router.route('/')
    .get(getTeams)
    .post(admin, createTeam);

router.route('/:id')
    .get(getTeam)
    .put(admin, updateTeam)
    .delete(admin, deleteTeam);

// Team-specific routes
router.get('/:id/metrics', getTeamMetrics);
router.put('/:id/members', admin, updateTeamMembers);

module.exports = router;
