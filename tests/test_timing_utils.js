// test_timing_utils.js - Simple test for timing utilities

const { TimingTracker } = require('./timingUtils');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTimingTest() {
  console.log('Testing Timing Utilities');
  console.log('========================');
  
  const tracker = new TimingTracker();
  tracker.startTracking();
  
  // Test operation 1
  tracker.startOperation('Database Query');
  await delay(100); // Simulate work
  tracker.endOperation();
  
  // Test operation 2
  tracker.startOperation('API Call');
  await delay(200); // Simulate work
  tracker.endOperation();
  
  // Test operation 3
  tracker.startOperation('File Processing');
  await delay(50); // Simulate work
  tracker.endOperation();
  
  // Print stats
  tracker.printStats();
  
  // Get stats programmatically
  const stats = tracker.getStats();
  console.log('Programmatic Stats Access:');
  console.log(`Operations: ${stats.totalOperations}`);
  console.log(`Total Duration: ${stats.totalDuration}ms`);
  console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
  
  console.log('\n✅ Timing utilities test completed successfully!');
}

if (require.main === module) {
  runTimingTest().catch(console.error);
}

module.exports = { runTimingTest };