#!/usr/bin/env node

const { runCaptainRequestsTest } = require('./test_captain_requests_flow');

console.log('🚀 Starting Delivery System Captain Requests Flow Test...\n');

runCaptainRequestsTest()
  .then((result) => {
    console.log('\n' + '='.repeat(60));

    if (result.success) {
      console.log('🎉 TEST RESULT: SUCCESS');
      console.log(`⏱️  Duration: ${result.duration}s`);
      console.log(`📊 Requests: ${result.requestCount}`);
      console.log(`🆔 Request ID: ${result.requestId}`);
      console.log('📋 Check test_captain_requests_results.log for detailed logs');
    } else {
      console.log('❌ TEST RESULT: FAILED');
      console.log(`💥 Error: ${result.error}`);
      console.log(`⏱️  Duration: ${result.duration}s`);
      console.log(`📊 Requests: ${result.requestCount}`);
      console.log('📋 Check test_captain_requests_results.log for detailed logs');
    }

    console.log('='.repeat(60));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.log('\n' + '='.repeat(60));
    console.log('💥 UNEXPECTED ERROR');
    console.log(`Error: ${error.message}`);
    console.log('='.repeat(60));
    process.exit(1);
  });
