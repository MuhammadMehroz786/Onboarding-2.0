import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  // Read from ENV with fallback defaults
  const email = process.env.ADMIN_EMAIL || 'admin@agency.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if admin exists
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    // Update existing admin
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: 'admin'
      }
    });
    console.log('✅ Admin user updated successfully');
  } else {
    // Create new admin
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin'
      }
    });
    console.log('✅ Admin user created successfully');
  }

  console.log('');
  console.log('Login credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  console.log('💡 Tip: Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file to customize these credentials.');

  await prisma.$disconnect();
}

createAdmin().catch(console.error);
