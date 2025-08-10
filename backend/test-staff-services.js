const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStaffServices() {
  console.log('=== TEST STAFF SERVICES ===');
  
  // Trova l'utente admin
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@admin.it' }
  });
  console.log('Admin user:', adminUser);
  
  // Verifica se ha un profilo staff
  if (adminUser) {
    const staffProfile = await prisma.staff.findUnique({
      where: { userId: adminUser.id }
    });
    console.log('Staff profile for admin:', staffProfile);
    
    if (staffProfile) {
      // Verifica se ci sono servizi assegnati a questo staff
      const staffServices = await prisma.serviceStaff.findMany({
        where: { staffId: staffProfile.id },
        include: {
          service: {
            include: {
              category: true
            }
          }
        }
      });
      console.log('Services assigned to staff:', staffServices);
    }
  }
  
  // Anche senza filtro staff, verifica tutti i servizi
  console.log('\n--- TUTTI I SERVIZI (senza filtro staff) ---');
  const allServices = await prisma.service.findMany({
    orderBy: [
      { isActive: 'desc' },
      { name: 'asc' }
    ],
    include: {
      category: true,
      _count: {
        select: {
          bookings: true,
          staff: true
        }
      }
    }
  });
  
  console.log('All services found:', allServices.length);
  allServices.forEach(service => {
    console.log(`- ${service.name} (${service.id})`);
    console.log(`  Category: ${service.category?.label || 'N/A'} (${service.categoryId})`);
    console.log(`  Active: ${service.isActive}`);
    console.log(`  Staff count: ${service._count.staff}`);
  });
}

testStaffServices()
  .catch((e) => {
    console.error('Errore:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
