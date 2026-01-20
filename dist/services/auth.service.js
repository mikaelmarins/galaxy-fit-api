"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getUserById = getUserById;
exports.updatePassword = updatePassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const constants_1 = require("../config/constants");
const auth_1 = require("../middleware/auth");
const SALT_ROUNDS = 10;
async function signup(email, password, name) {
    const connection = await (0, database_1.getConnection)();
    try {
        // Check if user already exists
        const existingUser = await connection.execute(`SELECT ID FROM ${constants_1.TABLES.USERS} WHERE EMAIL = :email`, { email: email.toLowerCase() }, { outFormat: database_1.oracledb.OUT_FORMAT_OBJECT });
        if (existingUser.rows && existingUser.rows.length > 0) {
            throw new Error('Email already registered');
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const userId = (0, uuid_1.v4)();
        // Insert user
        await connection.execute(`INSERT INTO ${constants_1.TABLES.USERS} (ID, EMAIL, PASSWORD_HASH, NAME) 
       VALUES (:id, :email, :password_hash, :name)`, {
            id: userId,
            email: email.toLowerCase(),
            password_hash: passwordHash,
            name: name || null,
        }, { autoCommit: true });
        // Generate token
        const token = (0, auth_1.generateToken)({ userId, email: email.toLowerCase() });
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
    }
    finally {
        await connection.close();
    }
}
async function login(email, password) {
    const connection = await (0, database_1.getConnection)();
    try {
        const result = await connection.execute(`SELECT ID, EMAIL, PASSWORD_HASH, NAME, CREATED_AT, UPDATED_AT, LAST_LOGIN 
       FROM ${constants_1.TABLES.USERS} WHERE EMAIL = :email`, { email: email.toLowerCase() }, { outFormat: database_1.oracledb.OUT_FORMAT_OBJECT });
        if (!result.rows || result.rows.length === 0) {
            throw new Error('Invalid email or password');
        }
        const user = result.rows[0];
        const isValidPassword = await bcrypt_1.default.compare(password, user.PASSWORD_HASH);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        // Update last login
        await connection.execute(`UPDATE ${constants_1.TABLES.USERS} SET LAST_LOGIN = SYSTIMESTAMP WHERE ID = :id`, { id: user.ID }, { autoCommit: true });
        // Generate token
        const token = (0, auth_1.generateToken)({ userId: user.ID, email: user.EMAIL });
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
    }
    finally {
        await connection.close();
    }
}
async function getUserById(userId) {
    const connection = await (0, database_1.getConnection)();
    try {
        const result = await connection.execute(`SELECT ID, EMAIL, NAME, CREATED_AT, UPDATED_AT, LAST_LOGIN 
       FROM ${constants_1.TABLES.USERS} WHERE ID = :id`, { id: userId }, { outFormat: database_1.oracledb.OUT_FORMAT_OBJECT });
        if (!result.rows || result.rows.length === 0) {
            return null;
        }
        const user = result.rows[0];
        return {
            id: user.ID,
            email: user.EMAIL,
            name: user.NAME,
            created_at: user.CREATED_AT?.toISOString() || '',
            updated_at: user.UPDATED_AT?.toISOString() || '',
            last_login: user.LAST_LOGIN?.toISOString() || null,
        };
    }
    finally {
        await connection.close();
    }
}
async function updatePassword(userId, newPassword) {
    const connection = await (0, database_1.getConnection)();
    try {
        const passwordHash = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await connection.execute(`UPDATE ${constants_1.TABLES.USERS} SET PASSWORD_HASH = :password_hash, UPDATED_AT = SYSTIMESTAMP WHERE ID = :id`, { password_hash: passwordHash, id: userId }, { autoCommit: true });
    }
    finally {
        await connection.close();
    }
}
//# sourceMappingURL=auth.service.js.map