const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBookings() {
  try {
    console.log('🧪 Creando prenotazioni di test...');

    // Verifica che esistano utenti
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ Nessun utente trovato.');
      return;
    }

    // Verifica che esistano servizi
    const services = await prisma.service.findMany();
    if (services.length === 0) {
      console.log('❌ Nessun servizio trovato.');
      return;
    }

    // Verifica che esista staff
    const staff = await prisma.staff.findMany();
    if (staff.length === 0) {
      console.log('❌ Nessuno staff trovato.');
      return;
    }

    const now = new Date();
    
    // Crea prenotazioni con date future per testare
    const testBookings = [
      {
        userId: users[0].id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date(now.getTime() + (72 * 60 * 60 * 1000)), // +72 ore (3 giorni)
        startTime: '10:00',
        endTime: '11:00',
        status: 'CONFIRMED',
        notes: 'Test: Dovrebbe essere modificabile (72 ore nel futuro)'
      },
      {
        userId: users[0].id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date(now.getTime() + (24 * 60 * 60 * 1000)), // +24 ore (1 giorno)
        startTime: '14:30',
        endTime: '15:30',
        status: 'CONFIRMED',
        notes: 'Test: NON dovrebbe essere modificabile (24 ore nel futuro)'
      },
      {
        userId: users[0].id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date(now.getTime() + (120 * 60 * 60 * 1000)), // +120 ore (5 giorni)
        startTime: '16:00',
        endTime: '17:00',
        status: 'PENDING',
        notes: 'Test: Dovrebbe essere modificabile (120 ore nel futuro)'
      }
    ];

    // Elimina prenotazioni esistenti per l'utente
    await prisma.booking.deleteMany({
      where: {
        userId: users[0].id
      }
    });

    // Inserisci le nuove prenotazioni di test
    for (const bookingData of testBookings) {
      await prisma.booking.create({
        data: bookingData
      });
    }

    console.log(`✅ Creato ${testBookings.length} prenotazioni di test`);
    
    // Mostra le prenotazioni create con calcolo ore
    const createdBookings = await prisma.booking.findMany({
      where: { userId: users[0].id },
      include: {
        service: true,
        staff: true
      },
      orderBy: { date: 'asc' }
    });

    console.log('\n📋 Prenotazioni di test create:');
    createdBookings.forEach((booking, index) => {
      const bookingDateTime = new Date(booking.date + 'T' + booking.startTime);
      const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      console.log(`${index + 1}. ${booking.service.name}`);
      console.log(`   Data: ${booking.date.toISOString()}`);
      console.log(`   Orario: ${booking.startTime}`);
      console.log(`   Stato: ${booking.status}`);
      console.log(`   Ore di differenza: ${hoursDiff.toFixed(1)}`);
      console.log(`   Modificabile: ${hoursDiff > 48 ? 'SÌ' : 'NO'}`);
      console.log(`   Note: ${booking.notes}`);
      console.log('');
    });

    console.log(`\n🕒 Data/ora corrente: ${now.toISOString()}`);

  } catch (error) {
    console.error('❌ Errore durante la creazione dei test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBookings();
