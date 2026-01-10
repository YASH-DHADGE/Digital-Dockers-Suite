const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
    id: String,
    title: String,
    subtitle: String,
    type: {
        type: String,
        enum: ['title', 'content', 'image', 'conclusion', 'quote'],
        default: 'content'
    },
    content: [String],
    backgroundColor: { type: String, default: '#1a1a2e' },
    textColor: { type: String, default: '#ffffff' },
    accentColor: { type: String, default: '#0052cc' },
    layout: {
        type: String,
        enum: ['center', 'left', 'split'],
        default: 'center'
    },
    imageUrl: String,
    speaker_notes: String
}, { _id: false });

const presentationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    style: {
        type: String,
        enum: ['professional', 'creative', 'academic', 'business', 'startup'],
        default: 'professional'
    },
    theme: {
        type: String,
        enum: ['dark', 'light', 'vibrant'],
        default: 'dark'
    },
    slideCount: {
        type: Number,
        min: 3,
        max: 20,
        default: 5
    },
    slides: [slideSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Presentation', presentationSchema);
