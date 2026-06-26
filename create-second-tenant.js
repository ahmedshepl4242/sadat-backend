const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSecondTenant() {
  try {
    console.log('Creating second tenant...');
    
    // Hash a default password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create the second tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: 'xyz-delivery',
        tenantName: 'XYZ Delivery',
        email: 'admin@xyz.com',
        address: '456 Second Street, Alexandria, Egypt',
        phoneNumber: '+201987654321',
        password: hashedPassword
      }
    });
    
    console.log('Second tenant created:', tenant);
    
    // Create a default neighborhood for the second tenant
    const neighborhood = await prisma.neighborhood.create({
      data: {
        tenantId: 'xyz-delivery',
        name: 'Uptown'
      }
    });
    
    console.log('Neighborhood created for second tenant:', neighborhood);
    
    console.log('Second tenant seeding completed successfully!');
    
  } catch (error) {
    console.error('Error creating second tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSecondTenant();