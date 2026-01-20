import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Oracle Thin mode is used by default (no Oracle Client needed)
// This works on all platforms including ARM64

const dbConfig: any = {
    user: process.env.ORACLE_USER || 'ADMIN',
    password: process.env.ORACLE_PASSWORD || '',
    connectString: process.env.ORACLE_CONNECTION_STRING || '',
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
};

// Configure LOB fetching as strings (fixes circular reference issue)
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [oracledb.BLOB];

let pool: oracledb.Pool | null = null;

export async function initializePool(): Promise<void> {
    try {
        pool = await oracledb.createPool(dbConfig);
        console.log('[DB] Oracle connection pool created successfully');

        // Test connection
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        console.log('[DB] Database connection test successful');
    } catch (error) {
        console.error('[DB] Failed to create connection pool:', error);
        throw error;
    }
}

export async function getConnection(): Promise<oracledb.Connection> {
    if (!pool) {
        throw new Error('Database pool not initialized');
    }
    const connection = await pool.getConnection();
    // Set schema to GALAXY_FIT_SYNC for all queries
    await connection.execute('ALTER SESSION SET CURRENT_SCHEMA = GALAXY_FIT_SYNC');
    return connection;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.close(0);
        pool = null;
        console.log('[DB] Connection pool closed');
    }
}

export { oracledb };
