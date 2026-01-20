import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
    getWorkoutsByUserId,
    getWorkoutById,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutStats,
} from '../services/workout.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /workouts
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const workouts = await getWorkoutsByUserId(req.user!.userId);
        res.json({ success: true, data: workouts });
    } catch (error: any) {
        console.error('[Workouts] Get all error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /workouts/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const stats = await getWorkoutStats(req.user!.userId);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        console.error('[Workouts] Get stats error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /workouts/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const workout = await getWorkoutById(req.params.id, req.user!.userId);
        if (!workout) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, data: workout });
    } catch (error: any) {
        console.error('[Workouts] Get by id error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /workouts
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { workout_id, workout_name, start_time, end_time, duration_seconds, exercises, user_weight } = req.body;

        if (!workout_id || !workout_name || !start_time || !end_time || !exercises) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }

        const workout = await createWorkout(req.user!.userId, {
            workout_id,
            workout_name,
            start_time,
            end_time,
            duration_seconds: duration_seconds || 0,
            exercises,
            user_weight,
        });

        res.status(201).json({ success: true, data: workout });
    } catch (error: any) {
        console.error('[Workouts] Create error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /workouts/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const workout = await updateWorkout(req.params.id, req.user!.userId, req.body);
        if (!workout) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, data: workout });
    } catch (error: any) {
        console.error('[Workouts] Update error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /workouts/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const deleted = await deleteWorkout(req.params.id, req.user!.userId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Workout not found' });
            return;
        }
        res.json({ success: true, message: 'Workout deleted successfully' });
    } catch (error: any) {
        console.error('[Workouts] Delete error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
