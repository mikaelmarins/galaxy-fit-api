export interface User {
    id: string;
    email: string;
    password_hash?: string;
    name: string | null;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}
export interface WorkoutLog {
    id: string;
    user_id: string;
    workout_id: string;
    workout_name: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    exercises: ExerciseData[];
    user_weight: number | null;
    created_at: string;
}
export interface ExerciseData {
    exerciseId: string;
    exerciseName: string;
    sets: SetData[];
}
export interface SetData {
    setNumber: number;
    weight: number;
    reps: number;
}
export interface AuthPayload {
    userId: string;
    email: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map