const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBookings() {
  try {
    console.log('🌱 Iniziando seeding delle prenotazioni...');

    // Verifica che esistano utenti
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ Nessun utente trovato. Crea prima degli utenti.');
      return;
    }

    // Verifica che esistano servizi
    const services = await prisma.service.findMany();
    if (services.length === 0) {
      console.log('❌ Nessun servizio trovato. Crea prima dei servizi.');
      return;
    }

    // Verifica che esista staff
    const staff = await prisma.staff.findMany();
    if (staff.length === 0) {
      console.log('❌ Nessuno staff trovato. Crea prima dello staff.');
      return;
    }

    // Crea prenotazioni di esempio
    const bookingsData = [
      {
        userId: users[0].id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date('2025-08-15'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'CONFIRMED',
        notes: 'Prima sessione di fisioterapia per il recupero'
      },
      {
        userId: users[0].id,
        serviceId: services[1]?.id || services[0].id,
        staffId: staff[1]?.id || staff[0].id,
        date: new Date('2025-08-20'),
        startTime: '14:30',
        endTime: '15:30',
        status: 'PENDING',
        notes: 'Controllo generale posturale'
      },
      {
        userId: users[0].id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date('2025-07-30'),
        startTime: '16:00',
        endTime: '17:00',
        status: 'COMPLETED',
        notes: 'Sessione completata con successo'
      },
      {
        userId: users[0].id,
        serviceId: services[2]?.id || services[0].id,
        staffId: staff[2]?.id || staff[0].id,
        date: new Date('2025-08-25'),
        startTime: '09:00',
        endTime: '10:00',
        status: 'CONFIRMED',
        notes: 'Riabilitazione post-infortunio'
      }
    ];

    // Elimina prenotazioni esistenti per evitare duplicati
    await prisma.booking.deleteMany({
      where: {
        userId: users[0].id
      }
    });

    // Inserisci le nuove prenotazioni
    for (const bookingData of bookingsData) {
      await prisma.booking.create({
        data: bookingData
      });
    }

    console.log(`✅ Creato ${bookingsData.length} prenotazioni di esempio`);
    
    // Mostra le prenotazioni create
    const createdBookings = await prisma.booking.findMany({
      where: { userId: users[0].id },
      include: {
        service: true,
        staff: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('\n📋 Prenotazioni create:');
    createdBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.service.name} - ${booking.date.toDateString()} ${booking.startTime} (${booking.status})`);
    });

  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBookings();
