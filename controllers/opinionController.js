const Opinion = require('../models/opinion');
const Corpus = require('../models/corpus');

/**
 * Get opinion list with pagination
 * GET /api/opinions
 */
exports.list = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        
        // Build filter
        const filter = { 
            userId: req.user._id, 
            archived: false 
        };
        
        // Add theme filter if provided
        if (req.query.theme) {
            filter.theme = req.query.theme;
        }

        const list = await Opinion.find(filter)
            .populate('sourceId', 'title content')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Opinion.countDocuments(filter);

        res.json({
            list,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch Opinions Error:', error);
        res.status(500).json({ error: '获取观点列表失败: ' + error.message });
    }
};

/**
 * Get single opinion detail
 * GET /api/opinions/:id
 */
exports.getOne = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const opinion = await Opinion.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        }).populate('sourceId', 'title content');

        if (!opinion) {
            return res.status(404).json({ error: '未找到该观点' });
        }

        res.json(opinion);
    } catch (error) {
        console.error('Get Opinion Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '获取详情失败: ' + error.message });
    }
};

/**
 * Update opinion
 * PUT /api/opinions/:id
 */
exports.update = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { 
            content, 
            theme, 
            subThemes, 
            tags, 
            supportingFacts, 
            criticalQuestion, 
            counterargument, 
            personalReflection 
        } = req.body;

        const opinion = await Opinion.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!opinion) {
            return res.status(404).json({ error: '未找到该观点' });
        }

        // Update fields
        if (content !== undefined) opinion.content = content;
        if (theme !== undefined) opinion.theme = theme;
        if (subThemes !== undefined) opinion.subThemes = subThemes;
        if (tags !== undefined) opinion.tags = tags;
        if (supportingFacts !== undefined) opinion.supportingFacts = supportingFacts;
        if (criticalQuestion !== undefined) opinion.criticalQuestion = criticalQuestion;
        if (counterargument !== undefined) opinion.counterargument = counterargument;
        if (personalReflection !== undefined) opinion.personalReflection = personalReflection;

        await opinion.save();

        console.log(`✅ Opinion updated: ${opinion._id}`);
        res.json(opinion);
    } catch (error) {
        console.error('Update Opinion Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '更新失败: ' + error.message });
    }
};

/**
 * Delete opinion
 * DELETE /api/opinions/:id
 */
exports.delete = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const result = await Opinion.deleteOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: '未找到该观点' });
        }

        // Update user statistics (non-blocking)
        if (typeof req.user.updateStatistics === 'function') {
            req.user.updateStatistics().catch(console.error);
        }

        console.log(`✅ Opinion deleted: ${req.params.id}`);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('Delete Opinion Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '删除失败: ' + error.message });
    }
};

/**
 * Get opinion statistics
 * GET /api/opinions/stats
 */
exports.getStats = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const stats = await Opinion.aggregate([
            { $match: { userId: req.user._id, archived: false } },
            {
                $group: {
                    _id: '$theme',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = await Opinion.countDocuments({ 
            userId: req.user._id, 
            archived: false 
        });

        res.json({
            total,
            byTheme: stats
        });
    } catch (error) {
        console.error('Get Opinion Stats Error:', error);
        res.status(500).json({ error: '获取统计失败: ' + error.message });
    }
};