const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Admin settings ---');
    const admin = await prisma.admin.findFirst();
    if (admin) {
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('First Name:', admin.firstName);
      console.log('Last Name:', admin.lastName);
      console.log('GST Number:', admin.gstNumber);
      console.log('Service Area:', admin.serviceArea);
    } else {
      console.log('No Admin found!');
    }
  } catch (err) {
    console.error('Error fetching admin:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
