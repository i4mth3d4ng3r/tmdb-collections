const { addon } = require("./index.js");
const { initializeBuffering } = require("./lib/bufferCatalogs");
const PORT = process.env.PORT || 7000;
const isDevelopment = process.argv.includes("--dev");

let bufferingStarted = false;

// Function to start buffering process
function startBuffering() {
  if (bufferingStarted) return;
  bufferingStarted = true;

  console.log("Starting catalog buffering system...");
  initializeBuffering(PORT)
    .then(() => {
      console.log("Initial catalog buffering completed");
    })
    .catch((error) => {
      console.error("Failed to initialize catalog buffering:", error);
    });
}

// Check if container survives initial test period
function checkContainerSurvival() {
  const TEST_CONTAINER_LIFETIME = 120 * 1000; // 120 seconds (60s shutdown delay + 60s buffer)
  const startTime = Date.now();

  // First check after test container lifetime
  setTimeout(() => {
    const uptime = Date.now() - startTime;
    if (uptime >= TEST_CONTAINER_LIFETIME) {
      console.log(`Container survived ${TEST_CONTAINER_LIFETIME}ms - assuming production container`);

      startBuffering();
    }
  }, TEST_CONTAINER_LIFETIME);
}

// create local server
addon.listen(PORT, () => {
  console.log(`Addon active on port ${PORT}`);

  // Only run buffering in production environment
  if (isDevelopment) {
    console.log("Buffering disabled in development mode");
  } else {
    console.log("Starting container survival check...");
    checkContainerSurvival();
  }
});
