const express = require('express');
const router = express.Router();
const { getPullRequests, getHotspots, getRefactorTasks, getSummary } = require('../controllers/techDebtController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/prs', getPullRequests);
router.get('/hotspots', getHotspots);
router.get('/tasks', getRefactorTasks);
router.get('/summary', getSummary);

module.exports = router;
