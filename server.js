const { addon } = require("./index.js");
const { initializeBuffering } = require("./lib/bufferCatalogs");
const PORT = process.env.PORT || 7000;

// create local server
addon.listen(PORT, () => {
  console.log(`Addon active on port ${PORT}`);
  console.log("Starting catalog buffering system...");
  initializeBuffering()
    .then(() => {
      console.log("Initial catalog buffering completed");
    })
    .catch((error) => {
      console.error("Failed to initialize catalog buffering:", error);
    });
});
