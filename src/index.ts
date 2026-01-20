import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { initializePool, closePool } from './config/database';
import authRoutes from './routes/auth.routes';
import workoutRoutes from './routes/workout.routes';
import templateRoutes from './routes/template.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Aumentado para suportar JSON grandes de treino

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OTA Update endpoint - serve version.json from /var/www/updates/
app.get('/updates/version.json', (req, res) => {
    const versionFilePath = '/var/www/updates/version.json';

    try {
        if (fs.existsSync(versionFilePath)) {
            const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
            res.json(versionData);
        } else {
            // Fallback se arquivo não existir
            res.status(404).json({ error: 'Version file not found' });
        }
    } catch (error) {
        console.error('[OTA] Error reading version file:', error);
        res.status(500).json({ error: 'Failed to read version info' });
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/workouts', workoutRoutes);
app.use('/templates', templateRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function start() {
    try {
        console.log('[Server] Initializing database connection...');
        await initializePool();

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
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[Server] Shutting down...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Server] Shutting down...');
    await closePool();
    process.exit(0);
});

start();
