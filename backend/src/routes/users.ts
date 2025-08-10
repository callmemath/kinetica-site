import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Nome troppo corto'),
  lastName: z.string().min(2, 'Cognome troppo corto'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: z.string().min(8, 'La nuova password deve essere di almeno 8 caratteri'),
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del profilo'
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate the request data
    const validatedData = updateProfileSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        postalCode: validatedData.postalCode || null,
        emergencyContact: validatedData.emergencyContact || null,
        medicalNotes: validatedData.medicalNotes || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        dateOfBirth: true,
        address: true,
        city: true,
        postalCode: true,
        emergencyContact: true,
        medicalNotes: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: updatedUser
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del profilo'
    });
  }
});

// PUT /api/users/change-password - Change user password
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate the request data
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password attuale non corretta'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword
      }
    });
    
    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }
    
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il cambio password'
    });
  }
});

export default router;
