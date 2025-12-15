const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
    word: { type: String, required: true },
    meaning: { type: String, required: true },
    originalSentence: { type: String, required: true },
    collocation: String,
    reason: String,
    usageScenario: String,
    mastered: { type: Boolean, default: false },
    reviewCount: { type: Number, default: 0 },
    lastReviewed: Date
}, { _id: false });

const corpusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    translation: {
        type: String,
        default: ''
    },
    summary: {
        type: String,
        default: ''
    },
    themes: {
        primary: { type: String, default: 'General', index: true },
        secondary: [String],
        custom: [String]
    },
    tags: [{ type: String, trim: true }],
    vocabulary: [vocabularySchema],
    metadata: {
        filename: String,
        fileType: String,
        fileSize: Number,
        wordCount: Number
    },
    archived: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp and word count
corpusSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.content) {
        this.metadata.wordCount = this.content.split(/\s+/).length;
    }
    next();
});

// Compound index for efficient queries
corpusSchema.index({ userId: 1, createdAt: -1 });
corpusSchema.index({ userId: 1, 'themes.primary': 1 });

module.exports = mongoose.model('Corpus', corpusSchema);