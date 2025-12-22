const express = require('express');
const router = express.Router();
const { createTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createTask);
router.get('/', protect, getTasks);

module.exports = router;
