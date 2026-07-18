const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Polling Admin.gstNumber in Neon database to detect new Render deployment...');
  const start = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - start < timeout) {
    try {
      const admin = await prisma.admin.findFirst();
      if (admin && admin.gstNumber && admin.gstNumber.includes('keys')) {
        console.log('\n--- DEPLOYMENT DETECTED! ---');
        console.log('Admin.gstNumber value:', admin.gstNumber);
        break;
      }
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error('\nError polling database:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await prisma.$disconnect();
}

main();
