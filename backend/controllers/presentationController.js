const asyncHandler = require('express-async-handler');
const Presentation = require('../models/Presentation');
const { generatePresentation } = require('../services/openaiSlideService');

// @desc    Create a new presentation using AI
// @route   POST /api/presentations
// @access  Private
const createPresentation = asyncHandler(async (req, res) => {
    const { topic, slideCount, style, theme } = req.body;

    // Validate input
    if (!topic || topic.trim().length === 0) {
        res.status(400);
        throw new Error('Topic is required');
    }

    const validSlideCount = Math.min(Math.max(parseInt(slideCount) || 5, 3), 20);
    const validStyle = ['professional', 'creative', 'academic', 'business', 'startup'].includes(style)
        ? style
        : 'professional';
    const validTheme = ['dark', 'light', 'vibrant'].includes(theme)
        ? theme
        : 'dark';

    try {
        // Generate slides using AI
        const generated = await generatePresentation(
            topic.trim(),
            validSlideCount,
            validStyle,
            validTheme
        );

        // Save to database
        const presentation = await Presentation.create({
            user: req.user._id,
            title: generated.title,
            topic: topic.trim(),
            style: validStyle,
            theme: validTheme,
            slideCount: validSlideCount,
            slides: generated.slides
        });

        res.status(201).json({
            success: true,
            presentationId: presentation._id,
            title: presentation.title,
            slideCount: presentation.slides.length
        });

    } catch (error) {
        console.error('Presentation generation error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to generate presentation');
    }
});

// @desc    Get a presentation by ID
// @route   GET /api/presentations/:id
// @access  Private
const getPresentationById = asyncHandler(async (req, res) => {
    const presentation = await Presentation.findById(req.params.id);

    if (!presentation) {
        res.status(404);
        throw new Error('Presentation not found');
    }

    // Optional: Check ownership
    // if (presentation.user.toString() !== req.user._id.toString()) {
    //     res.status(403);
    //     throw new Error('Not authorized');
    // }

    res.json(presentation);
});

// @desc    Get all presentations for current user
// @route   GET /api/presentations
// @access  Private
const getMyPresentations = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    const presentations = await Presentation.find({ user: req.user._id })
        .select('title topic style theme slideCount createdAt')
        .sort({ createdAt: -1 })
        .limit(limit);

    res.json(presentations);
});

// @desc    Delete a presentation
// @route   DELETE /api/presentations/:id
// @access  Private
const deletePresentation = asyncHandler(async (req, res) => {
    const presentation = await Presentation.findById(req.params.id);

    if (!presentation) {
        res.status(404);
        throw new Error('Presentation not found');
    }

    // Check ownership
    if (presentation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this presentation');
    }

    await presentation.deleteOne();

    res.json({ success: true, message: 'Presentation deleted' });
});

module.exports = {
    createPresentation,
    getPresentationById,
    getMyPresentations,
    deletePresentation
};
