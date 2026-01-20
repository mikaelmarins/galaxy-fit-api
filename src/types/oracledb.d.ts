declare module 'oracledb' {
    export interface PoolAttributes {
        user?: string;
        password?: string;
        connectString?: string;
        poolMin?: number;
        poolMax?: number;
        poolIncrement?: number;
    }

    export interface Connection {
        execute<T = any>(sql: string, binds?: any, options?: any): Promise<{ rows?: T[]; rowsAffected?: number }>;
        close(): Promise<void>;
    }

    export interface Pool {
        getConnection(): Promise<Connection>;
        close(drainTime?: number): Promise<void>;
    }

    export const OUT_FORMAT_OBJECT: number;
    export const CLOB: number;
    export const BLOB: number;

    export let fetchAsString: number[];
    export let fetchAsBuffer: number[];

    export function createPool(config: PoolAttributes): Promise<Pool>;
}
