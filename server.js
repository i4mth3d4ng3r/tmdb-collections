const { addon } = require("./index.js");
const { initializeBuffering } = require("./lib/bufferCatalogs");
const PORT = process.env.PORT || 7000;
const isDevelopment = process.argv.includes("--dev");

console.log("PORT var type", typeof PORT);
console.log("PORT", PORT);

// create local server
addon.listen(PORT, () => {
  console.log(`Addon active on port ${PORT}`);

  // Only run buffering in production environment
  if (isDevelopment) {
    console.log("Buffering disabled in development mode");
  } else if (PORT == 5000) {
    console.log("Buffering disabled on port 5000"); // beamup deployment test runs on port 5000, which should be terminated (including buffering/schedule) due to container removal after the test is completed. But for some reason buffering continues and is scheduled. Which causes duplicated bufferings.
  } else {
    console.log("Starting catalog buffering system...");
    initializeBuffering(PORT)
      .then(() => {
        console.log("Initial catalog buffering completed");
      })
      .catch((error) => {
        console.error("Failed to initialize catalog buffering:", error);
      });
  }
});
