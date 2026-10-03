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

// In-memory PIN store for password recovery (ultra-fast for <= 10 users, 15 min TTL)
const resetPinStore = new Map<string, { pin: string; expires: number }>();

export async function requestPasswordReset(email: string): Promise<{ success: boolean; pin: string }> {
    const connection = await getConnection();
    const cleanEmail = email.toLowerCase().trim();

    try {
        const result = await connection.execute<any[]>(
            `SELECT ID, EMAIL FROM ${TABLES.USERS} WHERE EMAIL = :email`,
            { email: cleanEmail },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result.rows || result.rows.length === 0) {
            throw new Error('Email não encontrado no sistema');
        }

        // Generate 6-digit random PIN
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 15 * 60 * 1000; // 15 minutos

        resetPinStore.set(cleanEmail, { pin, expires });
        console.log(`[Auth] Password reset PIN generated for ${cleanEmail}: ${pin}`);

        return { success: true, pin };
    } finally {
        await connection.close();
    }
}

export async function resetPasswordWithPin(email: string, pin: string, newPassword: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const record = resetPinStore.get(cleanEmail);

    if (!record) {
        throw new Error('Nenhum código de recuperação solicitado para este email');
    }

    if (Date.now() > record.expires) {
        resetPinStore.delete(cleanEmail);
        throw new Error('Código de recuperação expirado. Solicite outro');
    }

    if (record.pin !== pin.trim()) {
        throw new Error('Código PIN incorreto');
    }

    const connection = await getConnection();
    try {
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await connection.execute(
            `UPDATE ${TABLES.USERS} SET PASSWORD_HASH = :password_hash, UPDATED_AT = SYSTIMESTAMP WHERE EMAIL = :email`,
            { password_hash: passwordHash, email: cleanEmail },
            { autoCommit: true }
        );

        resetPinStore.delete(cleanEmail);
        console.log(`[Auth] Password successfully reset for ${cleanEmail}`);
        return true;
    } finally {
        await connection.close();
    }
}
