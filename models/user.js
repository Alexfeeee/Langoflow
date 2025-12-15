const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 6
        // TODO: Hash with bcrypt in production
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true // Allow null but must be unique if provided
    },
    statistics: {
        totalCorpus: { type: Number, default: 0 },
        totalVocabulary: { type: Number, default: 0 },
        totalOpinions: { type: Number, default: 0 },
        lastActive: { type: Date, default: Date.now }
    },
    settings: {
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'zh-CN' },
        notifications: { type: Boolean, default: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to update statistics
userSchema.methods.updateStatistics = async function() {
    try {
        const Corpus = mongoose.model('Corpus');
        const Opinion = mongoose.model('Opinion');
        
        const corpusCount = await Corpus.countDocuments({ 
            userId: this._id, 
            archived: false 
        });
        
        const opinionCount = await Opinion.countDocuments({ 
            userId: this._id, 
            archived: false 
        });
        
        // Count total vocabulary items
        const vocabResult = await Corpus.aggregate([
            { $match: { userId: this._id, archived: false } },
            { $project: { vocabCount: { $size: '$vocabulary' } } },
            { $group: { _id: null, total: { $sum: '$vocabCount' } } }
        ]);
        
        this.statistics.totalCorpus = corpusCount;
        this.statistics.totalOpinions = opinionCount;
        this.statistics.totalVocabulary = vocabResult[0]?.total || 0;
        this.statistics.lastActive = Date.now();
        
        await this.save();
        
        console.log(`📊 Statistics updated for user: ${this.username}`);
    } catch (error) {
        console.error('Update statistics error:', error);
    }
};

module.exports = mongoose.model('User', userSchema);