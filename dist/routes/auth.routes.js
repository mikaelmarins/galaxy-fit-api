"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, error: 'Email and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
            return;
        }
        const result = await (0, auth_service_1.signup)(email, password, name);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        console.error('[Auth] Signup error:', error.message);
        res.status(400).json({ success: false, error: error.message });
    }
});
// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, error: 'Email and password are required' });
            return;
        }
        const result = await (0, auth_service_1.login)(email, password);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('[Auth] Login error:', error.message);
        res.status(401).json({ success: false, error: error.message });
    }
});
// GET /auth/me (protected)
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }
        const user = await (0, auth_service_1.getUserById)(req.user.userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: { user } });
    }
    catch (error) {
        console.error('[Auth] Get me error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map