import { Request, Response, NextFunction } from 'express';
import { AuthPayload } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: AuthPayload;
}
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function generateToken(payload: AuthPayload): string;
export declare function verifyToken(token: string): AuthPayload;
//# sourceMappingURL=auth.d.ts.map