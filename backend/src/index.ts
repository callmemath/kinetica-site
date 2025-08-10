import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import servicesRoutes from './routes/services';
import categoriesRoutes from './routes/categories';
import bookingRoutes from './routes/bookings';
import staffRoutes from './routes/staff';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiting';
import { 
  securityHeaders, 
  contentSecurityPolicy, 
  sanitizeInput, 
  securityLogger 
} from './middleware/security';
import { reminderService } from './services/ReminderService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
});

// For Vercel, we need to handle the serverless environment
const isVercel = process.env.VERCEL === '1';

// Security: Trust proxy (needed for rate limiting and other middleware behind reverse proxy)
app.set('trust proxy', 1);

// Security: Remove X-Powered-By header
app.disable('x-powered-by');

// Security Middleware (order matters!)
app.use(securityHeaders);
app.use(contentSecurityPolicy);
app.use(securityLogger);

// Helmet for additional security headers
app.use(helmet({
  contentSecurityPolicy: false, // We handle this manually
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
  : [
      process.env.FRONTEND_URL || 'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: '1mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '1mb'
}));

// Input sanitization
app.use(sanitizeInput);

// Apply rate limiting
app.use(rateLimitMiddleware);

// Health check endpoint (minimal information in production)
app.get('/health', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { environment: process.env.NODE_ENV || 'development' })
  });
});

// Only enable development/test endpoints in non-production
if (process.env.NODE_ENV !== 'production') {
  // Email testing endpoint (development only)
  app.get('/api/test/email', async (req, res) => {
    try {
      const { EmailService } = await import('./services/EmailService');
      const emailService = new EmailService();
      
      const testBookingDetails = {
        id: 'test-booking-123',
        serviceName: 'Fisioterapia Test',
        date: new Date().toISOString(),
        time: '14:30',
        therapistName: 'Dr. Test',
        duration: 60,
        price: 80,
        notes: 'Test booking per verificare le email'
      };

      await emailService.sendBookingConfirmation(
        'test@example.com',
        'Test User',
        testBookingDetails
      );

      res.json({
        success: true,
        message: 'Email di test inviata con successo (check console logs in development mode)'
      });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email di test'
      });
    }
  });

  app.get('/api/test/reminder-stats', async (req, res) => {
    try {
      const { reminderService } = await import('./services/ReminderService');
      const stats = await reminderService.getReminderStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Reminder stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero delle statistiche reminder'
      });
    }
  });

  // Test endpoint per reports (development only)
  app.get('/api/test/reports', (req, res) => {
    console.log('=== TEST REPORTS ENDPOINT CALLED ===');
    
    const reportData = {
      totalRevenue: 15250,
      totalBookings: 89,
      completedBookings: 75,
      cancelledBookings: 8,
      averageBookingValue: 85.5,
      topServices: [
        { name: 'Fisioterapia', count: 35, revenue: 5250 },
        { name: 'Osteopatia', count: 25, revenue: 3750 },
        { name: 'Massoterapia', count: 20, revenue: 2400 }
      ],
      topStaff: [
        { name: 'Dr. Mario Rossi', bookings: 45, revenue: 6750 },
        { name: 'Dr.ssa Laura Bianchi', bookings: 30, revenue: 4500 },
        { name: 'Dr. Giuseppe Verdi', bookings: 25, revenue: 3750 }
      ],
      monthlyRevenue: [
        { month: 'Gennaio 2025', revenue: 12500, bookings: 65 },
        { month: 'Febbraio 2025', revenue: 13200, bookings: 72 },
        { month: 'Marzo 2025', revenue: 15250, bookings: 89 }
      ],
      dailyStats: [],
      paymentStats: {
        paid: 65,
        unpaid: 24,
        totalPaid: 12800,
        totalUnpaid: 2450
      }
    };

    console.log('Sending test report data');
    
    res.json({
      success: true,
      data: reportData
    });
  });
}

// API Routes with security logging
const logRouteAccess = (routeName: string) => (req: any, res: any, next: any) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.log(`📍 ${routeName} route accessed:`, req.method, req.url);
  }
  next();
};

app.use('/api/auth', logRouteAccess('Auth'), authRoutes);
app.use('/api/users', logRouteAccess('Users'), userRoutes);
app.use('/api/services', logRouteAccess('Services'), servicesRoutes);
app.use('/api/categories', logRouteAccess('Categories'), categoriesRoutes);
app.use('/api/staff', logRouteAccess('Staff'), staffRoutes);
app.use('/api/bookings', logRouteAccess('Bookings'), bookingRoutes);
app.use('/api/admin', logRouteAccess('Admin'), adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.warn(`🚫 404 - Route not found: ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use(errorHandler);

// Database connection check on startup
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('🗄️  Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop the reminder service
    reminderService.stopReminderService();
    console.log('✅ Reminder service stopped');
    
    // Disconnect from database
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

// Start server with proper initialization
async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start the reminder service only in production
    if (process.env.NODE_ENV === 'production') {
      reminderService.startReminderService();
      console.log('📧 Reminder service started');
    }
    
    // Start the HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`� Security: ${process.env.NODE_ENV === 'production' ? 'Production hardened' : 'Development mode'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🧪 Test endpoints available at:`);
        console.log(`   - GET /api/test/email`);
        console.log(`   - GET /api/test/reminder-stats`);
        console.log(`   - GET /api/test/reports`);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize the application
if (!isVercel) {
  startServer();
} else {
  // For Vercel, just initialize the database connection
  connectDatabase().catch(console.error);
}

export default app;
