import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getConnection, oracledb } from '../config/database';
import { TABLES } from '../config/constants';
import { generateToken } from '../middleware/auth';
import { User } from '../types';

const SALT_ROUNDS = 10;

export async function signup(
    email: string,
    password: string,
    name?: string
): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const connection = await getConnection();

    try {
        // Check if user already exists
        const existingUser = await connection.execute<any[]>(
            `SELECT ID FROM ${TABLES.USERS} WHERE EMAIL = :email`,
            { email: email.toLowerCase() },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (existingUser.rows && existingUser.rows.length > 0) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const userId = uuidv4();

        // Insert user
        await connection.execute(
            `INSERT INTO ${TABLES.USERS} (ID, EMAIL, PASSWORD_HASH, NAME) 
       VALUES (:id, :email, :password_hash, :name)`,
            {
                id: userId,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                name: name || null,
            },
            { autoCommit: true }
        );

        // Generate token
        const token = generateToken({ userId, email: email.toLowerCase() });

        return {
            user: {
                id: userId,
                email: email.toLowerCase(),
                name: name || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login: null,
            },
            token,
        };
    } finally {
        await connection.close();
    }
}

export async function login(
    email: string,
    password: string
): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const connection = await getConnection();

    try {
        const result = await connection.execute<any[]>(
            `SELECT ID, EMAIL, PASSWORD_HASH, NAME, CREATED_AT, UPDATED_AT, LAST_LOGIN 
       FROM ${TABLES.USERS} WHERE EMAIL = :email`,
            { email: email.toLowerCase() },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result.rows || result.rows.length === 0) {
            throw new Error('Invalid email or password');
        }

        const user = result.rows[0] as any;
        const isValidPassword = await bcrypt.compare(password, user.PASSWORD_HASH);

        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        await connection.execute(
            `UPDATE ${TABLES.USERS} SET LAST_LOGIN = SYSTIMESTAMP WHERE ID = :id`,
            { id: user.ID },
            { autoCommit: true }
        );

        // Generate token
        const token = generateToken({ userId: user.ID, email: user.EMAIL });

        return {
            user: {
                id: user.ID,
                email: user.EMAIL,
                name: user.NAME,
                created_at: user.CREATED_AT?.toISOString() || new Date().toISOString(),
                updated_at: user.UPDATED_AT?.toISOString() || new Date().toISOString(),
                last_login: new Date().toISOString(),
            },
            token,
        };
    } finally {
        await connection.close();
    }
}

export async function getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const connection = await getConnection();

    try {
        const result = await connection.execute<any[]>(
            `SELECT ID, EMAIL, NAME, CREATED_AT, UPDATED_AT, LAST_LOGIN 
       FROM ${TABLES.USERS} WHERE ID = :id`,
            { id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result.rows || result.rows.length === 0) {
            return null;
        }

        const user = result.rows[0] as any;
        return {
            id: user.ID,
            email: user.EMAIL,
            name: user.NAME,
            created_at: user.CREATED_AT?.toISOString() || '',
            updated_at: user.UPDATED_AT?.toISOString() || '',
            last_login: user.LAST_LOGIN?.toISOString() || null,
        };
    } finally {
        await connection.close();
    }
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
    const connection = await getConnection();

    try {
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await connection.execute(
            `UPDATE ${TABLES.USERS} SET PASSWORD_HASH = :password_hash, UPDATED_AT = SYSTIMESTAMP WHERE ID = :id`,
            { password_hash: passwordHash, id: userId },
            { autoCommit: true }
        );
    } finally {
        await connection.close();
    }
}
