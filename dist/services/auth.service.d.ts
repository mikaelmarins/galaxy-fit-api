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
export declare function requestPasswordReset(email: string): Promise<{
    success: boolean;
    pin: string;
}>;
export declare function resetPasswordWithPin(email: string, pin: string, newPassword: string): Promise<boolean>;
//# sourceMappingURL=auth.service.d.ts.map