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
