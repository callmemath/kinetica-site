import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { EmailService } from '../services/EmailService';
import { generateOTP } from '../utils/helpers';
import { authRateLimit, otpRateLimit, passwordResetRateLimit } from '../middleware/rateLimiting';

const router = Router();
const emailService = new EmailService();

// Enhanced validation schemas with stronger requirements
const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'Il nome deve essere di almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri')
    .regex(/^[a-zA-ZÀ-ÿ\s'.-]+$/, 'Il nome contiene caratteri non validi'),
  lastName: z.string()
    .min(2, 'Il cognome deve essere di almeno 2 caratteri')
    .max(50, 'Il cognome non può superare i 50 caratteri')
    .regex(/^[a-zA-ZÀ-ÿ\s'.-]+$/, 'Il cognome contiene caratteri non validi'),
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email troppo lunga')
    .toLowerCase(),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]{10,20}$/.test(val), 'Numero di telefono non valido'),
  password: z.string()
    .min(8, 'La password deve essere di almeno 8 caratteri')
    .max(128, 'La password non può superare i 128 caratteri')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),
});

const loginSchema = z.object({
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email troppo lunga')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password richiesta')
    .max(128, 'Password troppo lunga'),
});

const verifyOtpSchema = z.object({
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email troppo lunga')
    .toLowerCase(),
  otp: z.string()
    .length(6, 'Il codice OTP deve essere di 6 cifre')
    .regex(/^\d{6}$/, 'Il codice OTP deve contenere solo numeri'),
  type: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']),
});

const requestOtpSchema = z.object({
  email: z.string().email('Email non valida'),
  type: z.enum(['LOGIN', 'PASSWORD_RESET']),
});

// POST /api/auth/register
// REGISTRATION ENDPOINT
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utente con questa email esiste già'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || '',
        password: hashedPassword,
        role: 'USER',
        isVerified: false,
      }
    });
    
    // Generate OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.otpCode.create({
      data: {
        code: otp,
        type: 'REGISTRATION',
        userId: user.id,
        expiresAt,
      }
    });
    
    // Send verification email
    await emailService.sendVerificationEmail(user.email, otp, user.firstName);
    
    res.status(201).json({
      success: true,
      message: 'Account creato con successo. Controlla la tua email per il codice di verifica.',
      data: {
        userId: user.id,
        email: user.email,
        requiresVerification: true
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione'
    });
  }
});

// POST /api/auth/verify-otp
// VERIFY OTP ENDPOINT
router.post('/verify-otp', otpRateLimit, async (req, res) => {
  try {
    const { email, otp, type } = verifyOtpSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code: otp,
        type,
        userId: user.id,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Codice OTP non valido o scaduto'
      });
    }
    
    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });
    
    // If registration verification, mark user as verified
    if (type === 'REGISTRATION') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Verifica completata con successo',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica'
    });
  }
});

// POST /api/auth/login
// LOGIN ENDPOINT
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    // Check password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    // Generate OTP for login verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.otpCode.create({
      data: {
        code: otp,
        type: 'LOGIN',
        userId: user.id,
        expiresAt,
      }
    });
    
    // Send login OTP email
    await emailService.sendLoginOTP(user.email, otp, user.firstName);
    
    res.json({
      success: true,
      message: 'Credenziali valide. Controlla la tua email per il codice di verifica.',
      data: {
        email: user.email,
        requiresOtp: true
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il login'
    });
  }
});

// POST /api/auth/request-otp
// REQUEST OTP ENDPOINT
router.post('/request-otp', otpRateLimit, async (req, res) => {
  try {
    const { email, type } = requestOtpSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.otpCode.create({
      data: {
        code: otp,
        type,
        userId: user.id,
        expiresAt,
      }
    });
    
    // Send OTP email based on type
    if (type === 'LOGIN') {
      await emailService.sendLoginOTP(user.email, otp, user.firstName);
    } else if (type === 'PASSWORD_RESET') {
      await emailService.sendPasswordResetOTP(user.email, otp, user.firstName);
    }
    
    res.json({
      success: true,
      message: 'Nuovo codice di verifica inviato alla tua email'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'invio del codice'
    });
  }
});

// POST /api/auth/forgot-password
// FORGOT PASSWORD ENDPOINT
router.post('/forgot-password', passwordResetRateLimit, async (req, res) => {
  try {
    const { email } = z.object({
      email: z.string().email('Email non valida')
    }).parse(req.body);

    // Find user - we want to check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Non esiste un account registrato con questa email'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing password reset OTP
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET'
      }
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        code: otp,
        type: 'PASSWORD_RESET',
        userId: user.id,
        expiresAt,
      }
    });

    // Send password reset email
    await emailService.sendPasswordResetOTP(user.email, otp, user.firstName);

    res.json({
      success: true,
      message: 'Codice di reset inviato alla tua email',
      data: {
        email: user.email,
        requiresOtp: true
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Email non valida',
        errors: error.errors
      });
    }

    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la richiesta di reset'
    });
  }
});

// POST /api/auth/reset-password
// RESET PASSWORD ENDPOINT
router.post('/reset-password', passwordResetRateLimit, async (req, res) => {
  try {
    const { email, otp, newPassword } = z.object({
      email: z.string().email('Email non valida'),
      otp: z.string().min(6, 'OTP non valido'),
      newPassword: z.string().min(6, 'La password deve essere di almeno 6 caratteri')
    }).parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Find and verify OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code: otp,
        type: 'PASSWORD_RESET',
        userId: user.id,
        expiresAt: {
          gte: new Date()
        }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Codice non valido o scaduto'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Delete used OTP
    await prisma.otpCode.delete({
      where: { id: otpRecord.id }
    });

    res.json({
      success: true,
      message: 'Password reimpostata con successo'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il reset della password'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // Optionally, you could implement a token blacklist here
  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
});

export default router;
