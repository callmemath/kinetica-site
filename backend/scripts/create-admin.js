const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@kinetica.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists with email: admin@kinetica.com');
      return;
    }
    
    // Generate random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@kinetica.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Kinetica',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
        phone: '+39 010 123 4567'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@kinetica.com');
    console.log('🔐 Password:', password);
    console.log('');
    console.log('⚠️  IMPORTANT: Save these credentials in a secure location!');
    console.log('🔑 You can change the password after first login.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
