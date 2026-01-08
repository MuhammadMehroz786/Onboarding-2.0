const { prisma } = require('./lib/prisma');
const { verifyPassword } = require('./lib/auth-utils');

async function testLogin() {
  const email = 'admin@agency.com';
  const password = 'Admin123!';

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      client: true,
    },
  });

  console.log('User found:', user ? 'YES' : 'NO');
  if (user) {
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Has client:', user.client ? 'YES' : 'NO');

    const isValid = await verifyPassword(password, user.passwordHash);
    console.log('Password valid:', isValid);
  }

  await prisma.$disconnect();
}

testLogin().catch(console.error);
