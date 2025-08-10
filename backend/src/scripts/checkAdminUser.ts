import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAndCreateAdminUser() {
  try {
    // Verifica se esiste un admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (adminUser) {
      console.log('Admin user trovato:', {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      });
    } else {
      console.log('Nessun admin trovato, creando admin di default...');
      
      // Crea un admin di default
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@kinetica.it',
          firstName: 'Admin',
          lastName: 'Kinetica',
          password: hashedPassword,
          role: 'admin',
          isVerified: true
        }
      });

      console.log('Admin creato:', {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: newAdmin.role
      });
    }

    // Mostra tutti gli utenti
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true
      }
    });

    console.log('\nTutti gli utenti nel database:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role} - Verified: ${user.isVerified}`);
    });

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdminUser();
