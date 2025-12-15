const API_BASE = 'http://localhost:3000/api';
let currentAnalysis = null;
let editMode = false;
let currentCorpusId = null;

// ========== 新增：智能词汇分析器 ==========
class VocabularyAnalyzer {
    constructor() {
        this.vocabularyDatabase = {
            toefl: {
                high: ['significant', 'substantial', 'comprehensive', 'fundamental', 'demonstrate', 
                       'analyze', 'evaluate', 'synthesis', 'hypothesis', 'methodology'],
                medium: ['important', 'different', 'various', 'several', 'including',
                        'however', 'therefore', 'although', 'specific', 'particular'],
                academic: ['paradigm', 'empirical', 'correlation', 'implication', 'phenomenon',
                          'infrastructure', 'sustainability', 'innovation', 'implementation', 'framework']
            },
            ielts: {
                high: ['significant', 'substantial', 'considerable', 'remarkable', 'prominent',
                      'demonstrate', 'illustrate', 'indicate', 'reveal', 'manifest'],
                medium: ['important', 'necessary', 'essential', 'crucial', 'vital',
                        'various', 'diverse', 'multiple', 'numerous', 'several'],
                academic: ['contemporary', 'sophisticated', 'unprecedented', 'fundamental', 'comprehensive',
                          'substantial', 'revolutionary', 'transformative', 'exponential', 'profound']
            },
            gre: {
                high: ['exacerbate', 'mitigate', 'paradigm', 'dichotomy', 'ubiquitous',
                      'enigmatic', 'prolific', 'anomaly', 'catalyst', 'intrinsic'],
                medium: ['analyze', 'synthesize', 'evaluate', 'compare', 'contrast',
                        'interpret', 'infer', 'deduce', 'conclude', 'summarize'],
                academic: ['epistemology', 'teleological', 'phenomenology', 'dialectic', 'hegemony',
                          'empiricism', 'rationalism', 'pragmatism', 'determinism', 'relativism']
            },
            cet6: {
                high: ['artificial', 'intelligence', 'technological', 'revolution', 'contemporary',
                      'sophisticated', 'implementation', 'phenomenon', 'infrastructure', 'sustainability'],
                medium: ['significant', 'important', 'essential', 'necessary', 'critical',
                        'various', 'different', 'multiple', 'several', 'numerous'],
                academic: ['innovation', 'methodology', 'framework', 'paradigm', 'synthesis',
                          'hypothesis', 'empirical', 'correlation', 'implication', 'analysis']
            }
        };

        this.complexSentencePatterns = [
            /\b(although|though|even though|while|whereas)\b.*,/i,
            /\b(because|since|as|due to|owing to)\b/i,
            /\b(if|unless|provided that|on condition that)\b/i,
            /,\s*(which|who|whom|whose|that)\b/i,
            /\b(not only|neither|nor|so|such)\b.*\b(but also|that|as)\b/i,
            /\b(having|being)\s+\w+ed\b/i
        ];
    }

    analyzeText(text, examType = 'ielts') {
        const words = this.extractWords(text);
        const sentences = this.extractSentences(text);
        
        return {
            vocabulary: this.analyzeVocabulary(words, examType),
            examPoints: this.analyzeExamPoints(words, examType),
            sentences: this.analyzeComplexSentences(sentences, examType),
            stats: this.generateStats(words, sentences, examType),
            suggestions: this.generateLearningTips(words, sentences, examType)
        };
    }

