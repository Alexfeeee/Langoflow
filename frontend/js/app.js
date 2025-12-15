// API配置
const API_BASE = 'http://localhost:3000/api';
const AI_API_BASE = 'http://localhost:3000/ai'; // 新增AI API地址

let currentAnalysis = null;
let editMode = false;
let currentCorpusId = null;

// ========== 新增：AI工具状态管理 ==========
const aiState = {
    currentWord: null,
    currentSentence: null,
    loadingStates: {
        contextExplain: false,
        collocations: false,
        polishTone: false,
        logicCheck: false
    }
};

// ========== 新增：AI工具API调用函数 ==========
const aiTools = {
    /**
     * 🔍 Context Detective - 解释单词在句子中的具体含义
     */
    async explainContext(word, sentence) {
        try {
            aiState.loadingStates.contextExplain = true;
            
            const response = await fetch(`${AI_API_BASE}/context-explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: word,
                    fullSentence: sentence
                })
            });

            if (!response.ok) throw new Error('AI分析失败');
            
            const data = await response.json();
            return data.explanation;
        } catch (error) {
            console.error('Context Explain Error:', error);
            throw error;
        } finally {
            aiState.loadingStates.contextExplain = false;
        }
    },

    /**
     * 🏗️ Collocation Architect - 生成词汇搭配
     */
    async getCollocations(word) {
        try {
            aiState.loadingStates.collocations = true;
            
            const response = await fetch(`${AI_API_BASE}/collocations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: word })
            });

            if (!response.ok) throw new Error('获取搭配失败');
            
            const data = await response.json();
            return data.collocations;
        } catch (error) {
            console.error('Collocations Error:', error);
            throw error;
        } finally {
            aiState.loadingStates.collocations = false;
        }
    },

    /**
     * ✨ Tone Stylist - 改写句子语气
     */
    async polishTone(sentence, tone) {
        try {
            aiState.loadingStates.polishTone = true;
            
            const response = await fetch(`${AI_API_BASE}/polish-tone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalSentence: sentence,
                    targetTone: tone
                })
            });

            if (!response.ok) throw new Error('改写失败');
            
            const data = await response.json();
            return data.polished;
        } catch (error) {
            console.error('Polish Tone Error:', error);
            throw error;
        } finally {
            aiState.loadingStates.polishTone = false;
        }
    },

    /**
     * 🔬 Logic Surgeon - 检测中式英语
     */
    async checkLogic(sentence, nativeLanguage = 'zh-CN') {
        try {
            aiState.loadingStates.logicCheck = true;
            
            const response = await fetch(`${AI_API_BASE}/logic-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userSentence: sentence,
                    nativeLanguage: nativeLanguage
                })
            });

            if (!response.ok) throw new Error('逻辑检查失败');
            
            const data = await response.json();
            return {
                isNativeLike: data.isNativeLike,
                detectedL1Logic: data.detectedL1Logic,
                explanation: data.explanation,
                betterAlternative: data.betterAlternative
            };
        } catch (error) {
            console.error('Logic Check Error:', error);
            throw error;
        } finally {
            aiState.loadingStates.logicCheck = false;
        }
    }
};

// 内置示例数据（保持原有）
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

// === Auth 逻辑（保持原有）===
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

