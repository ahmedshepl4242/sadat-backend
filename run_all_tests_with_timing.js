// run_all_tests_with_timing.js - Run all tests with timing statistics

const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;

const execAsync = promisify(exec);

// Test files to run
const testFiles = [
  {
    name: "Happy Order Flow",
    file: "test_happy_order_flow.js",
    description: "Standard user-initiated order flow",
  },
  {
    name: "Vendor Initiated Order Flow",
    file: "test_vendor_initiated_order_flow.js",
    description: "Vendor creates order for external customer",
  },
  {
    name: "Special Order Flow",
    file: "test_special_order_flow.js",
    description: "Order with system vendor",
  },
];

// Timing results
const timingResults = [];

async function runTest(testInfo) {
  console.log(`\n🧪 Running ${testInfo.name} Test`);
  console.log(`📝 ${testInfo.description}`);
  console.log("=".repeat(50));

  const startTime = Date.now();

  try {
    // Run the test file
    const { stdout, stderr } = await execAsync(`node ${testInfo.file}`, {
      timeout: 120000, // 2 minute timeout
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(
      `✅ ${testInfo.name} completed successfully in ${duration.toFixed(2)} seconds`,
    );

    // Try to extract timing stats from the log file
    try {
      const logContent = await fs.readFile(
        testInfo.file
          .replace(".js", "_results.log")
          .replace(
            "test_special_order_flow_results.log",
            "test_special_order_results.log",
          ),
        "utf8",
      );
      const lines = logContent.split("\n");

      // Look for timing statistics in the log
      const timingStats = {
        totalOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
      };

      for (const line of lines) {
        if (line.includes("Total Operations:")) {
          timingStats.totalOperations = parseInt(line.match(/\d+/)[0]);
        } else if (line.includes("Total Duration:")) {
          timingStats.totalDuration = parseFloat(line.match(/[\d.]+/)[0]);
        } else if (line.includes("Average Duration:")) {
          timingStats.averageDuration = parseFloat(line.match(/[\d.]+/)[0]);
        }
      }

      timingResults.push({
        testName: testInfo.name,
        success: true,
        duration,
        timingStats,
      });
    } catch (logError) {
      console.log(
        `⚠️  Could not read timing stats from log for ${testInfo.name}`,
      );
      timingResults.push({
        testName: testInfo.name,
        success: true,
        duration,
      });
    }

    return { success: true, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(
      `❌ ${testInfo.name} failed after ${duration.toFixed(2)} seconds`,
    );
    console.log(`Error: ${error.message}`);

    timingResults.push({
      testName: testInfo.name,
      success: false,
      duration,
      error: error.message,
    });

    return { success: false, duration, error: error.message };
  }
}

async function runAllTests() {
  console.log("🚀 Starting All Tests with Timing Statistics");
  console.log("==========================================");

  const overallStartTime = Date.now();

  // Run each test
  for (const testInfo of testFiles) {
    await runTest(testInfo);
    // Add a small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const overallEndTime = Date.now();
  const overallDuration = (overallEndTime - overallStartTime) / 1000;

  //  summary
  console.log("\n📋 TEST SUMMARY");
  console.log("===============");

  let passedTests = 0;
  let totalDuration = 0;

  for (const result of timingResults) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.testName}: ${result.duration.toFixed(2)}s`);

    if (result.success) passedTests++;
    totalDuration += result.duration;

    if (result.timingStats) {
      console.log(
        `   Operations: ${result.timingStats.totalOperations}, Avg: ${result.timingStats.averageDuration.toFixed(2)}ms`,
      );
    }
  }

  console.log("\n📊 OVERALL STATISTICS");
  console.log("====================");
  console.log(`Tests Run: ${testFiles.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${testFiles.length - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / testFiles.length) * 100).toFixed(1)}%`,
  );
  console.log(`Total Duration: ${overallDuration.toFixed(2)}s`);
  console.log(
    `Average Test Duration: ${(totalDuration / testFiles.length).toFixed(2)}s`,
  );

  // Find slowest test
  if (timingResults.length > 0) {
    const slowestTest = timingResults.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest,
    );
    console.log(
      `Slowest Test: ${slowestTest.testName} (${slowestTest.duration.toFixed(2)}s)`,
    );
  }

  console.log("\n🏁 All tests completed!");

  // Return exit code based on test results
  process.exit(passedTests === testFiles.length ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error("Unexpected error running tests:", error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testFiles };
