import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Errore interno del server';

  // Prisma errors
  if (err.message.includes('Unique constraint')) {
    statusCode = 409;
    message = 'Risorsa già esistente';
  }

  if (err.message.includes('Record to update not found')) {
    statusCode = 404;
    message = 'Risorsa non trovata';
  }

  // JWT errors
  if (err.message.includes('jwt')) {
    statusCode = 401;
    message = 'Token non valido';
  }

  // Validation errors
  if (err.message.includes('validation')) {
    statusCode = 400;
    message = 'Dati non validi';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};