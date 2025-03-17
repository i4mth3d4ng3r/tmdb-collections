const newrelic = require("newrelic");
const fs = require("fs");
const path = require("path");
// Check disk space for the root directory where the app is running
const { statfs } = require("fs/promises");

// Override console.log
const originalConsoleLog = console.log;
console.log = (...args) => {
  originalConsoleLog.apply(console, args); // Keep original console.log behavior
  newrelic.recordLogEvent({
    message: args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" "),
    level: "info",
  }); //send to new relic
};

// Override console.error
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError.apply(console, args); // Keep original console.error behavior
  newrelic.recordLogEvent({
    message: args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" "),
    level: "error",
  }); //send to new relic
};

// Memory monitoring functionality
function formatMemorySize(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100; // Convert to MB with 2 decimal places
}

// Track the last notified threshold to avoid duplicate notifications
let lastNotifiedThreshold = 0;

function recordMemoryMetrics() {
  try {
    const memUsage = process.memoryUsage();

    // Add disk space monitoring
    let diskSpace = { free: 0, total: 0 };
    try {
      const rootPath = path.resolve(__dirname, "../");

      // We'll get the disk space stats asynchronously, but continue with memory metrics
      statfs(rootPath)
        .then((stats) => {
          diskSpace = {
            free: stats.bavail * stats.bsize,
            total: stats.blocks * stats.bsize,
          };

          // Record disk space metrics when available
          newrelic.recordMetric("Custom/Disk/free", formatMemorySize(diskSpace.free));
          newrelic.recordMetric("Custom/Disk/total", formatMemorySize(diskSpace.total));
          newrelic.recordCustomEvent("DiskSpace", {
            free: formatMemorySize(diskSpace.free),
            total: formatMemorySize(diskSpace.total),
            timestamp: Date.now(),
          });
        })
        .catch((err) => {
          console.error("Error checking disk space:", err);
        });
    } catch (err) {
      console.error("Error setting up disk space monitoring:", err);
    }

    // Record custom metrics in MB for charts/dashboards
    newrelic.recordMetric("Custom/Memory/heapUsed", formatMemorySize(memUsage.heapUsed));
    newrelic.recordMetric("Custom/Memory/heapTotal", formatMemorySize(memUsage.heapTotal));
    newrelic.recordMetric("Custom/Memory/rss", formatMemorySize(memUsage.rss));

    // Record as custom event for querying/analyzing
    newrelic.recordCustomEvent("MemoryUsage", {
      heapUsed: formatMemorySize(memUsage.heapUsed),
      heapTotal: formatMemorySize(memUsage.heapTotal),
      rss: formatMemorySize(memUsage.rss),
      timestamp: Date.now(),
    });

    // Optional: Log significant memory thresholds
    const heapUsedMB = formatMemorySize(memUsage.heapUsed);
    const thresholds = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const threshold = thresholds.find((t) => heapUsedMB < t);

    // Check if we're approaching a threshold
    if (threshold && heapUsedMB > threshold - 30) {
      // Only notify if we're approaching a higher threshold than last time
      // or if we haven't notified about any threshold yet
      if (threshold > lastNotifiedThreshold) {
        console.log(`[Memory Warning] Heap usage approaching ${threshold}MB threshold: ${heapUsedMB}MB`);
        lastNotifiedThreshold = threshold;
      }
    }
    // Reset lastNotifiedThreshold if memory usage has dropped significantly
    // (when we're 50MB below the last notified threshold)
    else if (lastNotifiedThreshold > 0 && heapUsedMB < lastNotifiedThreshold - 50) {
      const oldThreshold = lastNotifiedThreshold;
      lastNotifiedThreshold = thresholds.find((t) => heapUsedMB < t) || 0;
      console.log(`[Memory Info] Heap usage decreased from ${oldThreshold}MB threshold to ${heapUsedMB}MB`);
    }
  } catch (err) {
    console.error("Error recording memory metrics:", err);
  }
}

// Record memory metrics
setInterval(recordMemoryMetrics, 10 * 1000);

// Initial recording at startup
recordMemoryMetrics();
