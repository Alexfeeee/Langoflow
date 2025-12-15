const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // 确保已安装: npm install axios

// 豆包 AI 配置
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL_ID = process.env.AI_MODEL_ID;
const AI_API_URL = process.env.AI_API_URL;

// 导入模型
const User = require('./models/user');
const Corpus = require('./models/corpus');
const Opinion = require('./models/opinion');

// 导入控制器
const authController = require('./controllers/authController');
const corpusController = require('./controllers/corpusController');
const opinionController = require('./controllers/opinionController');

// 导入中间件
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english_corpus';

// === 中间件配置 ===
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:8080', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5500',  // 👈 新增这一行 (VS Code Live Server)
        'http://localhost:5500'   // 👈 顺便把 localhost 也加上，以防万一
    ],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|docx|doc|mp3|wav/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('不支持的文件类型'));
    }
});

// === 数据库连接 ===
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB 连接成功');
})
.catch(err => {
    console.error('❌ MongoDB 连接失败:', err);
    process.exit(1);
});

// === 路由 ===

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// 认证路由
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', auth, authController.getMe);
app.put('/api/auth/profile', auth, authController.updateProfile);

// 语料库路由
app.post('/api/corpus', auth, corpusController.create);
app.get('/api/corpus', auth, corpusController.list);
app.get('/api/corpus/stats', auth, corpusController.getStats);
app.get('/api/corpus/:id', auth, corpusController.getOne);
app.put('/api/corpus/:id', auth, corpusController.update);
app.delete('/api/corpus/:id', auth, corpusController.delete);

// 观点路由
app.get('/api/opinions', auth, opinionController.list);
app.get('/api/opinions/stats', auth, opinionController.getStats);
app.get('/api/opinions/:id', auth, opinionController.getOne);
app.put('/api/opinions/:id', auth, opinionController.update);
app.delete('/api/opinions/:id', auth, opinionController.delete);

// 文件处理路由（示例 - 需要根据实际AI服务调整）
// ========== 在路由部分添加以下4个AI端点 ==========

