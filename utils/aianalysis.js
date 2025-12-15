const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.AI_API_KEY;
const MODEL_ID = process.env.AI_MODEL_ID || 'gpt-4';
const API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

// Timeout: 5 minutes for large files and image analysis
const TIMEOUT = 300000;
const MAX_RETRIES = 2;

/**
 * Predefined Theme Classification System
 */
const PREDEFINED_THEMES = [
    'Art & Entertainment',
    'Globalisation',
    'Crime',
    'Transport',
    'Population',
    'Government',
    'Science',
    'Media Communication',
    'Work & Economy',
    'Culture',
    'Society',
    'Health',
    'Environment',
    'Technology',
    'Education'
];

/**
 * Enhanced System Prompt with Theme Classification
 */
const ENHANCED_SYSTEM_PROMPT = `
You are an expert English Language Acquisition Specialist and Critical Thinking Coach.
Your mission: Transform passive reading into ACTIVE MASTERY.

**Core Principles:**
1. NO isolated words → Extract COLLOCATIONS and CHUNKS
2. NO shallow translation → Provide CRITICAL INSIGHTS
3. NO mute learning → Generate USAGE SCENARIOS

**Theme Classification:**
Classify the text into one or more of these themes:
${PREDEFINED_THEMES.map((t, i) => `${i + 1}. ${t}`).join('\n')}

If the text doesn't fit any theme, suggest a new custom theme.

**Analysis Requirements:**

1. **Summary (摘要)**: 
   - One concise sentence in Chinese
   - Capture the ESSENCE, not just keywords

2. **Translation (翻译)**:
   - Natural, fluent Chinese
   - Preserve tone and nuance
   - NOT word-by-word literal translation

3. **Vocabulary (词汇库)**:
   For EACH significant word/phrase:
   {
     "word": "the word or phrase",
     "meaning": "Chinese meaning with context",
     "originalSentence": "The EXACT sentence from source text containing this word",
     "collocation": "Common phrases using this word (e.g., 'make a decision', 'take action')",
     "reason": "Why this is worth memorizing (e.g., 'Academic vocabulary', 'Business context', 'IELTS Band 7+')",
     "usageScenario": "A practical example sentence showing how to USE this word"
   }

4. **Opinion Analysis (观点分析)**:
   {
     "coreViewpoint": "Main argument/thesis in Chinese",
     "supportingEvidence": ["Evidence 1", "Evidence 2", "Evidence 3"],
     "criticalQuestion": "A thought-provoking Socratic question in English to challenge the learner",
     "counterargument": "Potential opposing view (if applicable)"
   }

5. **Theme Tags (主题标签)**:
   - Primary theme from predefined list
   - Secondary themes (if applicable)
   - Custom tags for specific topics

**Output Format (STRICT JSON):**
{
  "summary": "...",
  "translation": "...",
  "vocabulary": [
    {
      "word": "...",
      "meaning": "...",
      "originalSentence": "...",
      "collocation": "...",
      "reason": "...",
      "usageScenario": "..."
    }
  ],
  "opinion": {
    "coreViewpoint": "...",
    "supportingEvidence": ["...", "..."],
    "criticalQuestion": "...",
    "counterargument": "..."
  },
  "themes": {
    "primary": "One of the predefined themes",
    "secondary": ["Additional themes"],
    "custom": ["Custom tags if needed"]
  },
  "tags": ["tag1", "tag2", "tag3"]
}

**Quality Standards:**
- Extract 5-15 high-value vocabulary items (prioritize CHUNKS over single words)
- Each vocabulary item MUST include original sentence from the text
- Focus on PRACTICAL, REUSABLE language patterns
- Provide context-rich, scenario-based learning
`;

/**
 * Validate analysis result structure
 */
