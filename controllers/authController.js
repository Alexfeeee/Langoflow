const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Unified JWT secret (MUST match middleware/auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'english_learning_app_secret_key_2024';

/**
 * User Registration
 */
exports.register = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码必填' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ error: '用户名至少3个字符' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: '密码至少6个字符' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }
        
        // Check email if provided
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ error: '邮箱已被注册' });
            }
        }

        // Create new user
        // NOTE: In production, use bcrypt to hash password
        const user = new User({ 
            username, 
            password, // TODO: Hash with bcrypt in production
            email: email || undefined 
        });
        await user.save();

        console.log(`✅ User registered: ${username}`);
        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: '注册失败: ' + error.message });
    }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码必填' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // Verify password (plain text comparison - use bcrypt.compare in production)
        if (user.password !== password) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // CRITICAL FIX: Generate token with consistent field names
        // Include both _id and userId for maximum compatibility
        const token = jwt.sign(
            { 
                _id: user._id,        // Primary field (matches auth middleware)
                userId: user._id,     // Backup field
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update login statistics
        if (typeof user.updateStatistics === 'function') {
            await user.updateStatistics().catch(err => {
                console.error('Update statistics error:', err);
            });
        }

        console.log(`✅ User logged in: ${username}`);
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username,
                email: user.email 
            } 
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: '登录失败: ' + error.message });
    }
};

/**
 * Get Current User Info
 * Requires auth middleware
 */
exports.getMe = async (req, res) => {
    try {
        // req.user is populated by auth middleware
        if (!req.user) {
            return res.status(401).json({ error: '未找到用户信息' });
        }
        
        res.json({
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            createdAt: req.user.createdAt,
            statistics: req.user.statistics || {}
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
};

/**
 * Update User Profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const user = req.user;
        
        // Update email if provided
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingEmail) {
                return res.status(400).json({ error: '邮箱已被使用' });
            }
            user.email = email;
        }
        
        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: '请提供当前密码' });
            }
            
            if (user.password !== currentPassword) {
                return res.status(401).json({ error: '当前密码错误' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ error: '新密码至少6个字符' });
            }
            
            user.password = newPassword; // TODO: Hash with bcrypt in production
        }
        
        await user.save();
        
        res.json({ 
            message: '更新成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: '更新失败: ' + error.message });
    }
};