// 1. 🔍 Context Detective - 解释单词在句子中的含义
app.post('/ai/context-explain', async (req, res) => {
    try {
        const { word, fullSentence } = req.body;
        
        const response = await axios.post(AI_API_URL, {
            model: AI_MODEL_ID,
            messages: [{
                role: 'system',
                content: `You are a Context Detective specializing in English vocabulary.

Your ONLY job is to explain what the word "${word}" means in THIS specific sentence.

Rules:
1. Ignore ALL other definitions of "${word}"
2. Focus ONLY on how it's used in this context
3. Explain in 1-2 clear sentences
4. Use simple, conversational language
5. If the word has multiple meanings, explain ONLY the one used here

Format:
In this sentence, "${word}" means [explanation]. [Optional: One example of similar usage]`
            }, {
                role: 'user',
                content: `Word: ${word}\nSentence: "${fullSentence}"\n\nExplain what "${word}" means in THIS context.`
            }],
            temperature: 0.3,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        res.json({
            word,
            sentence: fullSentence,
            explanation: response.data.choices[0].message.content.trim(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Context Explain Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'AI分析失败' });
    }
});

// 2. 🏗️ Collocation Architect - 生成词汇搭配
app.post('/ai/collocations', async (req, res) => {
    try {
        const { word } = req.body;
        
        const response = await axios.post(AI_API_URL, {
            model: AI_MODEL_ID,
            messages: [{
                role: 'system',
                content: `You are a Collocation Architect specializing in natural English patterns.

Your job is to provide the 5 STRONGEST collocations for the word "${word}".

Rules:
1. Only provide REAL, commonly-used collocations
2. Focus on high-frequency patterns (Verb+Noun, Adj+Noun, Adv+Verb, etc.)
3. Prioritize natural, native-like combinations
4. Return ONLY a JSON array of 5 strings
5. Format: ["collocation1", "collocation2", "collocation3", "collocation4", "collocation5"]

Example output:
["make progress", "make sense", "make a decision", "make an effort", "make time"]`
            }, {
                role: 'user',
                content: `Word: ${word}\n\nGenerate 5 strong collocations. Return ONLY the JSON array.`
            }],
            temperature: 0.4,
            max_tokens: 100
        }, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        let content = response.data.choices[0].message.content.trim();
        
        // 清理响应，提取JSON数组
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let collocations;
        try {
            const parsed = JSON.parse(content);
            collocations = Array.isArray(parsed) ? parsed : (parsed.collocations || Object.values(parsed));
        } catch (e) {
            // 如果解析失败，返回备用搭配
            collocations = [
                `common ${word}`,
                `${word} example`,
                `typical ${word}`,
                `natural ${word}`,
                `frequent ${word}`
            ];
        }
        
        res.json({
            word,
            collocations: collocations.slice(0, 5),
            count: collocations.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Collocations Error:', error.response?.data || error.message);
        res.status(500).json({ error: '生成搭配失败' });
    }
});

// 3. ✨ Tone Stylist - 改写句子语气
app.post('/ai/polish-tone', async (req, res) => {
    try {
        const { originalSentence, targetTone } = req.body;
        
        const toneInstructions = {
            'formal': 'professional, academic, or business context. Use sophisticated vocabulary and complete sentence structures.',
            'casual': 'friendly, conversational setting. Use contractions, relaxed grammar, and everyday language.',
            'poetic': 'artistic, metaphorical style. Use imagery, rhythm, and creative expression.',
            'business': 'corporate, professional communication. Be clear, concise, and action-oriented.'
        };
        
        const response = await axios.post(AI_API_URL, {
            model: AI_MODEL_ID,
            messages: [{
                role: 'system',
                content: `You are a Writing Stylist specializing in tone adaptation.

Your job is to rewrite the user's sentence to match the ${targetTone.toUpperCase()} tone.

Target Tone: ${targetTone}
Tone Description: ${toneInstructions[targetTone]}

Rules:
1. PRESERVE the original meaning 100%
2. ONLY change the style/tone, not the content
3. Keep the sentence length similar (±20%)
4. Return ONLY the rewritten sentence, no explanations
5. Make it sound natural and native-like

Example (Casual → Formal):
Original: "I really need your help with this"
Formal: "I would greatly appreciate your assistance with this matter"`
            }, {
                role: 'user',
                content: `Original sentence (rewrite this to be ${targetTone}):\n"${originalSentence}"`
            }],
            temperature: 0.7,
            max_tokens: 200
        }, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        let polished = response.data.choices[0].message.content.trim();
        polished = polished.replace(/^["']|["']$/g, ''); // 去掉引号
        
        res.json({
            original: originalSentence,
            polished,
            tone: targetTone,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Polish Tone Error:', error.response?.data || error.message);
        res.status(500).json({ error: '改写失败' });
    }
});

// 4. 🔬 Logic Surgeon - 检测中式英语
app.post('/ai/logic-check', async (req, res) => {
    try {
        const { userSentence, nativeLanguage } = req.body;
        
        const languagePatterns = {
            'zh-CN': {
                name: 'Chinese (Simplified)',
                patterns: [
                    'Topic-comment structure (e.g., "This book, I like")',
                    'Omitted subjects or articles',
                    'Direct translation of measure words',
                    'Literal time expressions (e.g., "up to now" for 到现在)',
                    'Overuse of "very" or "more"'
                ]
            }
        };
        
        const l1Info = languagePatterns[nativeLanguage] || languagePatterns['zh-CN'];
        
        const response = await axios.post(AI_API_URL, {
            model: AI_MODEL_ID,
            messages: [{
                role: 'system',
                content: `You are a Contrastive Linguistics Expert specializing in L1 transfer detection.

Target L1: ${l1Info.name}
Common ${l1Info.name} interference patterns:
${l1Info.patterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Your job is to analyze if the user's English sentence shows L1 interference from ${l1Info.name}.

Analysis Framework:
1. Does the sentence sound like a native English speaker wrote it?
2. Are there any grammatical structures that suggest direct translation from ${l1Info.name}?
3. Are there word choices that feel unnatural but would make sense in ${l1Info.name}?
4. Is the sentence grammatically correct but pragmatically odd?

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "isNativeLike": true or false,
  "detectedL1Logic": "specific pattern description" or null,
  "explanation": "detailed explanation of the issue",
  "betterAlternative": "the improved native-like version"
}

Rules:
- If the sentence is perfectly native-like, set isNativeLike to true and detectedL1Logic to null
- If there's ANY L1 interference, set isNativeLike to false and describe the specific pattern
- The betterAlternative should preserve the user's intended meaning 100%
- Be specific and educational in your explanation`
            }, {
                role: 'user',
                content: `Analyze this sentence for ${l1Info.name} interference:\n\n"${userSentence}"\n\nReturn JSON analysis.`
            }],
            temperature: 0.3,
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        let content = response.data.choices[0].message.content.trim();
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const result = JSON.parse(content);
        
        res.json({
            sentence: userSentence,
            nativeLanguage,
            isNativeLike: result.isNativeLike,
            detectedL1Logic: result.detectedL1Logic,
            explanation: result.explanation,
            betterAlternative: result.betterAlternative,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Logic Check Error:', error.response?.data || error.message);
        res.status(500).json({ error: '逻辑检查失败' });
    }
});

app.post('/api/process/file', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }

        // 这里应该调用AI服务处理文件
        // 目前返回示例数据
        const result = {
            title: req.file.originalname.replace(/\.[^/.]+$/, ''),
            content: '这是从文件中提取的内容示例。在实际应用中，这里应该是AI处理后的文本内容。',
            translation: '这是译文示例。',
            summary: '这是摘要示例。',
            themes: {
                primary: 'General',
                secondary: ['Example'],
                custom: []
            },
            tags: ['示例', '文件上传'],
            vocabulary: [
                {
                    word: 'example',
                    meaning: '示例',
                    originalSentence: 'This is an example sentence.',
                    collocation: 'for example'
                }
            ],
            fileInfo: {
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }
        };

        res.json(result);
    } catch (error) {
        console.error('文件处理错误:', error);
        res.status(500).json({ error: '文件处理失败: ' + error.message });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(err.status || 500).json({
        error: err.message || '服务器内部错误'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '未找到该路由' });
});

// === 启动服务器 ===
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   English Corpus API Server           ║
║   运行在: http://localhost:${PORT}      ║
║   环境: ${process.env.NODE_ENV || 'development'}            ║
╚════════════════════════════════════════╝
    `);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;