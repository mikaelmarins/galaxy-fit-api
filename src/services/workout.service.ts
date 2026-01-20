import { v4 as uuidv4 } from 'uuid';
import { getConnection, oracledb } from '../config/database';
import { TABLES } from '../config/constants';
import { WorkoutLog, ExerciseData } from '../types';

export async function getWorkoutsByUserId(userId: string): Promise<WorkoutLog[]> {
    const connection = await getConnection();

    try {
        const result = await connection.execute<any[]>(
            `SELECT ID, USER_ID, WORKOUT_ID, WORKOUT_NAME, START_TIME, END_TIME, 
              DURATION_SECONDS, EXERCISES, USER_WEIGHT, CREATED_AT 
       FROM ${TABLES.WORKOUT_LOGS} 
       WHERE USER_ID = :userId 
       ORDER BY END_TIME DESC`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result.rows) return [];

        return result.rows.map((row: any) => ({
            id: row.ID,
            user_id: row.USER_ID,
            workout_id: row.WORKOUT_ID,
            workout_name: row.WORKOUT_NAME,
            start_time: row.START_TIME?.toISOString() || '',
            end_time: row.END_TIME?.toISOString() || '',
            duration_seconds: row.DURATION_SECONDS,
            exercises: typeof row.EXERCISES === 'string' ? JSON.parse(row.EXERCISES) : row.EXERCISES,
            user_weight: row.USER_WEIGHT,
            created_at: row.CREATED_AT?.toISOString() || '',
        }));
    } finally {
        await connection.close();
    }
}

export async function getWorkoutById(id: string, userId: string): Promise<WorkoutLog | null> {
    const connection = await getConnection();

    try {
        const result = await connection.execute<any[]>(
            `SELECT ID, USER_ID, WORKOUT_ID, WORKOUT_NAME, START_TIME, END_TIME, 
              DURATION_SECONDS, EXERCISES, USER_WEIGHT, CREATED_AT 
       FROM ${TABLES.WORKOUT_LOGS} 
       WHERE ID = :id AND USER_ID = :userId`,
            { id, userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result.rows || result.rows.length === 0) return null;

        const row = result.rows[0] as any;
        return {
            id: row.ID,
            user_id: row.USER_ID,
            workout_id: row.WORKOUT_ID,
            workout_name: row.WORKOUT_NAME,
            start_time: row.START_TIME?.toISOString() || '',
            end_time: row.END_TIME?.toISOString() || '',
            duration_seconds: row.DURATION_SECONDS,
            exercises: typeof row.EXERCISES === 'string' ? JSON.parse(row.EXERCISES) : row.EXERCISES,
            user_weight: row.USER_WEIGHT,
            created_at: row.CREATED_AT?.toISOString() || '',
        };
    } finally {
        await connection.close();
    }
}

export async function createWorkout(
    userId: string,
    data: {
        workout_id: string;
        workout_name: string;
        start_time: string;
        end_time: string;
        duration_seconds: number;
        exercises: ExerciseData[];
        user_weight?: number;
    }
): Promise<WorkoutLog> {
    const connection = await getConnection();

    try {
        const id = uuidv4();
        const exercisesJson = JSON.stringify(data.exercises);

        await connection.execute(
            `INSERT INTO ${TABLES.WORKOUT_LOGS} 
       (ID, USER_ID, WORKOUT_ID, WORKOUT_NAME, START_TIME, END_TIME, DURATION_SECONDS, EXERCISES, USER_WEIGHT) 
       VALUES (:id, :userId, :workoutId, :workoutName, 
               TO_TIMESTAMP_TZ(:startTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'), 
               TO_TIMESTAMP_TZ(:endTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'), 
               :durationSeconds, :exercises, :userWeight)`,
            {
                id,
                userId,
                workoutId: data.workout_id,
                workoutName: data.workout_name,
                startTime: data.start_time,
                endTime: data.end_time,
                durationSeconds: data.duration_seconds,
                exercises: exercisesJson,
                userWeight: data.user_weight || null,
            },
            { autoCommit: true }
        );

        return {
            id,
            user_id: userId,
            workout_id: data.workout_id,
            workout_name: data.workout_name,
            start_time: data.start_time,
            end_time: data.end_time,
            duration_seconds: data.duration_seconds,
            exercises: data.exercises,
            user_weight: data.user_weight || null,
            created_at: new Date().toISOString(),
        };
    } finally {
        await connection.close();
    }
}

export async function updateWorkout(
    id: string,
    userId: string,
    data: Partial<{
        workout_id: string;
        workout_name: string;
        start_time: string;
        end_time: string;
        duration_seconds: number;
        exercises: ExerciseData[];
        user_weight: number | null;
    }>
): Promise<WorkoutLog | null> {
    const connection = await getConnection();

    try {
        // Build dynamic update query
        const updates: string[] = [];
        const binds: Record<string, any> = { id, userId };

        if (data.workout_id) {
            updates.push('WORKOUT_ID = :workoutId');
            binds.workoutId = data.workout_id;
        }
        if (data.workout_name) {
            updates.push('WORKOUT_NAME = :workoutName');
            binds.workoutName = data.workout_name;
        }
        if (data.exercises) {
            updates.push('EXERCISES = :exercises');
            binds.exercises = JSON.stringify(data.exercises);
        }
        if (data.user_weight !== undefined) {
            updates.push('USER_WEIGHT = :userWeight');
            binds.userWeight = data.user_weight;
        }

        if (updates.length === 0) {
            return getWorkoutById(id, userId);
        }

        await connection.execute(
            `UPDATE ${TABLES.WORKOUT_LOGS} SET ${updates.join(', ')} WHERE ID = :id AND USER_ID = :userId`,
            binds,
            { autoCommit: true }
        );

        return getWorkoutById(id, userId);
    } finally {
        await connection.close();
    }
}

export async function deleteWorkout(id: string, userId: string): Promise<boolean> {
    const connection = await getConnection();

    try {
        const result = await connection.execute(
            `DELETE FROM ${TABLES.WORKOUT_LOGS} WHERE ID = :id AND USER_ID = :userId`,
            { id, userId },
            { autoCommit: true }
        );

        return (result.rowsAffected || 0) > 0;
    } finally {
        await connection.close();
    }
}

export async function getWorkoutStats(userId: string): Promise<{
    totalWorkouts: number;
    thisWeek: number;
    thisMonth: number;
}> {
    const connection = await getConnection();

    try {
        const result = await connection.execute<any[]>(
            `SELECT 
        COUNT(*) as TOTAL,
        SUM(CASE WHEN END_TIME >= TRUNC(SYSDATE, 'IW') THEN 1 ELSE 0 END) as THIS_WEEK,
        SUM(CASE WHEN END_TIME >= TRUNC(SYSDATE, 'MM') THEN 1 ELSE 0 END) as THIS_MONTH
       FROM ${TABLES.WORKOUT_LOGS} WHERE USER_ID = :userId`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const row = result.rows?.[0] as any;
        return {
            totalWorkouts: row?.TOTAL || 0,
            thisWeek: row?.THIS_WEEK || 0,
            thisMonth: row?.THIS_MONTH || 0,
        };
    } finally {
        await connection.close();
    }
}
