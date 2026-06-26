#!/usr/bin/env node

// analyze_test_timing.js - Utility to analyze test timing results from log files

const fs = require('fs').promises;
const path = require('path');

// Log files to analyze
const logFiles = [
  'test_results.log',
  'test_vendor_initiated_order_results.log',
  'test_special_order_results.log'
];

async function extractTimingData(logContent) {
  const lines = logContent.split('\n');
  const timingData = [];
  let currentTest = null;
  
  for (const line of lines) {
    // Look for request logs
    if (line.includes('Request #') && (line.includes('INFO:') || line.includes('SUCCESS:'))) {
      const timestampMatch = line.match(/\[(.*?)\]/);
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1]);
        timingData.push({
          timestamp,
          line
        });
      }
    }
    
    // Look for test start
    if (line.includes('API Test Run Started:')) {
      const timestampMatch = line.match(/\[(.*?)\]/);
      if (timestampMatch) {
        currentTest = new Date(timestampMatch[1]);
      }
    }
  }
  
  return { timingData, testStart: currentTest };
}

async function analyzeLogFile(logFile) {
  try {
    const logContent = await fs.readFile(logFile, 'utf8');
    const { timingData, testStart } = await extractTimingData(logContent);
    
    if (timingData.length === 0) {
      console.log(`No timing data found in ${logFile}`);
      return null;
    }
    
    // Calculate time gaps between requests
    const timeGaps = [];
    for (let i = 1; i < timingData.length; i++) {
      const gap = timingData[i].timestamp - timingData[i-1].timestamp;
      timeGaps.push(gap);
    }
    
    // Calculate statistics
    const totalTime = timeGaps.reduce((sum, gap) => sum + gap, 0);
    const avgGap = totalTime / timeGaps.length;
    const minGap = Math.min(...timeGaps);
    const maxGap = Math.max(...timeGaps);
    
    return {
      file: logFile,
      totalRequests: timingData.length,
      testDuration: testStart ? (timingData[timingData.length - 1].timestamp - testStart) / 1000 : null,
      avgRequestGap: avgGap,
      minRequestGap: minGap,
      maxRequestGap: maxGap,
      totalTimeMs: totalTime
    };
  } catch (error) {
    console.log(`Error reading ${logFile}: ${error.message}`);
    return null;
  }
}

async function analyzeAllLogs() {
  console.log('🔍 Analyzing Test Timing Data');
  console.log('============================');
  
  const results = [];
  
  for (const logFile of logFiles) {
    const result = await analyzeLogFile(logFile);
    if (result) {
      results.push(result);
    }
  }
  
  // Display results
  console.log('\n📊 Timing Analysis Results:');
  console.log('--------------------------');
  
  for (const result of results) {
    console.log(`\n📁 ${result.file}:`);
    console.log(`   Total Requests: ${result.totalRequests}`);
    if (result.testDuration) {
      console.log(`   Test Duration: ${result.testDuration.toFixed(2)}s`);
    }
    console.log(`   Average Request Gap: ${result.avgRequestGap.toFixed(0)}ms`);
    console.log(`   Min Request Gap: ${result.minRequestGap}ms`);
    console.log(`   Max Request Gap: ${result.maxRequestGap}ms`);
    console.log(`   Total Time: ${result.totalTimeMs}ms`);
  }
  
  // Overall statistics
  if (results.length > 0) {
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const avgRequests = totalRequests / results.length;
    
    console.log('\n📈 Overall Statistics:');
    console.log('---------------------');
    console.log(`Total Test Files Analyzed: ${results.length}`);
    console.log(`Total Requests Across All Tests: ${totalRequests}`);
    console.log(`Average Requests Per Test: ${avgRequests.toFixed(1)}`);
  }
}

// Run if executed directly
if (require.main === module) {
  analyzeAllLogs().catch(error => {
    console.error('Error analyzing timing data:', error);
    process.exit(1);
  });
}

module.exports = { analyzeLogFile, analyzeAllLogs };