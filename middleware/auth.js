const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Unified JWT secret (MUST match authController.js)
const JWT_SECRET = process.env.JWT_SECRET || 'english_learning_app_secret_key_2024';

/**
 * Authentication Middleware (FIXED VERSION)
 * Purpose: Verify JWT token and load complete User object from database
 * Critical: Must use findOne to get Mongoose Document with methods
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // CRITICAL FIX: Query database for complete user object
        // Try multiple field names for compatibility
        const userId = decoded._id || decoded.userId || decoded.id;
        
        if (!userId) {
            throw new Error('Invalid token payload: missing user ID');
        }
        
        const user = await User.findOne({ _id: userId });

        if (!user) {
            throw new Error('User not found in database');
        }

        // Attach complete Mongoose Document to request
        req.token = token;
        req.user = user; // This includes all methods like updateStatistics()
        
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        
        // Provide specific error messages
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token无效，请重新登录' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token已过期，请重新登录' });
        }
        
        res.status(401).json({ error: '认证失败，请重新登录' });
    }
};

module.exports = auth;