    extractWords(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !/\d/.test(word));
    }

    extractSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20);
    }

    analyzeVocabulary(words, examType) {
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return Object.entries(wordFreq)
            .map(([word, frequency]) => ({
                word: word,
                frequency: frequency,
                difficulty: this.getDifficulty(word, examType),
                meaning: this.getMeaning(word),
                usage: this.getUsageContext(word),
                examRelevance: this.getExamRelevance(word, examType)
            }))
            .filter(item => item.difficulty !== 'low' || item.frequency > 2)
            .sort((a, b) => {
                const scores = { high: 3, medium: 2, low: 1 };
                const scoreDiff = scores[b.difficulty] - scores[a.difficulty];
                return scoreDiff !== 0 ? scoreDiff : b.frequency - a.frequency;
            })
            .slice(0, 20);
    }

    analyzeExamPoints(words, examType) {
        const examWords = this.vocabularyDatabase[examType];
        const foundWords = [];
        const uniqueWords = [...new Set(words)];
        
        uniqueWords.forEach(word => {
            let category, level, importance;
            
            if (examWords.high.includes(word)) {
                category = '高频核心';
                level = 'high';
                importance = '★★★★★';
            } else if (examWords.medium.includes(word)) {
                category = '常见重点';
                level = 'medium';
                importance = '★★★★☆';
            } else if (examWords.academic.includes(word)) {
                category = '学术专业';
                level = 'academic';
                importance = '★★★★★';
            }
            
            if (category) {
                foundWords.push({ word, level, category, importance });
            }
        });
        
        return foundWords.slice(0, 15);
    }

    analyzeComplexSentences(sentences, examType) {
        const complexSentences = [];
        
        sentences.forEach(sentence => {
            const complexity = this.calculateComplexity(sentence, examType);
            
            if (complexity.score > 0.5) {
                complexSentences.push({
                    text: sentence,
                    complexity: complexity.score,
                    features: complexity.features,
                    structure: this.analyzeSentenceStructure(sentence),
                    learningValue: this.assessLearningValue(sentence, examType)
                });
            }
        });
        
        return complexSentences
            .sort((a, b) => b.learningValue - a.learningValue)
            .slice(0, 10);
    }

    calculateComplexity(sentence, examType) {
        let score = 0;
        const features = [];
        
        if (sentence.length > 100) {
            score += 0.3;
            features.push('超长句');
        } else if (sentence.length > 60) {
            score += 0.2;
            features.push('长句');
        }
        
        this.complexSentencePatterns.forEach(pattern => {
            if (pattern.test(sentence)) {
                score += 0.2;
                features.push('复杂语法');
            }
        });
        
        const clauseCount = (sentence.match(/\b(which|that|who|where|when)\b/gi) || []).length;
        score += Math.min(clauseCount * 0.15, 0.3);
        if (clauseCount > 0) features.push(`${clauseCount}个从句`);
        
        return { score: Math.min(score, 1.0), features: [...new Set(features)] };
    }

    analyzeSentenceStructure(sentence) {
        const structures = [];
        
        if (/\b(although|though|while|whereas)\b/i.test(sentence)) {
            structures.push('让步从句');
        }
        if (/\b(because|since|as|due to)\b/i.test(sentence)) {
            structures.push('原因从句');
        }
        if (/,\s*(which|who|whom)\b/i.test(sentence)) {
            structures.push('非限定定语从句');
        }
        
        return structures.length > 0 ? structures : ['简单句'];
    }

    assessLearningValue(sentence, examType) {
        let value = 0;
        const complexity = this.calculateComplexity(sentence, examType);
        value += complexity.score * 40;
        
        const words = this.extractWords(sentence);
        const examWords = this.vocabularyDatabase[examType];
        const highWords = words.filter(w => 
            examWords.high.includes(w) || examWords.academic.includes(w)
        );
        value += highWords.length * 10;
        
        if (sentence.length > 40 && sentence.length < 120) {
            value += 20;
        }
        
        return Math.min(value, 100);
    }

    generateStats(words, sentences, examType) {
        const examWords = this.vocabularyDatabase[examType];
        const uniqueWords = [...new Set(words)];
        const highFreqWords = uniqueWords.filter(w => 
            examWords.high.includes(w) || examWords.academic.includes(w)
        );

        return {
            totalWords: words.length,
            uniqueWords: uniqueWords.length,
            totalSentences: sentences.length,
            highFreqWords: highFreqWords.length,
            avgWordsPerSentence: Math.round(words.length / sentences.length),
            difficultyLevel: this.assessOverallDifficulty(words, examType)
        };
    }

    assessOverallDifficulty(words, examType) {
        const examWords = this.vocabularyDatabase[examType];
        const highCount = words.filter(w => 
            examWords.high.includes(w) || examWords.academic.includes(w)
        ).length;
        const ratio = highCount / words.length;

        if (ratio > 0.15) return '高级';
        if (ratio > 0.08) return '中高级';
        if (ratio > 0.04) return '中级';
        return '初中级';
    }

    generateLearningTips(words, sentences, examType) {
        const stats = this.generateStats(words, sentences, examType);
        const tips = [];

        if (stats.highFreqWords < 5) {
            tips.push({
                type: 'vocabulary',
                level: 'important',
                tip: `建议扩充${examType.toUpperCase()}核心词汇量`
            });
        } else if (stats.highFreqWords > 15) {
            tips.push({
                type: 'vocabulary',
                level: 'excellent',
                tip: '词汇水平优秀！注意精准使用'
            });
        }

        const complexSentences = sentences.filter(s => 
            this.calculateComplexity(s, examType).score > 0.6
        );
        
        if (complexSentences.length < 3) {
            tips.push({
                type: 'grammar',
                level: 'important',
                tip: '可尝试使用更多复杂句式'
            });
        }

        return tips;
    }

    getDifficulty(word, examType) {
        const examWords = this.vocabularyDatabase[examType];
        if (examWords.high.includes(word) || examWords.academic.includes(word)) {
            return 'high';
        } else if (examWords.medium.includes(word)) {
            return 'medium';
        }
        return 'low';
    }

    getMeaning(word) {
        const meanings = {
            'significant': 'adj. 重要的，显著的',
            'substantial': 'adj. 大量的，实质性的',
            'comprehensive': 'adj. 全面的，综合的',
            'fundamental': 'adj. 基本的，根本的',
            'demonstrate': 'v. 证明，展示',
            'artificial': 'adj. 人工的',
            'intelligence': 'n. 智力，智能',
            'technological': 'adj. 技术的',
            'revolution': 'n. 革命，变革',
            'contemporary': 'adj. 当代的',
            'sophisticated': 'adj. 复杂的，精密的',
            'profound': 'adj. 深刻的'
        };
        return meanings[word] || '查询释义';
    }

    getUsageContext(word) {
        const usages = {
            'significant': '常用于形容重要性或影响力',
            'substantial': '强调数量或程度的巨大',
            'comprehensive': '用于描述全面性和完整性',
            'demonstrate': '用于展示证据或能力'
        };
        return usages[word] || '查看用法';
    }

    getExamRelevance(word, examType) {
        const examWords = this.vocabularyDatabase[examType];
        if (examWords.high.includes(word)) return '核心高频';
        if (examWords.academic.includes(word)) return '学术专业';
        if (examWords.medium.includes(word)) return '常见重点';
        return '基础词汇';
    }
}

