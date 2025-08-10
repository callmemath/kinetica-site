import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Enhanced JWT Authentication Middleware with security improvements
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token di accesso richiesto'
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Errore di configurazione del server'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check token expiration more strictly
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      res.status(401).json({
        success: false,
        message: 'Token scaduto'
      });
      return;
    }

    // Validate required token fields
    if (!decoded.userId || !decoded.email) {
      res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
      return;
    }

    // Add session timeout check (configurable)
    const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30');
    const sessionStart = decoded.iat || 0;
    const sessionExpiry = sessionStart + (sessionTimeoutMinutes * 60);
    
    if (now > sessionExpiry) {
      res.status(401).json({
        success: false,
        message: 'Sessione scaduta. Effettua nuovamente il login.'
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'PATIENT'
    };

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token scaduto'
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore di autenticazione'
    });
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta'
      });
      return;
    }

    // Normalize roles for comparison (case-insensitive)
    const normalizedUserRole = req.user.role.toLowerCase();
    const normalizedRequiredRoles = roles.map(role => role.toLowerCase());

    if (!normalizedRequiredRoles.includes(normalizedUserRole)) {
      console.warn(`🚫 Access denied for role ${req.user.role} to ${req.method} ${req.path}`);
      res.status(403).json({
        success: false,
        message: 'Permessi insufficienti'
      });
      return;
    }

    next();
  };
};

// Middleware per operazioni che richiedono solo ruolo ADMIN
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
    return;
  }

  if (req.user.role.toLowerCase() !== 'admin') {
    console.warn(`🚫 Admin access denied for role ${req.user.role} to ${req.method} ${req.path}`);
    res.status(403).json({
      success: false,
      message: 'Accesso riservato agli amministratori'
    });
    return;
  }

  next();
};

// Middleware per operazioni di sola lettura (admin + staff)
export const requireReadAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
    return;
  }

  const userRole = req.user.role.toLowerCase();
  
  if (!['admin', 'staff'].includes(userRole)) {
    console.warn(`🚫 Read access denied for role ${req.user.role} to ${req.method} ${req.path}`);
    res.status(403).json({
      success: false,
      message: 'Permessi di lettura insufficienti'
    });
    return;
  }

  next();
};

// Middleware per operazioni di modifica prenotazioni (admin o staff assegnato)
export const requireBookingModifyAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
    return;
  }

  const userRole = req.user.role.toLowerCase();
  
  // Gli admin possono sempre modificare
  if (userRole === 'admin') {
    next();
    return;
  }

  // Per lo staff, verifica se è il terapista assegnato alla prenotazione
  if (userRole === 'staff') {
    try {
      const bookingId = req.params.id;
      if (!bookingId) {
        res.status(400).json({
          success: false,
          message: 'ID prenotazione mancante'
        });
        return;
      }

      // Prima trova il profilo staff dell'utente corrente
      const currentUserStaffProfile = await prisma.staff.findUnique({
        where: { userId: req.user.userId },
        select: { id: true }
      });

      if (!currentUserStaffProfile) {
        res.status(403).json({
          success: false,
          message: 'Profilo staff non trovato per questo utente'
        });
        return;
      }

      // Poi trova la prenotazione e verifica lo staff assegnato
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { staffId: true }
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Prenotazione non trovata'
        });
        return;
      }

      // Verifica se lo staff è il terapista assegnato
      if (booking.staffId === currentUserStaffProfile.id) {
        next();
        return;
      }

      // Se lo staff non è il terapista assegnato, nega l'accesso
      console.warn(`🚫 Staff ${req.user.userId} denied access to booking ${bookingId} - not assigned therapist`);
      res.status(403).json({
        success: false,
        message: 'Puoi modificare solo le prenotazioni di cui sei il terapista assegnato'
      });
      return;
      
    } catch (error) {
      console.error('❌ Errore nella verifica dei permessi di modifica prenotazione:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno del server'
      });
      return;
    }
  }

  // Se non è né admin né staff, nega l'accesso
  console.warn(`🚫 Booking modify access denied for role ${req.user.role} to ${req.method} ${req.path}`);
  res.status(403).json({
    success: false,
    message: 'Solo gli amministratori e il personale assegnato possono modificare le prenotazioni'
  });
};

/**
 * Self-access authorization (users can only access their own data)
 */
export const requireSelfOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
    return;
  }

  const targetUserId = req.params.id || req.params.userId;
  const isAdmin = req.user.role.toLowerCase() === 'admin';
  const isSelf = req.user.userId === targetUserId;

  if (!isAdmin && !isSelf) {
    console.warn(`🚫 User ${req.user.userId} attempted to access data for user ${targetUserId}`);
    res.status(403).json({
      success: false,
      message: 'Puoi accedere solo ai tuoi dati'
    });
    return;
  }

  next();
};
