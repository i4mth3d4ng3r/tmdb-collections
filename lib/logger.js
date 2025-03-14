const newrelic = require("newrelic");

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

// Record memory metrics every minute
const MEMORY_CHECK_INTERVAL = 5 * 1000; // 5 seconds
setInterval(recordMemoryMetrics, MEMORY_CHECK_INTERVAL);

// Initial recording at startup
recordMemoryMetrics();

// Log memory on critical operations - optional - enable if needed
// global.logMemoryUsage = (operation) => {
//   const memUsage = process.memoryUsage();
//   console.log(`[Memory] ${operation}: Heap used ${formatMemorySize(memUsage.heapUsed)}MB`);
// };
