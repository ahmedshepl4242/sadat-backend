const adminService = require('./src/services/adminService');

async function testAdminSignup() {
  try {
    const testData = {
      userName: `TestAdmin_${Date.now()}`,
      email: `testadmin_${Date.now()}@test.com`,
      phoneNumber: `+1666789${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestAdmin123!',
      address: '789 Admin Plaza',
      tenantId: `tenant_${Date.now()}`,
      fcmToken: 'test_admin_fcm_token',
      neighborhood_name: 'Test Neighborhood'
    };

    console.log('Testing admin signup with data:', testData);

    const result = await adminService.signup(testData);
    console.log('Admin service result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminSignup();