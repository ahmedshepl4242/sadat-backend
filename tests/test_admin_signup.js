const axios = require('axios');

async function testAdminSignup() {
  try {
    const tenantId = 'test_tenant_' + Date.now();
    console.log('Testing admin signup with tenant:', tenantId);

    const response = await axios.post('http://localhost:3000/api/admin-signup/signup', {
      userName: 'TestAdmin123',
      email: 'test' + Date.now() + '@test.com',
      phoneNumber: '+1234567' + Math.floor(Math.random() * 1000),
      password: 'Test123!',
      address: 'Test Address',
      tenantId: tenantId,
      neighborhood_name: 'Test Neighborhood',
      fcmToken: 'test_token'
    }, {
      headers: { 'x-tenant-id': tenantId }
    });

    console.log('SUCCESS!');
    console.log('Response structure:', Object.keys(response.data.data));
    console.log('Has neighborhood:', response.data.data.neighborhood !== undefined);
    console.log('Has systemVendor:', response.data.data.systemVendor !== undefined);

    if (response.data.data.systemVendor) {
      console.log('System vendor ID:', response.data.data.systemVendor.id);
    }

  } catch (error) {
    console.log('ERROR:', error.response?.data?.error || error.message);
    if (error.response?.data?.details) {
      console.log('Details:', error.response.data.details);
    }
  }
}

testAdminSignup();