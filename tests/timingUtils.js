// timingUtils.js - Utility for timing operations in tests

class TimingTracker {
  constructor() {
    this.timings = [];
    this.startTime = null;
    this.currentOperation = null;
  }

  startTracking() {
    this.startTime = Date.now();
    console.log(
      `⏱️  Test timing started at: ${new Date(this.startTime).toISOString()}`,
    );
  }

  startOperation(name) {
    const startTime = Date.now();
    this.currentOperation = {
      name,
      startTime,
    };
    console.log(`⏱️  Starting operation: ${name}`);
  }

  endOperation() {
    if (!this.currentOperation) return;

    const endTime = Date.now();
    const duration = endTime - this.currentOperation.startTime;

    this.timings.push({
      operation: this.currentOperation.name,
      startTime: this.currentOperation.startTime,
      endTime,
      duration,
    });

    console.log(
      `⏱️  Completed operation: ${this.currentOperation.name} (${duration}ms)`,
    );
    this.currentOperation = null;

    return duration;
  }

  getStats() {
    if (this.timings.length === 0) return null;

    const durations = this.timings.map((t) => t.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Find slowest operations
    const sortedTimings = [...this.timings].sort(
      (a, b) => b.duration - a.duration,
    );
    const slowestOperations = sortedTimings.slice(0, 3);

    return {
      totalOperations: this.timings.length,
      totalDuration,
      averageDuration: avgDuration,
      minDuration,
      maxDuration,
      slowestOperations: slowestOperations.map((op) => ({
        operation: op.operation,
        duration: op.duration,
      })),
    };
  }

  Stats() {
    const stats = this.getStats();
    if (!stats) {
      console.log("No timing data available");
      return;
    }

    console.log("\n📊 Timing Statistics:");
    console.log("====================");
    console.log(`Total Operations: ${stats.totalOperations}`);
    console.log(
      `Total Duration: ${stats.totalDuration}ms (${(stats.totalDuration / 1000).toFixed(2)}s)`,
    );
    console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`Fastest Operation: ${stats.minDuration}ms`);
    console.log(`Slowest Operation: ${stats.maxDuration}ms`);

    console.log("\n🐌 Top 3 Slowest Operations:");
    stats.slowestOperations.forEach((op, index) => {
      console.log(`  ${index + 1}. ${op.operation}: ${op.duration}ms`);
    });

    console.log("\n");
  }

  reset() {
    this.timings = [];
    this.startTime = null;
    this.currentOperation = null;
  }
}

module.exports = { TimingTracker };
