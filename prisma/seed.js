const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crea un utente admin se non esiste
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.it' },
    update: {},
    create: {
      email: 'admin@admin.it',
      firstName: 'Admin',
      lastName: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log(`✓ Created admin user: ${adminUser.email}`);

  // Crea le categorie di default
  const categories = [
    {
      value: 'fisioterapia',
      label: 'Fisioterapia',
      color: '#3b82f6',
    },
    {
      value: 'osteopatia',
      label: 'Osteopatia',
      color: '#10b981',
    },
    {
      value: 'riabilitazione',
      label: 'Riabilitazione',
      color: '#f59e0b',
    },
    {
      value: 'ginnastica',
      label: 'Ginnastica Posturale',
      color: '#8b5cf6',
    },
    {
      value: 'pilates',
      label: 'Pilates',
      color: '#ec4899',
    },
    {
      value: 'massaggio',
      label: 'Massaggio',
      color: '#06b6d4',
    },
  ];

  console.log('Creating categories...');
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { value: categoryData.value },
      update: categoryData,
      create: categoryData,
    });
    console.log(`✓ Created category: ${category.label}`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
