const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, getProjectStats, getWorkTypes } = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createProject).get(protect, getProjects);
router.route('/:id').get(protect, getProjectById);
router.route('/:id/stats').get(protect, getProjectStats);
router.route('/:id/work-types').get(protect, getWorkTypes);

module.exports = router;
