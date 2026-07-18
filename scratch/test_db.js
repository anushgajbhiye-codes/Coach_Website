const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Testimonial table...');
    const testimonials = await prisma.testimonial.findMany();
    console.log('Testimonials found:', testimonials);
  } catch (err) {
    console.error('Error fetching testimonials:', err.message);
  }

  try {
    console.log('Testing Transformation table...');
    const transformations = await prisma.transformation.findMany();
    console.log('Transformations found:', transformations.length);
    if (transformations.length > 0) {
      console.log('Sample transformation keys:', Object.keys(transformations[0]));
    }
  } catch (err) {
    console.error('Error fetching transformations:', err.message);
  }

  await prisma.$disconnect();
}

main();
