"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oracledb = void 0;
exports.initializePool = initializePool;
exports.getConnection = getConnection;
exports.closePool = closePool;
const oracledb_1 = __importDefault(require("oracledb"));
exports.oracledb = oracledb_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Oracle Thin mode is used by default (no Oracle Client needed)
// This works on all platforms including ARM64
const dbConfig = {
    user: process.env.ORACLE_USER || 'ADMIN',
    password: process.env.ORACLE_PASSWORD || '',
    connectString: process.env.ORACLE_CONNECTION_STRING || '',
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
};
// Configure LOB fetching as strings (fixes circular reference issue)
oracledb_1.default.fetchAsString = [oracledb_1.default.CLOB];
oracledb_1.default.fetchAsBuffer = [oracledb_1.default.BLOB];
let pool = null;
async function initializePool() {
    try {
        pool = await oracledb_1.default.createPool(dbConfig);
        console.log('[DB] Oracle connection pool created successfully');
        // Test connection
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        console.log('[DB] Database connection test successful');
    }
    catch (error) {
        console.error('[DB] Failed to create connection pool:', error);
        throw error;
    }
}
async function getConnection() {
    if (!pool) {
        throw new Error('Database pool not initialized');
    }
    const connection = await pool.getConnection();
    // Set schema to GALAXY_FIT_SYNC for all queries
    await connection.execute('ALTER SESSION SET CURRENT_SCHEMA = GALAXY_FIT_SYNC');
    return connection;
}
async function closePool() {
    if (pool) {
        await pool.close(0);
        pool = null;
        console.log('[DB] Connection pool closed');
    }
}
//# sourceMappingURL=database.js.map