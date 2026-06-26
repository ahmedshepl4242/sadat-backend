const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    console.log('Checking tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants found:', tenants);
    
    console.log('\nChecking users...');
    const users = await prisma.user.findMany({
      take: 5
    });
    console.log('Users found:', users.length);
    
    console.log('\nChecking neighborhoods...');
    const neighborhoods = await prisma.neighborhood.findMany({
      take: 5
    });
    console.log('Neighborhoods found:', neighborhoods.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();