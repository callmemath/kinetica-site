const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== DEBUG DATABASE ===');
  
  // Verifica categorie
  console.log('\n--- CATEGORIE ---');
  const categories = await prisma.category.findMany();
  console.log('Categorie trovate:', categories.length);
  categories.forEach(cat => {
    console.log(`- ${cat.id}: ${cat.value} => ${cat.label} (active: ${cat.isActive})`);
  });
  
  // Verifica servizi con categorie
  console.log('\n--- SERVIZI ---');
  const services = await prisma.service.findMany({
    include: {
      category: true
    }
  });
  console.log('Servizi trovati:', services.length);
  services.forEach(service => {
    console.log(`- ${service.id}: ${service.name}`);
    console.log(`  categoryId: ${service.categoryId}`);
    console.log(`  category object:`, service.category);
  });
  
  // Verifica utenti admin/staff
  console.log('\n--- UTENTI ---');
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'STAFF']
      }
    }
  });
  console.log('Utenti admin/staff:', users.length);
  users.forEach(user => {
    console.log(`- ${user.id}: ${user.email} (${user.role})`);
  });
}

main()
  .catch((e) => {
    console.error('Errore:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