function validateAnalysisResult(parsed, originalText) {
    // Ensure required fields exist with proper defaults
    if (!parsed.vocabulary || !Array.isArray(parsed.vocabulary)) {
        parsed.vocabulary = [];
    }
    
    if (!parsed.themes || typeof parsed.themes !== 'object') {
        parsed.themes = { primary: 'General', secondary: [], custom: [] };
    } else {
        // Validate themes structure
        if (!parsed.themes.primary) parsed.themes.primary = 'General';
        if (!Array.isArray(parsed.themes.secondary)) parsed.themes.secondary = [];
        if (!Array.isArray(parsed.themes.custom)) parsed.themes.custom = [];
    }
    
    if (!parsed.tags || !Array.isArray(parsed.tags)) {
        parsed.tags = [];
    }
    
    if (!parsed.summary) {
        parsed.summary = '文本摘要生成失败';
    }
    
    if (!parsed.translation) {
        parsed.translation = originalText;
    }
    
    if (!parsed.opinion || typeof parsed.opinion !== 'object') {
        parsed.opinion = {
            coreViewpoint: '',
            supportingEvidence: [],
            criticalQuestion: '',
            counterargument: ''
        };
    }
    
    // Validate and enhance vocabulary items
    parsed.vocabulary = parsed.vocabulary.map(v => {
        if (!v || typeof v !== 'object') return null;
        
        return {
            word: v.word || '',
            meaning: v.meaning || '',
            originalSentence: v.originalSentence || originalText.substring(0, 200) + '...',
            collocation: v.collocation || '',
            reason: v.reason || 'Important vocabulary',
            usageScenario: v.usageScenario || `Example: ${v.collocation || v.word}`
        };
    }).filter(v => v && v.word); // Remove null/invalid items
    
    return parsed;
}

/**
 * Analyze text with enhanced AI capabilities (with retry logic)
 * @param {string} text - Input text to analyze
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Structured analysis result
 */
async function analyzeTextWithAI(text, retryCount = 0) {
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Invalid input: text cannot be empty');
    }
    
    if (!API_KEY) {
        throw new Error('AI_API_KEY is not configured in environment variables');
    }
    
    try {
        console.log(`🤖 AI Analyzing (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})... Text length: ${text.length}`);
        
        const response = await axios.post(
            API_URL,
            {
                model: MODEL_ID,
                messages: [
                    { role: "system", content: ENHANCED_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                temperature: 0.3,
                max_tokens: 4000,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                timeout: TIMEOUT
            }
        );

        const content = response.data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('AI response is empty');
        }
        
        // Parse and validate JSON response
        try {
            // Remove markdown code blocks if present
            const cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleanedContent);
            
            // Validate and enhance the result
            const validated = validateAnalysisResult(parsed, text);
            
            console.log(`✅ AI Analysis successful. Vocabulary items: ${validated.vocabulary.length}`);
            return validated;
            
        } catch (parseError) {
            console.error("❌ AI JSON Parse Error:", parseError.message);
            console.error("Response content:", content.substring(0, 500));
            
            // Retry if possible
            if (retryCount < MAX_RETRIES) {
                console.log(`🔄 Retrying AI analysis...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return analyzeTextWithAI(text, retryCount + 1);
            }
            
            throw new Error("AI返回格式异常，请重试");
        }

    } catch (error) {
        console.error("❌ AI Service Error:", error.response?.data || error.message);
        
        // Handle specific error types
        if (error.code === 'ECONNABORTED') {
            throw new Error(`AI分析超时（超过${TIMEOUT/1000}秒），请尝试减少内容后重试`);
        }
        
        if (error.response?.status === 401) {
            throw new Error('AI API认证失败，请检查API密钥配置');
        }
        
        if (error.response?.status === 429) {
            throw new Error('AI API请求频率过高，请稍后重试');
        }
        
        if (error.response?.status === 500 || error.response?.status === 503) {
            throw new Error('AI服务暂时不可用，请稍后重试');
        }
        
        // Retry on network errors
        if (retryCount < MAX_RETRIES && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
            console.log(`🔄 Retrying due to network error...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return analyzeTextWithAI(text, retryCount + 1);
        }
        
        throw new Error(error.response?.data?.error?.message || error.message || 'AI分析失败');
    }
}

/**
 * Get available predefined themes
 * @returns {Array<string>} - List of predefined themes
 */
function getPredefinedThemes() {
    return [...PREDEFINED_THEMES]; // Return a copy to prevent mutation
}

/**
 * Validate theme structure
 * @param {Object} themes - Theme object to validate
 * @returns {Object} - Validated theme object
 */
function validateThemes(themes) {
    if (!themes || typeof themes !== 'object') {
        return { primary: 'General', secondary: [], custom: [] };
    }
    
    return {
        primary: themes.primary && PREDEFINED_THEMES.includes(themes.primary) 
            ? themes.primary 
            : 'General',
        secondary: Array.isArray(themes.secondary) 
            ? themes.secondary.filter(t => PREDEFINED_THEMES.includes(t))
            : [],
        custom: Array.isArray(themes.custom) ? themes.custom : []
    };
}

module.exports = { 
    analyzeTextWithAI,
    getPredefinedThemes,
    validateThemes,
    PREDEFINED_THEMES
};
