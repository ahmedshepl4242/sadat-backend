#!/usr/bin/env node

const { runVendorInitiatedOrderFlow } = require('./test_vendor_initiated_order_flow');

console.log('🚀 Starting Delivery System Vendor Initiated Order Flow Test...\n');

runVendorInitiatedOrderFlow()
  .then((result) => {
    console.log('\n' + '='.repeat(60));

    if (result.success) {
      console.log('🎉 TEST RESULT: SUCCESS');
      console.log(`⏱️  Duration: ${result.duration}s`);
      console.log(`📊 Requests: ${result.requestCount}`);
      console.log(`🆔 Order ID: ${result.orderId}`);
      console.log('📋 Check test_vendor_initiated_order_results.log for detailed logs');
    } else {
      console.log('❌ TEST RESULT: FAILED');
      console.log(`💥 Error: ${result.error}`);
      console.log(`⏱️  Duration: ${result.duration}s`);
      console.log(`📊 Requests: ${result.requestCount}`);
      console.log('📋 Check test_vendor_initiated_order_results.log for detailed logs');
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