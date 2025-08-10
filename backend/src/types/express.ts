import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
  headers: any;
  method: string;
  path: string;
  params: any;
  query: any;
  body: any;
  originalUrl: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}
