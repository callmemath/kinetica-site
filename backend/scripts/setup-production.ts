#!/usr/bin/env node

/**
 * Production Setup Script for Kinetica Fisioterapia Backend
 * This script helps configure the application for production deployment
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SetupOptions {
  generateJwtSecret?: boolean;
  createAdminUser?: boolean;
  setupDatabase?: boolean;
  validateConfig?: boolean;
  securityCheck?: boolean;
}

class ProductionSetup {
  private requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'DATABASE_URL'
  ];

  private securityChecks = [
    { key: 'JWT_SECRET', test: (val: string) => val.length >= 32, message: 'JWT_SECRET should be at least 32 characters long' },
    { key: 'NODE_ENV', test: (val: string) => val === 'production', message: 'NODE_ENV should be set to "production"' },
    { key: 'FRONTEND_URL', test: (val: string) => val.startsWith('https://'), message: 'FRONTEND_URL should use HTTPS in production' },
    { key: 'JWT_SECRET', test: (val: string) => !val.includes('CHANGE_THIS'), message: 'JWT_SECRET contains default placeholder - must be changed!' },
    { key: 'SMTP_USER', test: (val: string) => !val.includes('your-email'), message: 'SMTP_USER contains placeholder - must be changed!' },
  ];

  async runSetup(options: SetupOptions = {}) {
    console.log('🚀 Starting Kinetica Fisioterapia Production Setup...\n');

    try {
      if (options.validateConfig !== false) {
        await this.validateConfiguration();
      }

      if (options.securityCheck !== false) {
        await this.performSecurityChecks();
      }

      if (options.generateJwtSecret) {
        await this.generateJwtSecret();
      }

      if (options.setupDatabase !== false) {
        await this.setupDatabase();
      }

      if (options.createAdminUser) {
        await this.createAdminUser();
      }

      console.log('\n✅ Production setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Update your environment variables in production');
      console.log('2. Deploy the application');
      console.log('3. Run database migrations: npm run db:migrate');
      console.log('4. Monitor logs and security alerts');

    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async validateConfiguration() {
    console.log('📋 Validating configuration...');

    const missing: string[] = [];
    const present: string[] = [];

    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      } else {
        present.push(envVar);
      }
    }

    console.log(`✅ Found ${present.length} required environment variables`);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      throw new Error('Missing required environment variables');
    }

    console.log('✅ All required environment variables are present\n');
  }

  private async performSecurityChecks() {
    console.log('🔒 Performing security checks...');

    const failures: string[] = [];

    for (const check of this.securityChecks) {
      const value = process.env[check.key];
      if (value && !check.test(value)) {
        failures.push(`${check.key}: ${check.message}`);
      }
    }

    if (failures.length > 0) {
      console.error('❌ Security check failures:');
      failures.forEach(failure => console.error(`   - ${failure}`));
      throw new Error('Security checks failed');
    }

    console.log('✅ All security checks passed\n');
  }

  private async generateJwtSecret() {
    console.log('🔑 Generating JWT secret...');
    
    const secret = crypto.randomBytes(64).toString('base64');
    console.log('Generated JWT secret (add this to your .env file):');
    console.log(`JWT_SECRET=${secret}\n`);
  }

  private async setupDatabase() {
    console.log('🗄️  Setting up database...');

    try {
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connection successful');

      // Check if studio_settings exists and has data
      const studioSettings = await prisma.studioSettings.findFirst();
      if (!studioSettings) {
        console.log('📝 Creating default studio settings...');
        await prisma.studioSettings.create({
          data: {
            studioName: 'Kinetica Fisioterapia Genova',
            studioDescription: 'Centro specializzato in fisioterapia, osteopatia e riabilitazione sportiva',
            address: 'Via Giovanni Tommaso Invrea 20/2',
            city: 'Genova',
            phone: '010 817 6855',
            email: 'amministrazione.kinetica@gmail.com',
            website: 'https://kineticafisioterapia.com',
            openingHours: JSON.stringify({
              monday: { open: '08:00', close: '19:00', isOpen: true },
              tuesday: { open: '08:00', close: '19:00', isOpen: true },
              wednesday: { open: '08:00', close: '19:00', isOpen: true },
              thursday: { open: '08:00', close: '19:00', isOpen: true },
              friday: { open: '08:00', close: '19:00', isOpen: true },
              saturday: { open: '08:00', close: '13:00', isOpen: true },
              sunday: { open: '00:00', close: '00:00', isOpen: false }
            }),
            bookingSettings: JSON.stringify({
              maxDaysInAdvance: 30,
              minHoursInAdvance: 24,
              allowCancellation: true,
              cancellationDeadlineHours: 24,
              defaultDuration: 60,
              slotInterval: 30
            }),
            notificationSettings: JSON.stringify({
              emailReminders: true,
              reminderHours: 24,
              adminNotifications: true,
              bookingConfirmations: true
            }),
            themeSettings: JSON.stringify({
              primaryColor: '#3da4db',
              secondaryColor: '#64748b',
              accentColor: '#f59e0b',
              fontFamily: 'Inter, sans-serif'
            }),
            socialMedia: JSON.stringify({
              facebook: '',
              instagram: '',
              linkedin: ''
            })
          }
        });
        console.log('✅ Studio settings created');
      } else {
        console.log('✅ Studio settings already exist');
      }

      // Check if services exist
      const servicesCount = await prisma.service.count();
      if (servicesCount === 0) {
        console.log('📝 Creating default services...');
        await this.createDefaultServices();
        console.log('✅ Default services created');
      } else {
        console.log(`✅ Found ${servicesCount} existing services`);
      }

    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }

    console.log('✅ Database setup completed\n');
  }

  private async createDefaultServices() {
    // First, create a default category
    const defaultCategory = await prisma.category.create({
      data: {
        value: 'servizi-generali',
        label: 'Servizi Generali',
        color: '#3da4db'
      }
    });

    const defaultServices = [
      { 
        name: 'Fisioterapia', 
        description: 'Trattamento fisioterapico personalizzato',
        duration: 60, 
        price: 80, 
        categoryId: defaultCategory.id,
        isActive: true 
      },
      { 
        name: 'Osteopatia', 
        description: 'Trattamento osteopatico per il benessere muscolo-scheletrico',
        duration: 60, 
        price: 90, 
        categoryId: defaultCategory.id,
        isActive: true 
      },
      { 
        name: 'Riabilitazione Sportiva', 
        description: 'Programmi di riabilitazione specifici per atleti',
        duration: 60, 
        price: 85, 
        categoryId: defaultCategory.id,
        isActive: true 
      },
      { 
        name: 'Ginnastica Posturale', 
        description: 'Esercizi mirati per correggere la postura',
        duration: 45, 
        price: 60, 
        categoryId: defaultCategory.id,
        isActive: true 
      },
      { 
        name: 'Pilates', 
        description: 'Lezioni di Pilates per il benessere fisico',
        duration: 45, 
        price: 60, 
        categoryId: defaultCategory.id,
        isActive: true 
      }
    ];

    for (const service of defaultServices) {
      await prisma.service.create({
        data: service
      });
    }
  }

  private async createAdminUser() {
    console.log('👤 Creating admin user...');

    const adminEmail = 'admin@kineticafisioterapia.com';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'Kinetica',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true
      }
    });

    console.log('✅ Admin user created');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Temporary password: ${tempPassword}`);
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!\n');
  }
}

// CLI interface
const args = process.argv.slice(2);
const options: SetupOptions = {};

if (args.includes('--generate-jwt')) options.generateJwtSecret = true;
if (args.includes('--create-admin')) options.createAdminUser = true;
if (args.includes('--skip-db')) options.setupDatabase = false;
if (args.includes('--skip-validation')) options.validateConfig = false;
if (args.includes('--skip-security')) options.securityCheck = false;

// Help message
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Kinetica Fisioterapia Production Setup

Usage: npm run setup:production [options]

Options:
  --generate-jwt     Generate a new JWT secret
  --create-admin     Create an admin user
  --skip-db         Skip database setup
  --skip-validation Skip configuration validation
  --skip-security   Skip security checks
  --help, -h        Show this help message

Examples:
  npm run setup:production
  npm run setup:production -- --generate-jwt --create-admin
  `);
  process.exit(0);
}

// Run setup
const setup = new ProductionSetup();
setup.runSetup(options);
