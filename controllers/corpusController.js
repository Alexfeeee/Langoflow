const mongoose = require('mongoose');
const Corpus = require('../models/corpus');
const Opinion = require('../models/opinion');

/**
 * Helper: Format and validate themes structure
 */
const formatThemes = (themes) => {
    if (!themes) {
        return { primary: 'General', secondary: [], custom: [] };
    }
    
    // Handle legacy array format
    if (Array.isArray(themes)) {
        return {
            primary: themes[0] || 'General',
            secondary: themes.slice(1) || [],
            custom: []
        };
    }
    
    // Validate object format
    if (typeof themes === 'object') {
        return {
            primary: themes.primary || 'General',
            secondary: Array.isArray(themes.secondary) ? themes.secondary : [],
            custom: Array.isArray(themes.custom) ? themes.custom : []
        };
    }
    
    return { primary: 'General', secondary: [], custom: [] };
};

/**
 * Create corpus entry (with automatic opinion extraction)
 * POST /api/corpus
 */
exports.create = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            content, 
            rawText, 
            title, 
            translation, 
            summary, 
            themes, 
            tags, 
            vocabulary, 
            opinion,
            fileInfo 
        } = req.body;

        if (!req.user || !req.user._id) {
            throw new Error('User not authenticated');
        }

        const userId = req.user._id;
        
        // Validate required fields
        const textContent = content || rawText || '';
        if (!textContent.trim()) {
            await session.abortTransaction();
            return res.status(400).json({ error: '文本内容不能为空' });
        }

        // Build corpus data
        const corpusData = {
            userId,
            title: title || (fileInfo?.name) || '无标题文档',
            content: textContent,
            translation: translation || '',
            summary: summary || '',
            themes: formatThemes(themes),
            tags: Array.isArray(tags) ? tags : [],
            vocabulary: Array.isArray(vocabulary) ? vocabulary : [],
            metadata: {
                filename: fileInfo?.name || 'unknown',
                fileType: fileInfo?.type || 'text',
                fileSize: fileInfo?.size || 0
            }
        };

        const newCorpus = new Corpus(corpusData);
        await newCorpus.save({ session });

        // Save opinion if exists
        if (opinion && (opinion.coreViewpoint || opinion.core_viewpoint)) {
            try {
                const coreContent = opinion.coreViewpoint || opinion.core_viewpoint;
                const opinionTheme = corpusData.themes.primary || 'General';

                const opinionData = {
                    userId,
                    sourceId: newCorpus._id,
                    content: coreContent,
                    theme: opinionTheme,
                    subThemes: corpusData.themes.secondary || [],
                    tags: corpusData.tags || [],
                    supportingFacts: opinion.supportingEvidence || opinion.supporting_evidence || [],
                    criticalQuestion: opinion.criticalQuestion || opinion.critical_question || '',
                    counterargument: opinion.counterargument || '',
                    personalReflection: req.body.personalReflection || ''
                };

                const newOpinion = new Opinion(opinionData);
                await newOpinion.save({ session });
            } catch (opinionError) {
                console.error('Opinion save error (non-critical):', opinionError);
                // Continue even if opinion fails
            }
        }

        await session.commitTransaction();
        
        // Update user statistics (non-blocking)
        if (typeof req.user.updateStatistics === 'function') {
            req.user.updateStatistics().catch(err => 
                console.error('Stats update error:', err)
            );
        }

        console.log(`✅ Corpus created: ${corpusData.title} (${vocabulary?.length || 0} vocab items)`);
        res.status(201).json(newCorpus);

    } catch (error) {
        await session.abortTransaction();
        console.error('Create Corpus Error:', error);
        res.status(500).json({ error: '保存失败: ' + error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Get corpus list with pagination and filtering
 * GET /api/corpus
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
            filter['themes.primary'] = req.query.theme;
        }
        
        // Add search filter if provided
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const list = await Corpus.find(filter)
            .select('title content themes vocabulary tags createdAt summary')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance
            
        const total = await Corpus.countDocuments(filter);

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
        console.error('List Corpus Error:', error);
        res.status(500).json({ error: '获取列表失败: ' + error.message });
    }
};

/**
 * Get single corpus detail
 * GET /api/corpus/:id
 */
exports.getOne = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const corpus = await Corpus.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!corpus) {
            return res.status(404).json({ error: '未找到该语料' });
        }

        res.json(corpus);
    } catch (error) {
        console.error('Get Corpus Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '获取详情失败: ' + error.message });
    }
};

/**
 * Update corpus
 * PUT /api/corpus/:id
 */
exports.update = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { content, translation, vocabulary, themes, tags, title, summary } = req.body;
        
        const corpus = await Corpus.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!corpus) {
            return res.status(404).json({ error: '未找到该语料' });
        }

        // Update fields
        if (title !== undefined) corpus.title = title;
        if (content !== undefined) corpus.content = content;
        if (translation !== undefined) corpus.translation = translation;
        if (summary !== undefined) corpus.summary = summary;
        if (vocabulary !== undefined) corpus.vocabulary = vocabulary;
        if (themes !== undefined) corpus.themes = formatThemes(themes);
        if (tags !== undefined) corpus.tags = tags;

        await corpus.save();

        // Update statistics (non-blocking)
        if (typeof req.user.updateStatistics === 'function') {
            req.user.updateStatistics().catch(console.error);
        }

        console.log(`✅ Corpus updated: ${corpus.title}`);
        res.json(corpus);
    } catch (error) {
        console.error('Update Corpus Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '更新失败: ' + error.message });
    }
};

/**
 * Delete corpus (hard delete with cascade)
 * DELETE /api/corpus/:id
 */
exports.delete = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!req.user || !req.user._id) {
            await session.abortTransaction();
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Delete corpus
        const result = await Corpus.deleteOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        }).session(session);

        if (result.deletedCount === 0) {
            await session.abortTransaction();
            return res.status(404).json({ error: '未找到该语料' });
        }
        
        // Cascade delete related opinions
        await Opinion.deleteMany({ 
            sourceId: req.params.id 
        }).session(session);

        await session.commitTransaction();

        // Update statistics (non-blocking)
        if (typeof req.user.updateStatistics === 'function') {
            req.user.updateStatistics().catch(console.error);
        }

        console.log(`✅ Corpus deleted: ${req.params.id}`);
        res.json({ message: '删除成功' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Delete Corpus Error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: '无效的ID格式' });
        }
        
        res.status(500).json({ error: '删除失败: ' + error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Get corpus statistics
 * GET /api/corpus/stats
 */
exports.getStats = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const stats = await Corpus.aggregate([
            { $match: { userId: req.user._id, archived: false } },
            {
                $group: {
                    _id: '$themes.primary',
                    count: { $sum: 1 },
                    totalVocab: { $sum: { $size: '$vocabulary' } }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = await Corpus.countDocuments({ 
            userId: req.user._id, 
            archived: false 
        });

        res.json({
            total,
            byTheme: stats,
            totalVocabulary: stats.reduce((sum, s) => sum + s.totalVocab, 0)
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({ error: '获取统计失败: ' + error.message });
    }
};