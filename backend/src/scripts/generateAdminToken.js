import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Dati dell'admin user
const adminUser = {
  userId: 'cme4edrrp0000otn2b7mmxak3',
  email: 'admin@kinetica.it',
  role: 'admin'
};

// Genera token
const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });

console.log('Admin Token:', token);
console.log('');
console.log('Per testare l\'endpoint, usa questo comando:');
console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:3001/api/admin/reports?startDate=2025-01-01&endDate=2025-08-09&type=monthly"`);
