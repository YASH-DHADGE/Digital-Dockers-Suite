const mongoose = require('mongoose');

const communicationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sessionType: {
        type: String,
        enum: ['voice_translation', 'communication_coaching', 'voice_to_task'],
        required: true
    },
    input: {
        text: String,
        audioFile: String,
        language: String
    },
    output: {
        translatedText: String,
        translatedAudio: String,
        targetLanguage: String,
        coaching: {
            analysis: String,
            strengths: [String],
            improvements: [String],
            toneScore: Number,
            clarityScore: Number,
            suggestions: [String]
        },
        extractedTasks: [{
            title: String,
            priority: String,
            dueDate: Date
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Communication', communicationSchema);
