import { WorkoutLog, ExerciseData } from '../types';
export declare function getWorkoutsByUserId(userId: string): Promise<WorkoutLog[]>;
export declare function getWorkoutById(id: string, userId: string): Promise<WorkoutLog | null>;
export declare function createWorkout(userId: string, data: {
    workout_id: string;
    workout_name: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    exercises: ExerciseData[];
    user_weight?: number;
}): Promise<WorkoutLog>;
export declare function updateWorkout(id: string, userId: string, data: Partial<{
    workout_id: string;
    workout_name: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    exercises: ExerciseData[];
    user_weight: number | null;
}>): Promise<WorkoutLog | null>;
export declare function deleteWorkout(id: string, userId: string): Promise<boolean>;
export declare function getWorkoutStats(userId: string): Promise<{
    totalWorkouts: number;
    thisWeek: number;
    thisMonth: number;
}>;
//# sourceMappingURL=workout.service.d.ts.map