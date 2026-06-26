const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Testing basic connectivity...');

    // Test 1: Health check
    const health = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    console.log('✅ Health check passed:', health.data);

    // Test 2: Check if we can get neighborhoods (should be quick)
    try {
      const neighborhoods = await axios.get('http://localhost:3000/api/neighborhoods', {
        headers: { 'x-tenant-id': 'sadat' },
        timeout: 5000
      });
      console.log('✅ Neighborhoods endpoint accessible:', neighborhoods.data);
    } catch (err) {
      console.log('⚠️ Neighborhoods endpoint issue:', err.response?.status, err.response?.data?.error || err.message);
    }

    // Test 3: Try a simple user signup with minimal data
    try {
      console.log('Testing user signup...');
      const signup = await axios.post('http://localhost:3000/api/auth/signup/user', {
        userName: 'simpletest',
        email: 'simpletest@test.com',
        phoneNumber: '+1234567890',
        password: 'Test123!',
        address: 'Test Address',
        neighborhoodId: 1
      }, {
        headers: {
          'x-tenant-id': 'sadat',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      console.log('✅ User signup success:', signup.data);
    } catch (err) {
      console.log('❌ User signup failed:', err.response?.status, err.response?.data || err.message);
    }

  } catch (error) {
    console.log('❌ Basic connectivity failed:', error.message);
  }
}

simpleTest();