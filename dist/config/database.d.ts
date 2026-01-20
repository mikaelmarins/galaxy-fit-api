import oracledb from 'oracledb';
export declare function initializePool(): Promise<void>;
export declare function getConnection(): Promise<oracledb.Connection>;
export declare function closePool(): Promise<void>;
export { oracledb };
//# sourceMappingURL=database.d.ts.map