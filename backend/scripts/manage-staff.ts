#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

async function listStaff() {
  console.log('📋 Lista Staff:');
  const staff = await prisma.staff.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true
        }
      },
      _count: {
        select: {
          bookings: true,
          services: true
        }
      }
    },
    orderBy: {
      firstName: 'asc'
    }
  });

  if (staff.length === 0) {
    console.log('   Nessun membro dello staff trovato.');
    return;
  }

  staff.forEach((member, index) => {
    console.log(`
${index + 1}. ${member.firstName} ${member.lastName}
   📧 Email: ${member.email}
   🏥 Specializzazione: ${member.specialization}
   📞 Telefono: ${member.phone || 'Non specificato'}
   👤 User ID: ${member.userId}
   🆔 Staff ID: ${member.id}
   📊 Prenotazioni: ${member._count.bookings}
   🔹 Servizi: ${member._count.services}
   ⚡ Stato: ${member.isActive ? 'Attivo' : 'Inattivo'}
   ✅ Verificato: ${member.user?.isVerified ? 'Sì' : 'No'}
    `);
  });
}

async function deactivateStaff(email: string) {
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { user: true }
  });

  if (!staff) {
    console.error('❌ Staff non trovato con email:', email);
    return;
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: { isActive: false }
  });

  console.log(`✅ Staff ${staff.firstName} ${staff.lastName} disattivato`);
}

async function activateStaff(email: string) {
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { user: true }
  });

  if (!staff) {
    console.error('❌ Staff non trovato con email:', email);
    return;
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: { isActive: true }
  });

  console.log(`✅ Staff ${staff.firstName} ${staff.lastName} attivato`);
}

async function resetPassword(email: string, newPassword: string) {
  if (newPassword.length < 6) {
    console.error('❌ La password deve essere di almeno 6 caratteri');
    return;
  }

  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { user: true }
  });

  if (!staff) {
    console.error('❌ Staff non trovato con email:', email);
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: staff.userId! }, // Non può essere null per via dello schema aggiornato
    data: { password: hashedPassword }
  });

  console.log(`✅ Password aggiornata per ${staff.firstName} ${staff.lastName}`);
}

async function deleteStaff(email: string, confirm: boolean = false) {
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { 
      user: true,
      _count: {
        select: {
          bookings: true
        }
      }
    }
  });

  if (!staff) {
    console.error('❌ Staff non trovato con email:', email);
    return;
  }

  if (staff._count.bookings > 0 && !confirm) {
    console.error(`❌ Lo staff ha ${staff._count.bookings} prenotazioni. Usa --force per eliminare comunque.`);
    return;
  }

  // L'eliminazione dello staff eliminerà automaticamente l'utente (CASCADE)
  await prisma.staff.delete({
    where: { id: staff.id }
  });

  console.log(`✅ Staff ${staff.firstName} ${staff.lastName} e account utente eliminati`);
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      await listStaff();
      break;
      
    case 'create':
      console.log('Per creare un nuovo staff usa: npx tsx scripts/create-staff.ts');
      break;
      
    case 'deactivate':
      const emailDeactivate = process.argv[3];
      if (!emailDeactivate) {
        console.error('❌ Specifica email: npx tsx scripts/manage-staff.ts deactivate email@esempio.com');
        break;
      }
      await deactivateStaff(emailDeactivate);
      break;
      
    case 'activate':
      const emailActivate = process.argv[3];
      if (!emailActivate) {
        console.error('❌ Specifica email: npx tsx scripts/manage-staff.ts activate email@esempio.com');
        break;
      }
      await activateStaff(emailActivate);
      break;
      
    case 'reset-password':
      const emailReset = process.argv[3];
      const newPassword = process.argv[4];
      if (!emailReset || !newPassword) {
        console.error('❌ Specifica email e password: npx tsx scripts/manage-staff.ts reset-password email@esempio.com nuovapassword');
        break;
      }
      await resetPassword(emailReset, newPassword);
      break;
      
    case 'delete':
      const emailDelete = process.argv[3];
      const forceDelete = process.argv[4] === '--force';
      if (!emailDelete) {
        console.error('❌ Specifica email: npx tsx scripts/manage-staff.ts delete email@esempio.com [--force]');
        break;
      }
      await deleteStaff(emailDelete, forceDelete);
      break;
      
    default:
      console.log(`
🩺 Gestione Staff Kinetica

Comandi disponibili:

📋 Visualizzazione:
   npx tsx scripts/manage-staff.ts list

👤 Creazione:
   npx tsx scripts/create-staff.ts <firstName> <lastName> <email> <password> <specialization> [phone] [years] [bio]

⚡ Gestione stato:
   npx tsx scripts/manage-staff.ts activate <email>
   npx tsx scripts/manage-staff.ts deactivate <email>

🔑 Password:
   npx tsx scripts/manage-staff.ts reset-password <email> <nuova-password>

🗑️ Eliminazione:
   npx tsx scripts/manage-staff.ts delete <email> [--force]

Esempi:
   npx tsx scripts/create-staff.ts "Mario" "Rossi" "mario@kinetica.it" "pass123" "Fisioterapia" "+39123456789" "5"
   npx tsx scripts/manage-staff.ts list
   npx tsx scripts/manage-staff.ts reset-password mario@kinetica.it nuovapassword123
   npx tsx scripts/manage-staff.ts deactivate mario@kinetica.it
      `);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
