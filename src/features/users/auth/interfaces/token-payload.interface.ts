import { Permission } from "./permission.interface";

export interface TokenPayload {
    userId: string;
    userAgent?: string;
    ip?: string;
    tokenType: number; 
    iat?: number;
    exp?: number;
    permissions: Permission[]
  }