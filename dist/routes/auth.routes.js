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
// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, error: 'Email é obrigatório' });
            return;
        }
        const result = await (0, auth_service_1.requestPasswordReset)(email);
        res.json({
            success: true,
            message: 'Código de recuperação gerado com sucesso',
            pin: result.pin // Facilitador de recuperação direta
        });
    }
    catch (error) {
        console.error('[Auth] Forgot password error:', error.message);
        res.status(400).json({ success: false, error: error.message || 'Erro ao processar solicitação' });
    }
});
// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, pin, newPassword } = req.body;
        if (!email || !pin || !newPassword) {
            res.status(400).json({ success: false, error: 'Email, código PIN e nova senha são obrigatórios' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres' });
            return;
        }
        await (0, auth_service_1.resetPasswordWithPin)(email, pin, newPassword);
        res.json({ success: true, message: 'Senha atualizada com sucesso!' });
    }
    catch (error) {
        console.error('[Auth] Reset password error:', error.message);
        res.status(400).json({ success: false, error: error.message || 'Erro ao redefinir senha' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map