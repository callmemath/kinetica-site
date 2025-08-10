#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

const staffSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
  phone: z.string().optional(),
  specialization: z.string().min(1, 'Specializzazione richiesta'),
  yearsOfExperience: z.number().min(0).optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

async function createStaff() {
  try {
    // Leggi i parametri dalla command line
    const args = process.argv.slice(2);
    if (args.length < 4) {
      console.log(`
Uso: npx tsx scripts/create-staff.ts <firstName> <lastName> <email> <password> <specialization> [phone] [yearsOfExperience] [bio]

Esempi:
npx tsx scripts/create-staff.ts "Mario" "Rossi" "mario.rossi@kinetica.it" "password123" "Fisioterapia" "+39 123 456 789" "5" "Specialista in riabilitazione sportiva"
npx tsx scripts/create-staff.ts "Sara" "Bianchi" "sara.bianchi@kinetica.it" "secure456" "Osteopatia"
      `);
      process.exit(1);
    }

    const [firstName, lastName, email, password, specialization, phone, yearsExp, bio] = args;

    const staffData = {
      firstName,
      lastName,
      email,
      password,
      specialization,
      phone: phone || undefined,
      yearsOfExperience: yearsExp ? parseInt(yearsExp) : undefined,
      bio: bio || undefined,
      isActive: true
    };

    // Valida i dati
    const validatedData = staffSchema.parse(staffData);
    
    console.log('🔍 Validazione dati completata...');

    // Verifica che l'email non sia già utilizzata
    const [existingStaff, existingUser] = await Promise.all([
      prisma.staff.findUnique({
        where: { email: validatedData.email }
      }),
      prisma.user.findUnique({
        where: { email: validatedData.email }
      })
    ]);

    if (existingStaff) {
      console.error('❌ Errore: Un membro dello staff con questa email esiste già');
      process.exit(1);
    }

    if (existingUser) {
      console.error('❌ Errore: Un utente con questa email esiste già');
      process.exit(1);
    }

    console.log('🔐 Generazione hash password...');
    // Hash della password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    console.log('👤 Creazione account utente...');
    // Crea prima l'account utente
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        password: hashedPassword,
        role: 'STAFF',
        isVerified: true
      }
    });

    console.log('🩺 Creazione profilo staff...');
    // Poi crea il profilo staff collegato
    const newStaff = await prisma.staff.create({
      data: {
        userId: newUser.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        specialization: validatedData.specialization,
        yearsOfExperience: validatedData.yearsOfExperience,
        bio: validatedData.bio,
        isActive: validatedData.isActive
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    console.log('✅ Staff creato con successo!');
    console.log(`
📋 Dettagli:
   Nome: ${newStaff.firstName} ${newStaff.lastName}
   Email: ${newStaff.email}
   Telefono: ${newStaff.phone || 'Non specificato'}
   Specializzazione: ${newStaff.specialization}
   Anni esperienza: ${newStaff.yearsOfExperience || 'Non specificato'}
   User ID: ${newStaff.userId}
   Staff ID: ${newStaff.id}
   
🔑 L'account può ora accedere con:
   Email: ${newStaff.email}
   Password: [quella che hai specificato]
   Ruolo: STAFF
    `);

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Errore validazione dati:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Errore durante la creazione dello staff:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createStaff();
