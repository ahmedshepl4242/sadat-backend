const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTenant() {
  try {
    console.log('Creating initial tenant...');
    
    // Hash a default password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create the sadat tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: 'sadat',
        tenantName: 'Sadat Delivery',
        email: 'admin@sadat.com',
        address: '123 Main Street, Cairo, Egypt',
        phoneNumber: '+201234567890',
        password: hashedPassword
      }
    });
    
    console.log('Tenant created:', tenant);
    
    // Create a default neighborhood
    const neighborhood = await prisma.neighborhood.create({
      data: {
        tenantId: 'sadat',
        name: 'Downtown'
      }
    });
    
    console.log('Neighborhood created:', neighborhood);
    
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTenant();