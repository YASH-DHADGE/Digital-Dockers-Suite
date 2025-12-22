const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const { getOrgTree } = require('../controllers/orgController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/org-tree', getOrgTree);

router.use(admin);

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);

module.exports = router;
