"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const workout_service_1 = require("../services/workout.service");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /workouts
router.get('/', async (req, res) => {
    try {
        const workouts = await (0, workout_service_1.getWorkoutsByUserId)(req.user.userId);
        res.json({ success: true, data: workouts });
    }
    catch (error) {
        console.error('[Workouts] Get all error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// GET /workouts/stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await (0, workout_service_1.getWorkoutStats)(req.user.userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error('[Workouts] Get stats error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// GET /workouts/:id
router.get('/:id', async (req, res) => {
    try {
        const workout = await (0, workout_service_1.getWorkoutById)(req.params.id, req.user.userId);
        if (!workout) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, data: workout });
    }
    catch (error) {
        console.error('[Workouts] Get by id error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// POST /workouts
router.post('/', async (req, res) => {
    try {
        const { workout_id, workout_name, start_time, end_time, duration_seconds, exercises, user_weight } = req.body;
        if (!workout_id || !workout_name || !start_time || !end_time || !exercises) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const workout = await (0, workout_service_1.createWorkout)(req.user.userId, {
            workout_id,
            workout_name,
            start_time,
            end_time,
            duration_seconds: duration_seconds || 0,
            exercises,
            user_weight,
        });
        res.status(201).json({ success: true, data: workout });
    }
    catch (error) {
        console.error('[Workouts] Create error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// PUT /workouts/:id
router.put('/:id', async (req, res) => {
    try {
        const workout = await (0, workout_service_1.updateWorkout)(req.params.id, req.user.userId, req.body);
        if (!workout) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, data: workout });
    }
    catch (error) {
        console.error('[Workouts] Update error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// DELETE /workouts/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await (0, workout_service_1.deleteWorkout)(req.params.id, req.user.userId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, message: 'Workout deleted successfully' });
    }
    catch (error) {
        console.error('[Workouts] Delete error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=workout.routes.js.map