// === 路由（保持原有）===
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
    // ========== 上传页面（新增AI工具） ==========
    upload: () => {
        document.getElementById('main-content').innerHTML = `
            <div class="p-4 space-y-4">
                <!-- 文本输入 -->
                <div class="bg-white border border-border rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-edit-line"></i>
                        输入英文文本
                    </h3>
                    <textarea id="text-input" placeholder="粘贴英文段落或句子..." 
                        class="w-full h-40 p-3 bg-surface border border-border rounded-xl resize-none focus:ring-2 focus:ring-accent outline-none"></textarea>
                </div>

                <!-- 新增：AI工具箱 -->
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-robot-line"></i>
                        AI 智能工具
                    </h3>
                    
                    <div class="space-y-3">
                        <!-- 工具1: Context Detective -->
                        <div class="bg-white rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">🔍</span>
                                    <span class="text-sm font-medium text-primary">Context Detective</span>
                                </div>
                                <button onclick="pages.showContextExplain()" 
                                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg active:scale-95 transition">
                                    使用
                                </button>
                            </div>
                            <p class="text-xs text-secondary">解释单词在句子中的具体含义</p>
                        </div>

                        <!-- 工具2: Collocation Architect -->
                        <div class="bg-white rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">🏗️</span>
                                    <span class="text-sm font-medium text-primary">Collocation Architect</span>
                                </div>
                                <button onclick="pages.showCollocations()" 
                                    class="px-3 py-1 bg-green-500 text-white text-xs rounded-lg active:scale-95 transition">
                                    使用
                                </button>
                            </div>
                            <p class="text-xs text-secondary">生成单词的常用搭配</p>
                        </div>

                        <!-- 工具3: Tone Stylist -->
                        <div class="bg-white rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">✨</span>
                                    <span class="text-sm font-medium text-primary">Tone Stylist</span>
                                </div>
                                <button onclick="pages.showTonePolish()" 
                                    class="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg active:scale-95 transition">
                                    使用
                                </button>
                            </div>
                            <p class="text-xs text-secondary">改写句子语气（正式/随意/诗意/商务）</p>
                        </div>

                        <!-- 工具4: Logic Surgeon -->
                        <div class="bg-white rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">🔬</span>
                                    <span class="text-sm font-medium text-primary">Logic Surgeon</span>
                                </div>
                                <button onclick="pages.showLogicCheck()" 
                                    class="px-3 py-1 bg-red-500 text-white text-xs rounded-lg active:scale-95 transition">
                                    使用
                                </button>
                            </div>
                            <p class="text-xs text-secondary">检测中式英语，提供地道表达</p>
                        </div>
                    </div>
                </div>

                <!-- AI结果显示区域 -->
                <div id="ai-result-area" class="hidden"></div>

                <!-- 文件上传（保持原有） -->
                <div class="bg-white border border-border rounded-xl p-4">
                    <h3 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <i class="ri-upload-cloud-line"></i>
                        或上传文件
                    </h3>
                    <div class="border-2 border-dashed border-border rounded-xl p-8 text-center">
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
            </div>
        `;
    },

    // ========== 新增：AI工具弹窗函数 ==========
    
    /**
     * 🔍 Context Detective - 解释单词
     */
    showContextExplain: () => {
        const text = document.getElementById('text-input').value.trim();
        if (!text) {
            alert('请先输入文本');
            return;
        }

        const modal = `
            <div id="ai-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target.id==='ai-modal') this.remove()">
                <div class="bg-white rounded-xl p-6 max-w-md w-full">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span>🔍</span>
                        Context Detective
                    </h3>
                    
                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">选择要解释的单词:</label>
                        <input type="text" id="word-input" placeholder="例如: bank" 
                            class="w-full px-3 py-2 border border-border rounded-lg">
                    </div>

                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">完整句子:</label>
                        <textarea id="sentence-input" class="w-full px-3 py-2 border border-border rounded-lg h-20">${text}</textarea>
                    </div>

                    <div id="explain-result" class="hidden mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p class="text-sm text-primary"></p>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="pages.executeContextExplain()" 
                            class="flex-1 bg-blue-500 text-white py-2 rounded-lg active:scale-95 transition">
                            <span id="explain-btn-text">🔍 解释</span>
                        </button>
                        <button onclick="document.getElementById('ai-modal').remove()" 
                            class="px-4 py-2 border border-border rounded-lg active:scale-95 transition">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    executeContextExplain: async () => {
        const word = document.getElementById('word-input').value.trim();
        const sentence = document.getElementById('sentence-input').value.trim();
        
        if (!word || !sentence) {
            alert('请输入单词和句子');
            return;
        }

        const btn = document.getElementById('explain-btn-text');
        const result = document.getElementById('explain-result');
        
        btn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> 分析中...';

        try {
            const explanation = await aiTools.explainContext(word, sentence);
            result.classList.remove('hidden');
            result.querySelector('p').textContent = explanation;
            btn.textContent = '✓ 完成';
        } catch (error) {
            alert('AI分析失败: ' + error.message);
            btn.textContent = '🔍 解释';
        }
    },

    /**
     * 🏗️ Collocation Architect - 词汇搭配
     */
    showCollocations: () => {
        const modal = `
            <div id="ai-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target.id==='ai-modal') this.remove()">
                <div class="bg-white rounded-xl p-6 max-w-md w-full">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span>🏗️</span>
                        Collocation Architect
                    </h3>
                    
                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">输入单词:</label>
                        <input type="text" id="collocation-word" placeholder="例如: make" 
                            class="w-full px-3 py-2 border border-border rounded-lg">
                    </div>

                    <div id="collocation-result" class="hidden mb-4">
                        <h4 class="text-sm font-medium text-primary mb-2">常用搭配:</h4>
                        <ul id="collocation-list" class="space-y-1"></ul>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="pages.executeCollocations()" 
                            class="flex-1 bg-green-500 text-white py-2 rounded-lg active:scale-95 transition">
                            <span id="collocation-btn-text">🏗️ 生成</span>
                        </button>
                        <button onclick="document.getElementById('ai-modal').remove()" 
                            class="px-4 py-2 border border-border rounded-lg active:scale-95 transition">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    executeCollocations: async () => {
        const word = document.getElementById('collocation-word').value.trim();
        
        if (!word) {
            alert('请输入单词');
            return;
        }

        const btn = document.getElementById('collocation-btn-text');
        const result = document.getElementById('collocation-result');
        const list = document.getElementById('collocation-list');
        
        btn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> 生成中...';

        try {
            const collocations = await aiTools.getCollocations(word);
            result.classList.remove('hidden');
            list.innerHTML = collocations.map((item, i) => 
                `<li class="text-sm text-primary"><span class="font-bold text-green-600">${i+1}.</span> ${item}</li>`
            ).join('');
            btn.textContent = '✓ 完成';
        } catch (error) {
            alert('生成失败: ' + error.message);
            btn.textContent = '🏗️ 生成';
        }
    },

    /**
     * ✨ Tone Stylist - 改写语气
     */
    showTonePolish: () => {
        const text = document.getElementById('text-input').value.trim();
        if (!text) {
            alert('请先输入文本');
            return;
        }

        const modal = `
            <div id="ai-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target.id==='ai-modal') this.remove()">
                <div class="bg-white rounded-xl p-6 max-w-md w-full">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span>✨</span>
                        Tone Stylist
                    </h3>
                    
                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">原句:</label>
                        <textarea id="polish-sentence" class="w-full px-3 py-2 border border-border rounded-lg h-20">${text}</textarea>
                    </div>

                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">选择语气:</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="pages.executePolish('formal')" 
                                class="p-2 border-2 border-border rounded-lg hover:border-purple-500 active:scale-95 transition">
                                <div class="text-lg mb-1">👔</div>
                                <div class="text-xs">Formal</div>
                            </button>
                            <button onclick="pages.executePolish('casual')" 
                                class="p-2 border-2 border-border rounded-lg hover:border-purple-500 active:scale-95 transition">
                                <div class="text-lg mb-1">😎</div>
                                <div class="text-xs">Casual</div>
                            </button>
                            <button onclick="pages.executePolish('poetic')" 
                                class="p-2 border-2 border-border rounded-lg hover:border-purple-500 active:scale-95 transition">
                                <div class="text-lg mb-1">🌹</div>
                                <div class="text-xs">Poetic</div>
                            </button>
                            <button onclick="pages.executePolish('business')" 
                                class="p-2 border-2 border-border rounded-lg hover:border-purple-500 active:scale-95 transition">
                                <div class="text-lg mb-1">💼</div>
                                <div class="text-xs">Business</div>
                            </button>
                        </div>
                    </div>

                    <div id="polish-result" class="hidden mb-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                        <p class="text-sm text-primary font-medium"></p>
                    </div>

                    <button onclick="document.getElementById('ai-modal').remove()" 
                        class="w-full py-2 border border-border rounded-lg active:scale-95 transition">
                        关闭
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    executePolish: async (tone) => {
        const sentence = document.getElementById('polish-sentence').value.trim();
        
        if (!sentence) {
            alert('请输入句子');
            return;
        }

        const result = document.getElementById('polish-result');
        result.classList.remove('hidden');
        result.querySelector('p').innerHTML = '<i class="ri-loader-4-line animate-spin"></i> 改写中...';

        try {
            const polished = await aiTools.polishTone(sentence, tone);
            result.querySelector('p').textContent = polished;
        } catch (error) {
            alert('改写失败: ' + error.message);
            result.classList.add('hidden');
        }
    },

    /**
     * 🔬 Logic Surgeon - 检测中式英语
     */
    showLogicCheck: () => {
        const text = document.getElementById('text-input').value.trim();
        if (!text) {
            alert('请先输入文本');
            return;
        }

        const modal = `
            <div id="ai-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target.id==='ai-modal') this.remove()">
                <div class="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span>🔬</span>
                        Logic Surgeon
                    </h3>
                    
                    <div class="mb-4">
                        <label class="text-sm text-secondary mb-2 block">检查句子:</label>
                        <textarea id="logic-sentence" class="w-full px-3 py-2 border border-border rounded-lg h-20">${text}</textarea>
                    </div>

                    <div id="logic-result" class="hidden mb-4"></div>

                    <div class="flex gap-2">
                        <button onclick="pages.executeLogicCheck()" 
                            class="flex-1 bg-red-500 text-white py-2 rounded-lg active:scale-95 transition">
                            <span id="logic-btn-text">🔬 检测</span>
                        </button>
                        <button onclick="document.getElementById('ai-modal').remove()" 
                            class="px-4 py-2 border border-border rounded-lg active:scale-95 transition">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    executeLogicCheck: async () => {
        const sentence = document.getElementById('logic-sentence').value.trim();
        
        if (!sentence) {
            alert('请输入句子');
            return;
        }

        const btn = document.getElementById('logic-btn-text');
        const result = document.getElementById('logic-result');
        
        btn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> 检测中...';

        try {
            const analysis = await aiTools.checkLogic(sentence);
            
            result.classList.remove('hidden');
            result.innerHTML = `
                <div class="p-3 rounded-lg ${analysis.isNativeLike ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-500'}">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xl">${analysis.isNativeLike ? '✅' : '⚠️'}</span>
                        <span class="font-bold text-sm">${analysis.isNativeLike ? '地道表达' : '检测到中式英语'}</span>
                    </div>
                    
                    ${analysis.detectedL1Logic ? `
                        <div class="mb-2">
                            <div class="text-xs text-secondary mb-1">检测到的模式:</div>
                            <div class="text-sm text-yellow-800">${analysis.detectedL1Logic}</div>
                        </div>
                    ` : ''}
                    
                    <div class="mb-2">
                        <div class="text-xs text-secondary mb-1">说明:</div>
                        <div class="text-sm text-primary">${analysis.explanation}</div>
                    </div>
                    
                    ${!analysis.isNativeLike ? `
                        <div class="p-2 bg-white rounded mt-2">
                            <div class="text-xs text-secondary mb-1">地道表达:</div>
                            <div class="text-sm text-green-700 font-medium">"${analysis.betterAlternative}"</div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            btn.textContent = '✓ 完成';
        } catch (error) {
            alert('检测失败: ' + error.message);
            btn.textContent = '🔬 检测';
        }
    },

    // 文件上传处理（保持原有）
    //handleFileUpload: (event) => {
    //    const file = event.target.files[0];
    //    if (!file) return;
        
    //    ui.loading(true, '正在处理文件...', true);
        
    //    setTimeout(() => {
    //        ui.loading(false);
    //        alert('文件上传功能需要后端支持');
    //   }, 1500);
    //},
    // 在 frontend/js/app.js 中找到这个函数并替换
    handleFileUpload: async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 1. 显示加载动画
        ui.loading(true, '正在上传并分析...', true);

        try {
            // 2. 构建表单数据
            const formData = new FormData();
            formData.append('file', file);

            // 3. 发送真实请求给后端
            // 注意：fetchAuth 会自动处理 Token，不需要手动设置 Content-Type，浏览器会自动识别 FormData
            const res = await auth.fetchAuth(`${API_BASE}/process/file`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            ui.loading(false);

            if (res.ok) {
                // 上传成功， data 就是后端返回的分析结果
                alert('文件分析成功！');
                console.log('分析结果:', data);
                
                // 这里你可以选择直接展示结果，或者自动填入文本框
                // 简单起见，我们先把它当作语料保存后的跳转
                // 如果你想直接显示分析结果，可以调用:
                // pages.displayAnalysisResult(data); 
            } else {
                throw new Error(data.error || '上传失败');
            }
        } catch (e) {
            ui.loading(false);
            console.error('上传错误:', e);
            alert('上传失败: ' + e.message);
        }
    },
    // ========== 语料库、观点墙、统计页面（完全保持原有代码）==========
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
                            <h3 class="font-bold text-primary mb-2">${item.title|| '无标题'}</h3>
                            <p class="text-sm text-secondary line-clamp-2 mb-3">${(item.content || '').substring(0, 100)}...</p>
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
                </div>
            `;
        } catch(e) {
            ui.loading(false);
            console.error('加载详情失败:', e);
            alert('加载失败');
        }
    },

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
            
            const themeCount = {};
            corpusData.list.forEach(c => {
                const theme = c.themes?.primary || 'General';
                themeCount[theme] = (themeCount[theme] || 0) + 1;
            });
            const topThemes = Object.entries(themeCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
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
                                <span>使用AI工具检查你的英文表达，避免中式英语</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="ri-checkbox-circle-line text-accent mt-0.5"></i>
                                <span>定期回顾核心观点，培养批判性思维</span>
                            </li>
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

// === UI工具（保持原有）===
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