// 初始化分析器
const analyzer = new VocabularyAnalyzer();
let currentExamType = 'ielts'; // 默认考试类型

// ========== 原有代码：内置示例数据 ==========
const DEMO_ARTICLES = [
    {
        _id: 'demo_1',
        title: 'The Gig Economy Dilemma',
        tags: ['经济', '科技', '职场'],
        content: 'The gig economy has fundamentally transformed the nature of work, creating unprecedented flexibility while simultaneously eroding traditional employment protections. Workers must now navigate a landscape where autonomy comes at the cost of stability.',
        translation: '零工经济从根本上改变了工作的性质，创造了前所未有的灵活性，同时也削弱了传统的就业保护。现在，工人必须在自主权以稳定性为代价的环境中摸索前行。',
        vocabulary: [
            { word: 'gig economy', meaning: '零工经济', originalSentence: 'The gig economy has transformed work', collocation: 'thrive in the gig economy' },
            { word: 'erode', meaning: '侵蚀，削弱', originalSentence: 'eroding traditional employment protections', collocation: 'erode traditional protections' },
            { word: 'navigate', meaning: '驾驭，应对', originalSentence: 'Workers must navigate a landscape', collocation: 'navigate a complex landscape' },
            { word: 'autonomy', meaning: '自主权', originalSentence: 'autonomy comes at the cost', collocation: 'at the cost of autonomy' }
        ],
        themes: {
            primary: 'Labor Market',
            secondary: ['Economic Transformation', 'Workers\' Rights'],
            custom: []
        },
        summary: '探讨零工经济的双面性：灵活性与稳定性的权衡',
        createdAt: new Date().toISOString(),
        isDemo: true
    },
    {
        _id: 'demo_2',
        title: 'AI and Human Identity',
        tags: ['科技', '社会', '伦理'],
        content: 'Artificial intelligence is no longer a distant prospect but a present reality, raising profound questions about the nature of creativity, consciousness, and what it means to be human. As machines become increasingly sophisticated, we must confront uncomfortable truths about our own limitations.',
        translation: '人工智能不再是遥远的前景，而是当下的现实，它提出了关于创造力本质、意识以及人之为人意味着什么的深刻问题。随着机器变得越来越复杂，我们必须面对关于自身局限性的令人不安的真相。',
        vocabulary: [
            { word: 'distant prospect', meaning: '遥远的前景', originalSentence: 'no longer a distant prospect', collocation: 'no longer a distant prospect' },
            { word: 'profound', meaning: '深刻的', originalSentence: 'raising profound questions', collocation: 'raise profound questions' },
            { word: 'confront', meaning: '面对，直面', originalSentence: 'we must confront uncomfortable truths', collocation: 'confront uncomfortable truths' },
            { word: 'sophisticated', meaning: '复杂的，精密的', originalSentence: 'machines become increasingly sophisticated', collocation: 'increasingly sophisticated' }
        ],
        themes: {
            primary: 'AI Ethics',
            secondary: ['Human Identity', 'Technological Progress'],
            custom: []
        },
        summary: 'AI崛起引发关于人类独特性和身份认同的思考',
        createdAt: new Date().toISOString(),
        isDemo: true
    }
];

// === Auth 逻辑 ===
const auth = {
    token: localStorage.getItem('token'),
    
    init: () => {
        if (auth.token || localStorage.getItem('demoMode')) {
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            router.init();
        } else {
            document.getElementById('auth-container').classList.remove('hidden');
            document.getElementById('app-container').classList.add('hidden');
        }
    },

    toggleView: () => {
        document.getElementById('login-form').classList.toggle('hidden');
        document.getElementById('register-form').classList.toggle('hidden');
    },

    register: async () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        
        if(!username || !password) {
            alert('请输入完整信息');
            return;
        }
        
        if(username.length < 3) {
            alert('用户名至少3个字符');
            return;
        }
        
        if(password.length < 6) {
            alert('密码至少6位');
            return;
        }

        if (username === 'demo') {
            localStorage.setItem('demoMode', 'true');
            localStorage.setItem('username', username);
            auth.init();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            
            const data = await res.json();
            
            if(res.ok) {
                alert('注册成功，请登录');
                auth.toggleView();
            } else {
                alert(data.error || '注册失败');
            }
        } catch(e) { 
            console.error('注册错误:', e);
            alert('网络错误，已切换到演示模式\n使用 demo/demo123 可快速体验');
            localStorage.setItem('demoMode', 'true');
            localStorage.setItem('username', username);
            auth.init();
        }
    },

    login: async () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if(!username || !password) {
            alert('请输入用户名和密码');
            return;
        }

        if (username === 'demo' && password === 'demo123') {
            localStorage.setItem('demoMode', 'true');
            localStorage.setItem('username', username);
            auth.init();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            
            const data = await res.json();
            
            if(res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                auth.token = data.token;
                auth.init();
            } else {
                alert(data.error || '登录失败');
            }
        } catch(e) { 
            console.error('登录错误:', e);
            alert('登录失败\n\n提示：使用 demo/demo123 可进入演示模式'); 
        }
    },

    logout: () => {
        if(confirm('确定退出登录？')) {
            localStorage.removeItem('token');
            localStorage.removeItem('demoMode');
            localStorage.removeItem('username');
            location.reload();
        }
    },

    fetchAuth: async (url, options = {}) => {
        const headers = options.headers || {};
        if (auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
        }
        options.headers = headers;
        
        const res = await fetch(url, options);
        if(res.status === 401 || res.status === 403) {
            alert('登录已过期，请重新登录');
            auth.logout();
        }
        return res;
    }
};

