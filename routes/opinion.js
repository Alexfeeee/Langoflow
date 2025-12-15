const mongoose = require('mongoose');

const opinionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Corpus',
        index: true
    },
    content: {
        type: String,
        required: true
    },
    theme: {
        type: String,
        required: true,
        index: true
    },
    subThemes: [String],
    tags: [String],
    supportingFacts: [String],
    criticalQuestion: String,
    counterargument: String,
    personalReflection: String,
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

opinionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

opinionSchema.index({ userId: 1, createdAt: -1 });
opinionSchema.index({ userId: 1, theme: 1 });

module.exports = mongoose.model('Opinion', opinionSchema);