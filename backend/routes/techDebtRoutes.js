const express = require('express');
const router = express.Router();
const { getPullRequests, getHotspots, getRefactorTasks, getSummary, getGatekeeperFeed } = require('../controllers/techDebtController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/prs', getPullRequests);
router.get('/hotspots', getHotspots);
router.get('/tasks', getRefactorTasks);
router.get('/summary', getSummary);
router.get('/gatekeeper-feed', getGatekeeperFeed);

module.exports = router;