// === 路由 ===
const router = {
    init: () => { router.load('upload'); },
    
    load: (page) => {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('text-primary');
            if(btn.dataset.target === page) {
                btn.classList.add('text-primary');
            }
        });
        
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        main.classList.add('animate-fade-in');
        
        switch(page) {
            case 'upload': pages.upload(); break;
            case 'corpus': pages.corpus(); break;
            case 'opinion': pages.opinion(); break;
            case 'stats': pages.stats(); break;
        }
    }
};

// === 页面逻辑 ===
const pages = {
    // ========== 上传页面(新增智能分析功能) ==========
    upload: () => {
        document.getElementById('main-content').innerHTML = `
            <div class="p-4 space-y-4">
                <!-- 考试类型选择(新增) -->
                <div class="bg-white border border-border rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-flag-line"></i>
                        选择考试类型
                    </h3>
                    <div class="flex gap-2 flex-wrap">
                        <button onclick="pages.selectExam('ielts')" 
                            class="exam-type-btn px-4 py-2 rounded-lg border-2 transition ${currentExamType === 'ielts' ? 'bg-primary text-white border-primary' : 'border-border text-secondary'}">
                            IELTS
                        </button>
                        <button onclick="pages.selectExam('toefl')" 
                            class="exam-type-btn px-4 py-2 rounded-lg border-2 transition ${currentExamType === 'toefl' ? 'bg-primary text-white border-primary' : 'border-border text-secondary'}">
                            TOEFL
                        </button>
                        <button onclick="pages.selectExam('gre')" 
                            class="exam-type-btn px-4 py-2 rounded-lg border-2 transition ${currentExamType === 'gre' ? 'bg-primary text-white border-primary' : 'border-border text-secondary'}">
                            GRE
                        </button>
                        <button onclick="pages.selectExam('cet6')" 
                            class="exam-type-btn px-4 py-2 rounded-lg border-2 transition ${currentExamType === 'cet6' ? 'bg-primary text-white border-primary' : 'border-border text-secondary'}">
                            CET-6
                        </button>
                    </div>
                </div>

                <!-- 文本输入 -->
                <div class="bg-white border border-border rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-edit-line"></i>
                        粘贴英文文本
                    </h3>
                    <textarea id="text-input" placeholder="粘贴英文段落或文章..." 
                        class="w-full h-40 p-3 bg-surface border border-border rounded-xl resize-none focus:ring-2 focus:ring-accent outline-none"></textarea>
                    
                    <div class="flex gap-2 mt-3">
                        <button onclick="pages.analyzeText()" 
                            class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium active:scale-95 transition">
                            <i class="ri-flashlight-line mr-2"></i>智能分析
                        </button>
                        <button onclick="pages.clearText()" 
                            class="px-4 py-3 border border-border rounded-xl text-secondary active:scale-95 transition">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>

                <!-- 文件上传 -->
                <div class="bg-white border border-border rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-upload-cloud-line"></i>
                        或上传文件
                    </h3>
                    <div class="border-2 border-dashed border-border rounded-xl p-8 text-center" id="upload-zone">
                        <i class="ri-file-upload-line text-4xl text-secondary mb-2"></i>
                        <p class="text-sm text-secondary mb-3">支持 PDF、Word、图片</p>
                        <input type="file" id="file-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                            class="hidden" onchange="pages.handleFileUpload(event)">
                        <button onclick="document.getElementById('file-input').click()" 
                            class="px-4 py-2 bg-surface border border-border rounded-lg text-sm active:scale-95 transition">
                            选择文件
                        </button>
                    </div>
                </div>

                <!-- 分析结果区域 -->
                <div id="analysis-result" class="hidden"></div>
            </div>
        `;
    },

    // 新增：选择考试类型
    selectExam: (examType) => {
        currentExamType = examType;
        pages.upload(); // 刷新页面以更新按钮状态
    },

    // 新增：清空文本
    clearText: () => {
        document.getElementById('text-input').value = '';
        document.getElementById('analysis-result').classList.add('hidden');
    },

    // 新增：智能分析文本
    analyzeText: () => {
        const text = document.getElementById('text-input').value.trim();
        
        if (!text) {
            alert('请先输入或粘贴英文文本');
            return;
        }

        ui.loading(true, 'AI智能分析中...', true);

        setTimeout(() => {
            const analysis = analyzer.analyzeText(text, currentExamType);
            currentAnalysis = analysis;
            pages.displayAnalysisResult(analysis, text);
            ui.loading(false);
        }, 1500);
    },

    // 新增：显示分析结果
    displayAnalysisResult: (analysis, originalText) => {
        const resultDiv = document.getElementById('analysis-result');
        resultDiv.classList.remove('hidden');
        
        resultDiv.innerHTML = `
            <!-- 统计概览 -->
            <div class="bg-white border border-border rounded-xl p-4 mb-4">
                <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <i class="ri-pie-chart-line"></i>
                    分析概览
                </h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-primary">${analysis.stats.totalWords}</div>
                        <div class="text-xs text-secondary mt-1">总词数</div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-primary">${analysis.stats.uniqueWords}</div>
                        <div class="text-xs text-secondary mt-1">不重复词</div>
                    </div>
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-primary">${analysis.stats.highFreqWords}</div>
                        <div class="text-xs text-secondary mt-1">高频词</div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-primary">${analysis.stats.difficultyLevel}</div>
                        <div class="text-xs text-secondary mt-1">难度等级</div>
                    </div>
                </div>
            </div>

            <!-- 重点词汇 -->
            ${analysis.vocabulary.length > 0 ? `
                <div class="bg-white border border-border rounded-xl p-4 mb-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-book-mark-line"></i>
                        重点词汇 (${analysis.vocabulary.length})
                    </h3>
                    <div class="space-y-2">
                        ${analysis.vocabulary.slice(0, 10).map(item => `
                            <div class="bg-surface rounded-lg p-3 border-l-4 ${
                                item.difficulty === 'high' ? 'border-red-500' : 
                                item.difficulty === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                            }">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="font-bold text-primary">${item.word}</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs px-2 py-1 rounded ${
                                            item.difficulty === 'high' ? 'bg-red-100 text-red-700' : 
                                            item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                        }">${item.difficulty.toUpperCase()}</span>
                                        <span class="text-xs text-secondary">×${item.frequency}</span>
                                    </div>
                                </div>
                                <div class="text-sm text-secondary">${item.meaning}</div>
                                <div class="text-xs text-secondary mt-1">${item.usage}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 考试高频词 -->
            ${analysis.examPoints.length > 0 ? `
                <div class="bg-white border border-border rounded-xl p-4 mb-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-star-line"></i>
                        ${currentExamType.toUpperCase()}考试高频词 (${analysis.examPoints.length})
                    </h3>
                    <div class="space-y-2">
                        ${analysis.examPoints.slice(0, 8).map(item => `
                            <div class="bg-surface rounded-lg p-3">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-primary">${item.word}</span>
                                    <span class="text-xs px-2 py-1 rounded ${
                                        item.level === 'high' || item.level === 'academic' ? 
                                        'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }">${item.category}</span>
                                </div>
                                <div class="text-xs text-secondary">${item.importance}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 优质句式 -->
            ${analysis.sentences.length > 0 ? `
                <div class="bg-white border border-border rounded-xl p-4 mb-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-file-list-3-line"></i>
                        优质句式 (${analysis.sentences.length})
                    </h3>
                    <div class="space-y-3">
                        ${analysis.sentences.slice(0, 5).map(item => `
                            <div class="bg-surface rounded-lg p-3 border-l-4 border-purple-500">
                                <div class="text-sm text-primary italic mb-2">"${item.text}"</div>
                                <div class="flex gap-2 flex-wrap mb-2">
                                    <span class="text-xs px-2 py-1 bg-white rounded">复杂度: ${(item.complexity * 100).toFixed(0)}%</span>
                                    <span class="text-xs px-2 py-1 bg-white rounded">学习价值: ${item.learningValue}/100</span>
                                </div>
                                <div class="text-xs text-secondary">
                                    特征: ${item.features.join(', ')} | 
                                    结构: ${item.structure.join(', ')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 学习建议 -->
            ${analysis.suggestions.length > 0 ? `
                <div class="bg-gradient-to-br from-slate-50 to-gray-100 border border-border rounded-xl p-4 mb-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-lightbulb-line"></i>
                        学习建议
                    </h3>
                    <div class="space-y-2">
                        ${analysis.suggestions.map(tip => `
                            <div class="flex gap-3 items-start">
                                <i class="ri-${tip.level === 'excellent' ? 'star' : tip.level === 'important' ? 'alert' : 'lightbulb'}-line text-lg ${
                                    tip.level === 'excellent' ? 'text-green-500' : 
                                    tip.level === 'important' ? 'text-yellow-500' : 'text-blue-500'
                                }"></i>
                                <div class="flex-1">
                                    <div class="text-xs text-secondary uppercase">${tip.type}</div>
                                    <div class="text-sm text-primary">${tip.tip}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 保存按钮 -->
            <button onclick="pages.saveAnalyzedCorpus()" 
                class="w-full bg-primary text-white py-3 rounded-xl font-medium active:scale-95 transition">
                <i class="ri-save-line mr-2"></i>保存到语料库
            </button>
        `;

        // 滚动到结果
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // 新增：保存分析后的语料
    saveAnalyzedCorpus: async () => {
        if (!currentAnalysis) {
            alert('没有可保存的分析结果');
            return;
        }

        const text = document.getElementById('text-input').value.trim();
        const title = prompt('请为这份语料命名:', text.substring(0, 30) + '...');
        
        if (!title) return;

        // 转换分析结果为语料格式
        const vocabulary = currentAnalysis.vocabulary.map(v => ({
            word: v.word,
            meaning: v.meaning,
            originalSentence: text.split('.').find(s => s.toLowerCase().includes(v.word)) || text.substring(0, 100),
            collocation: v.usage
        }));

        const corpusData = {
            title: title,
            content: text,
            rawText: text,
            vocabulary: vocabulary,
            themes: {
                primary: 'General',
                secondary: [currentExamType.toUpperCase()],
                custom: []
            },
            tags: [`${currentExamType}`, currentAnalysis.stats.difficultyLevel],
            summary: `${currentExamType.toUpperCase()}分析 - ${currentAnalysis.stats.difficultyLevel}难度，包含${currentAnalysis.stats.highFreqWords}个高频词`
        };

        ui.loading(true, '保存中...', false);

        try {
            if (localStorage.getItem('demoMode')) {
                // Demo模式：保存到localStorage
                let demoCorpus = JSON.parse(localStorage.getItem('demoCorpus') || '[]');
                corpusData._id = 'demo_' + Date.now();
                corpusData.createdAt = new Date().toISOString();
                corpusData.isDemo = true;
                demoCorpus.unshift(corpusData);
                localStorage.setItem('demoCorpus', JSON.stringify(demoCorpus));
                
                ui.loading(false);
                alert('保存成功！');
                pages.clearText();
                router.load('corpus');
            } else {
                // 正式模式：保存到后端
                const res = await auth.fetchAuth(`${API_BASE}/corpus`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(corpusData)
                });
                
                ui.loading(false);
                
                if (res.ok) {
                    alert('保存成功！');
                    pages.clearText();
                    router.load('corpus');
                } else {
                    const data = await res.json();
                    alert(data.error || '保存失败');
                }
            }
        } catch(e) {
            ui.loading(false);
            console.error('保存错误:', e);
            alert('保存失败: ' + e.message);
        }
    },

    // 新增：文件上传处理
    handleFileUpload: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        ui.loading(true, '正在处理文件...', true);

        setTimeout(() => {
            ui.loading(false);
            alert('文件上传功能需要后端支持\n\n提示：可以先使用文本输入功能体验智能分析');
        }, 1500);
    },

    // ========== 语料库页面(保持原有逻辑) ==========
    corpus: async () => {
        ui.loading(true, '加载中...', false);
        
        try {
            let list = [];
            
            if (localStorage.getItem('demoMode')) {
                const demoCorpus = JSON.parse(localStorage.getItem('demoCorpus') || '[]');
                list = [...DEMO_ARTICLES, ...demoCorpus];
            } else {
                const res = await auth.fetchAuth(`${API_BASE}/corpus`);
                if (res.ok) {
                    const data = await res.json();
                    list = data.list || [];
                }
            }
            
            ui.loading(false);
            
            if (list.length === 0) {
                document.getElementById('main-content').innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center p-8 text-center">
                        <i class="ri-inbox-line text-6xl text-border mb-4"></i>
                        <p class="text-secondary">还没有语料</p>
                        <p class="text-xs text-secondary mt-2">试试上传分析功能吧</p>
                    </div>
                `;
                return;
            }
            
            document.getElementById('main-content').innerHTML = `
                <div class="p-4 space-y-3">
                    ${list.map(item => `
                        <div class="bg-white border border-border rounded-xl p-4 active:scale-98 transition cursor-pointer" 
                            onclick="pages.viewCorpus('${item._id}')">
                            <h3 class="font-bold text-primary mb-2">${item.title}</h3>
                            <p class="text-sm text-secondary line-clamp-2 mb-3">${item.content.substring(0, 100)}...</p>
                            <div class="flex items-center justify-between text-xs">
                                <div class="flex gap-2 flex-wrap">
                                    ${(item.tags || []).slice(0, 3).map(tag => 
                                        `<span class="px-2 py-1 bg-surface rounded">${tag}</span>`
                                    ).join('')}
                                </div>
                                <div class="text-secondary flex items-center gap-1">
                                    <i class="ri-book-2-line"></i>
                                    <span>${(item.vocabulary || []).length}词</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch(e) {
            ui.loading(false);
            console.error('加载语料失败:', e);
            alert('加载失败');
        }
    },

    // 查看语料详情(保持原有逻辑)
    viewCorpus: async (id) => {
        ui.loading(true, '加载详情...', false);
        
        try {
            let corpus;
            
            if (localStorage.getItem('demoMode')) {
                const allCorpus = [...DEMO_ARTICLES, ...JSON.parse(localStorage.getItem('demoCorpus') || '[]')];
                corpus = allCorpus.find(c => c._id === id);
            } else {
                const res = await auth.fetchAuth(`${API_BASE}/corpus/${id}`);
                if (res.ok) {
                    corpus = await res.json();
                }
            }
            
            ui.loading(false);
            
            if (!corpus) {
                alert('语料不存在');
                return;
            }
            
            currentCorpusId = id;
            
            document.getElementById('main-content').innerHTML = `
                <div class="p-4 space-y-4">
                    <div class="flex items-center justify-between">
                        <button onclick="router.load('corpus')" 
                            class="flex items-center gap-2 text-secondary">
                            <i class="ri-arrow-left-line"></i>
                            <span>返回</span>
                        </button>
                        ${!corpus.isDemo ? `
                            <div class="flex gap-2">
                                <button onclick="pages.editCorpus()" 
                                    class="px-4 py-2 border border-border rounded-lg text-sm active:scale-95 transition">
                                    <i class="ri-edit-line"></i> 编辑
                                </button>
                                <button onclick="pages.deleteCorpus('${id}')" 
                                    class="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm active:scale-95 transition">
                                    <i class="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="bg-white border border-border rounded-xl p-4">
                        <h2 class="text-xl font-bold text-primary mb-3">${corpus.title}</h2>
                        <div class="flex gap-2 flex-wrap mb-4">
                            ${(corpus.tags || []).map(tag => 
                                `<span class="px-3 py-1 bg-surface rounded-lg text-sm">${tag}</span>`
                            ).join('')}
                        </div>
                        <p class="text-sm text-secondary leading-relaxed">${corpus.content}</p>
                        ${corpus.translation ? `
                            <div class="mt-4 pt-4 border-t border-border">
                                <h4 class="text-sm font-bold text-primary mb-2">译文</h4>
                                <p class="text-sm text-secondary">${corpus.translation}</p>
                            </div>
                        ` : ''}
                    </div>

                    ${(corpus.vocabulary && corpus.vocabulary.length > 0) ? `
                        <div class="bg-white border border-border rounded-xl p-4">
                            <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <i class="ri-book-mark-line"></i>
                                重点词汇 (${corpus.vocabulary.length})
                            </h3>
                            <div class="space-y-3">
                                ${corpus.vocabulary.map(v => `
                                    <div class="bg-surface rounded-lg p-3">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-bold text-primary">${v.word}</span>
                                            <span class="text-xs text-secondary">${v.meaning}</span>
                                        </div>
                                        ${v.originalSentence ? `
                                            <div class="text-xs text-secondary italic">"${v.originalSentence}"</div>
                                        ` : ''}
                                        ${v.collocation ? `
                                            <div class="text-xs text-secondary mt-1">搭配: ${v.collocation}</div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${corpus.summary ? `
                        <div class="bg-gradient-to-br from-slate-50 to-gray-100 border border-border rounded-xl p-4">
                            <h3 class="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                <i class="ri-lightbulb-line"></i>
                                核心要点
                            </h3>
                            <p class="text-sm text-secondary">${corpus.summary}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch(e) {
            ui.loading(false);
            console.error('加载详情失败:', e);
            alert('加载失败');
        }
    },

    // 删除语料(保持原有逻辑)
    deleteCorpus: async (id) => {
        if (!confirm('确定删除这条语料？')) return;

        ui.loading(true, '删除中...', false);

        try {
            if (localStorage.getItem('demoMode')) {
                let demoCorpus = JSON.parse(localStorage.getItem('demoCorpus') || '[]');
                demoCorpus = demoCorpus.filter(c => c._id !== id);
                localStorage.setItem('demoCorpus', JSON.stringify(demoCorpus));
                
                ui.loading(false);
                alert('删除成功');
                router.load('corpus');
            } else {
                const res = await auth.fetchAuth(`${API_BASE}/corpus/${id}`, {
                    method: 'DELETE'
                });
                
                ui.loading(false);
                
                if (res.ok) {
                    alert('删除成功');
                    router.load('corpus');
                } else {
                    const data = await res.json();
                    alert(data.error || '删除失败');
                }
            }
        } catch(e) {
            ui.loading(false);
            console.error('删除失败:', e);
            alert('删除失败');
        }
    },

    // ========== 观点墙和统计页面(保持原有逻辑) ==========
    opinion: async () => {
        ui.loading(true, '加载中...', false);
        
        try {
            let list = [];
            
            if (!localStorage.getItem('demoMode')) {
                const res = await auth.fetchAuth(`${API_BASE}/opinions`);
                if (res.ok) {
                    const data = await res.json();
                    list = data.list || [];
                }
            }
            
            ui.loading(false);
            
            if (list.length === 0) {
                document.getElementById('main-content').innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center p-8 text-center">
                        <i class="ri-lightbulb-line text-6xl text-border mb-4"></i>
                        <p class="text-secondary">还没有核心观点</p>
                        <p class="text-xs text-secondary mt-2">观点会在上传分析时自动提取</p>
                    </div>
                `;
                return;
            }
            
            document.getElementById('main-content').innerHTML = `
                <div class="p-4 space-y-3">
                    ${list.map(item => `
                        <div class="bg-white border border-border rounded-xl p-4">
                            <div class="flex items-start gap-3 mb-3">
                                <div class="w-2 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                <div class="flex-1">
                                    <p class="text-sm text-primary font-medium leading-relaxed">${item.content}</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="px-2 py-1 bg-surface rounded">${item.theme}</span>
                                <span class="text-secondary">${new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch(e) {
            ui.loading(false);
            console.error('加载观点失败:', e);
        }
    },

    stats: async () => {
        ui.loading(true, '统计中...', false);
        
        try {
            let corpusData = { list: [], total: 0 };
            
            if (localStorage.getItem('demoMode')) {
                const demoCorpus = JSON.parse(localStorage.getItem('demoCorpus') || '[]');
                corpusData = {
                    list: [...DEMO_ARTICLES, ...demoCorpus],
                    total: DEMO_ARTICLES.length + demoCorpus.length
                };
            } else {
                const res = await auth.fetchAuth(`${API_BASE}/corpus`);
                if (res.ok) {
                    corpusData = await res.json();
                }
            }
            
            const totalCorpus = corpusData.total || corpusData.list.length;
            const totalVocab = corpusData.list.reduce((sum, c) => 
                sum + (c.vocabulary?.length || 0), 0
            );
            
            // 统计主题分布
            const themeCount = {};
            corpusData.list.forEach(c => {
                const theme = c.themes?.primary || 'General';
                themeCount[theme] = (themeCount[theme] || 0) + 1;
            });
            const topThemes = Object.entries(themeCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            // 统计标签分布
            const tagCount = {};
            corpusData.list.forEach(c => {
                (c.tags || []).forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            });
            const topTags = Object.entries(tagCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            ui.loading(false);
            
            document.getElementById('main-content').innerHTML = `
                <div class="p-4 space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                            <div class="text-3xl font-bold mb-1">${totalCorpus}</div>
                            <div class="text-sm opacity-90">总语料数</div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                            <div class="text-3xl font-bold mb-1">${totalVocab}</div>
                            <div class="text-sm opacity-90">累计词汇</div>
                        </div>
                    </div>

                    ${topThemes.length > 0 ? `
                        <div class="bg-white border border-border rounded-xl p-4">
                            <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <i class="ri-folders-line"></i>
                                主题分布
                            </h3>
                            <div class="space-y-2">
                                ${topThemes.map(([theme, count]) => `
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-secondary">${theme}</span>
                                        <div class="flex items-center gap-2">
                                            <div class="w-20 h-2 bg-surface rounded-full overflow-hidden">
                                                <div class="h-full bg-blue-500 rounded-full" 
                                                    style="width: ${(count / totalCorpus * 100)}%"></div>
                                            </div>
                                            <span class="text-xs text-secondary w-8 text-right">${count}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${topTags.length > 0 ? `
                        <div class="bg-white border border-border rounded-xl p-4">
                            <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <i class="ri-price-tag-3-line"></i>
                                热门标签
                            </h3>
                            <div class="space-y-2">
                                ${topTags.map(([tag, count]) => `
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-secondary">${tag}</span>
                                        <div class="flex items-center gap-2">
                                            <div class="w-20 h-2 bg-surface rounded-full overflow-hidden">
                                                <div class="h-full bg-primary rounded-full" 
                                                    style="width: ${(count / totalCorpus * 100)}%"></div>
                                            </div>
                                            <span class="text-xs text-secondary w-8 text-right">${count}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="bg-gradient-to-br from-slate-50 to-gray-100 border border-border rounded-xl p-4">
                        <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <i class="ri-lightbulb-line"></i>
                            学习建议
                        </h3>
                        <ul class="space-y-2 text-sm text-secondary">
                            <li class="flex items-start gap-2">
                                <i class="ri-checkbox-circle-line text-accent mt-0.5"></i>
                                <span>坚持每日积累，建议每天至少学习1篇语料</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="ri-checkbox-circle-line text-accent mt-0.5"></i>
                                <span>重点记忆高频词汇搭配，提升表达地道性</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="ri-checkbox-circle-line text-accent mt-0.5"></i>
                                <span>定期回顾核心观点，培养批判性思维</span>
                            </li>
                            ${totalVocab > 100 ? `
                                <li class="flex items-start gap-2">
                                    <i class="ri-star-line text-accent mt-0.5"></i>
                                    <span class="font-medium text-primary">太棒了！您已积累 ${totalVocab} 个词汇</span>
                                </li>
                            ` : ''}
                        </ul>
                    </div>
                </div>
            `;
        } catch(e) {
            ui.loading(false);
            console.error('统计失败:', e);
        }
    }
};

// === UI工具 ===
const ui = {
    initLoader: () => {
        if (document.getElementById('ai-floating-loader')) return;

        const style = document.createElement('style');
        style.textContent = `
            #ai-floating-loader {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 280px;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(0,0,0,0.08);
                border-radius: 20px;
                padding: 24px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #ai-floating-loader.active {
                opacity: 1;
                pointer-events: auto;
            }
            .ai-progress-bg {
                width: 100%;
                height: 4px;
                background: #f1f1f1;
                border-radius: 2px;
                margin-top: 16px;
                overflow: hidden;
            }
            .ai-progress-bar {
                height: 100%;
                background: #18181b;
                width: 0%;
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.id = 'ai-floating-loader';
        div.innerHTML = `
            <div class="typewriter">
                <div class="slide"><i></i></div>
                <div class="paper"></div>
                <div class="keyboard"></div>
            </div>
            
            <h3 class="font-bold text-gray-900 text-base mt-4">AI 处理中</h3>
            <p id="ai-loader-msg" class="text-xs text-gray-500 mt-2">正在处理...</p>
            <div class="ai-progress-bg">
                <div id="ai-loader-bar" class="ai-progress-bar"></div>
            </div>
            <p id="ai-timer" class="text-xs text-gray-400 mt-2 font-mono">0.0s</p>
        `;
        document.body.appendChild(div);
    },

    loading: (show, message = '处理中...', isAIProcess = false) => {
        ui.initLoader();
        const el = document.getElementById('ai-floating-loader');
        const msgEl = document.getElementById('ai-loader-msg');
        const barEl = document.getElementById('ai-loader-bar');
        const timerEl = document.getElementById('ai-timer');

        if (show) {
            el.classList.add('active');
            if(msgEl) msgEl.textContent = message;

            if (isAIProcess) {
                let progress = 0;
                let seconds = 0;
                if(barEl) barEl.style.width = '0%';
                
                if (window.aiTimer) clearInterval(window.aiTimer);
                
                window.aiTimer = setInterval(() => {
                    seconds += 0.1;
                    if(timerEl) timerEl.textContent = `${seconds.toFixed(1)}s`;
                    
                    if (progress < 90) {
                        const increment = (90 - progress) * 0.05; 
                        progress += increment > 0.1 ? increment : 0.1;
                        if(barEl) barEl.style.width = `${progress}%`;
                    }
                    
                    if (seconds > 2 && seconds < 5) {
                        msgEl.textContent = '正在识别内容...';
                    } else if (seconds > 5 && seconds < 10) {
                        msgEl.textContent = 'AI 智能分析...';
                    } else if (seconds > 10) {
                        msgEl.textContent = '即将完成...';
                    }
                }, 100);
            }
        } else {
            el.classList.remove('active');
            if (window.aiTimer) {
                clearInterval(window.aiTimer);
                window.aiTimer = null;
            }
            if(barEl) barEl.style.width = '100%';
        }
    }
};

document.addEventListener('DOMContentLoaded', auth.init);