const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateTestOTP() {
  // Trova l'utente admin
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@admin.it' }
  });
  
  if (!adminUser) {
    console.log('Admin user not found');
    return;
  }
  
  // Genera un OTP di test
  const otp = '123456'; // OTP fisso per test
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minuti da ora
  
  // Elimina eventuali OTP esistenti per LOGIN
  await prisma.otpCode.deleteMany({
    where: {
      userId: adminUser.id,
      type: 'LOGIN',
      used: false
    }
  });
  
  // Crea nuovo OTP
  await prisma.otpCode.create({
    data: {
      code: otp,
      type: 'LOGIN',
      userId: adminUser.id,
      expiresAt: expiry,
      used: false
    }
  });
  
  console.log('Generated test OTP:', otp);
  console.log('For user:', adminUser.email);
  console.log('Expires at:', expiry);
}

generateTestOTP()
  .catch((e) => {
    console.error('Errore:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
