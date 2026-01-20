import { User } from '../types';
export declare function signup(email: string, password: string, name?: string): Promise<{
    user: Omit<User, 'password_hash'>;
    token: string;
}>;
export declare function login(email: string, password: string): Promise<{
    user: Omit<User, 'password_hash'>;
    token: string;
}>;
export declare function getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null>;
export declare function updatePassword(userId: string, newPassword: string): Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map