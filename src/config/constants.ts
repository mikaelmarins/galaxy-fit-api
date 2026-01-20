// Schema name for all tables
export const SCHEMA = 'GALAXY_FIT_SYNC';

// Table names with schema prefix
export const TABLES = {
    USERS: `${SCHEMA}.USERS`,
    WORKOUT_LOGS: `${SCHEMA}.WORKOUT_LOGS`,
} as const;
