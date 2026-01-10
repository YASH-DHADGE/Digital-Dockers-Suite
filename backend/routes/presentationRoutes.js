const express = require('express');
const router = express.Router();
const {
    createPresentation,
    getPresentationById,
    getMyPresentations,
    deletePresentation
} = require('../controllers/presentationController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// POST /api/presentations - Generate new presentation
router.post('/', createPresentation);

// GET /api/presentations - Get user's presentations
router.get('/', getMyPresentations);

// GET /api/presentations/:id - Get single presentation
router.get('/:id', getPresentationById);

// DELETE /api/presentations/:id - Delete presentation
router.delete('/:id', deletePresentation);

module.exports = router;
