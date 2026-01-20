"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const workout_routes_1 = __importDefault(require("./routes/workout.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' })); // Aumentado para suportar JSON grandes de treino
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// OTA Update endpoint - retorna informações da versão mais recente
app.get('/updates/version.json', (req, res) => {
    res.json({
        version: "1.1.1",
        versionCode: 111,
        releaseDate: "2026-01-16",
        releaseNotes: "Correção do sistema OTA, timer em segundo plano, melhorias de layout",
        apkUrl: "http://168.75.78.128:8088/releases/v1.1.1/galaxy-fit-sync-1.1.1.apk",
        forceUpdate: false
    });
});
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/workouts', workout_routes_1.default);
app.use('/templates', template_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
// Start server
async function start() {
    try {
        console.log('[Server] Initializing database connection...');
        await (0, database_1.initializePool)();
        app.listen(PORT, () => {
            console.log(`[Server] API running on http://localhost:${PORT}`);
            console.log('[Server] Endpoints:');
            console.log('  POST /auth/signup');
            console.log('  POST /auth/login');
            console.log('  GET  /auth/me');
            console.log('  GET  /workouts');
            console.log('  GET  /workouts/stats');
            console.log('  GET  /workouts/:id');
            console.log('  POST /workouts');
            console.log('  PUT  /workouts/:id');
            console.log('  DELETE /workouts/:id');
        });
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[Server] Shutting down...');
    await (0, database_1.closePool)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('[Server] Shutting down...');
    await (0, database_1.closePool)();
    process.exit(0);
});
start();
//# sourceMappingURL=index.js.map