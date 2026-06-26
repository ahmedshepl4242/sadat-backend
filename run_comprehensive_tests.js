#!/usr/bin/env node

// run_comprehensive_tests.js - Run all tests with detailed timing statistics

const { runHappyOrderFlow } = require('./test_happy_order_flow');
const { runVendorInitiatedOrderFlow } = require('./test_vendor_initiated_order_flow');
const { runSpecialOrderFlow } = require('./test_special_order_flow');

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Delivery System Tests with Timing Statistics');
  console.log('=====================================================================');
  
  const testResults = [];
  const overallStartTime = Date.now();
  
  // Test 1: Happy Order Flow
  console.log('\n🧪 Test 1: Happy Order Flow');
  console.log('-'.repeat(30));
  try {
    const result = await runHappyOrderFlow();
    testResults.push({
      testName: 'Happy Order Flow',
      ...result
    });
  } catch (error) {
    testResults.push({
      testName: 'Happy Order Flow',
      success: false,
      error: error.message
    });
  }
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Vendor Initiated Order Flow
  console.log('\n🧪 Test 2: Vendor Initiated Order Flow');
  console.log('-'.repeat(30));
  try {
    const result = await runVendorInitiatedOrderFlow();
    testResults.push({
      testName: 'Vendor Initiated Order Flow',
      ...result
    });
  } catch (error) {
    testResults.push({
      testName: 'Vendor Initiated Order Flow',
      success: false,
      error: error.message
    });
  }
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 3: Special Order Flow
  console.log('\n🧪 Test 3: Special Order Flow');
  console.log('-'.repeat(30));
  try {
    const result = await runSpecialOrderFlow();
    testResults.push({
      testName: 'Special Order Flow',
      ...result
    });
  } catch (error) {
    testResults.push({
      testName: 'Special Order Flow',
      success: false,
      error: error.message
    });
  }
  
  const overallEndTime = Date.now();
  const overallDuration = (overallEndTime - overallStartTime) / 1000;
  
  // Print comprehensive summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  
  let passedTests = 0;
  let totalRequests = 0;
  let totalTestDuration = 0;
  
  for (const result of testResults) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? result.duration.toFixed(2) : 'N/A';
    
    console.log(`\n${status} ${result.testName}`);
    console.log(`   Duration: ${duration}s`);
    
    if (result.success) {
      passedTests++;
      totalRequests += result.requestCount;
      totalTestDuration += result.duration;
      
      console.log(`   Requests: ${result.requestCount}`);
      console.log(`   Order ID: ${result.orderId}`);
      
      // Display timing stats if available
      if (result.timingStats) {
        const stats = result.timingStats;
        console.log(`   Operations: ${stats.totalOperations}`);
        console.log(`   Avg Operation Time: ${stats.averageDuration.toFixed(2)}ms`);
        
        // Show slowest operations
        if (stats.slowestOperations && stats.slowestOperations.length > 0) {
          console.log(`   Slowest Operations:`);
          stats.slowestOperations.slice(0, 3).forEach((op, index) => {
            console.log(`     ${index + 1}. ${op.operation}: ${op.duration}ms`);
          });
        }
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 OVERALL STATISTICS');
  console.log('='.repeat(70));
  console.log(`Tests Run: ${testResults.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${testResults.length - passedTests}`);
  console.log(`Success Rate: ${(passedTests / testResults.length * 100).toFixed(1)}%`);
  console.log(`Total Execution Time: ${overallDuration.toFixed(2)}s`);
  console.log(`Total API Requests: ${totalRequests}`);
  console.log(`Average Test Duration: ${(totalTestDuration / passedTests || 0).toFixed(2)}s`);
  
  // Find slowest test
  const successfulTests = testResults.filter(t => t.success);
  if (successfulTests.length > 0) {
    const slowestTest = successfulTests.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
    console.log(`Slowest Test: ${slowestTest.testName} (${slowestTest.duration.toFixed(2)}s)`);
  }
  
  console.log('\n📋 Detailed logs available in:');
  console.log('   - test_results.log');
  console.log('   - test_vendor_initiated_order_results.log');
  console.log('   - test_special_order_results.log');
  
  console.log('\n🏁 Comprehensive testing completed!');
  
  // Exit with appropriate code
  process.exit(passedTests === testResults.length ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('💥 Unexpected error in comprehensive testing:', error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests };