import rateLimit from 'express-rate-limit';

// General rate limiting - configurable via environment variables
export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    message: 'Troppe richieste da questo IP, riprova più tardi',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count failed requests
  skipFailedRequests: false,
  // Don't count successful requests to reduce load
  skipSuccessfulRequests: false,
});

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Troppi tentativi di autenticazione, riprova tra 15 minuti',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Very strict rate limiting for OTP requests
export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 OTP requests per minute
  message: {
    success: false,
    message: 'Troppi codici richiesti, attendi un minuto prima di riprovare',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for booking endpoints
export const bookingRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 booking requests per 10 minutes
  message: {
    success: false,
    message: 'Troppe richieste di prenotazione, riprova più tardi',
    retryAfter: 600
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Troppi tentativi di reset password, riprova tra un\'ora',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
});