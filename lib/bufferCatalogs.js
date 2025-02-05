const getManifest = require("../manifest");
const cron = require("node-cron");
const getCatalogResponse = require("./getCatalogResponse");

async function generateCatalogRequests() {
  const manifest = await getManifest();
  const genres = manifest.catalogs[0].extra.find((e) => e.name === "genre").options;
  const catalogs = manifest.catalogs.map((catalog) => catalog.id);
  const requests = [];

  // Add base catalogs
  for (const catalog of catalogs) {
    requests.push({
      params: {
        type: "collections",
        id: catalog,
      },
    });
  }

  // Add genre-specific requests
  for (const catalog of catalogs) {
    for (const genre of genres) {
      requests.push({
        params: {
          type: "collections",
          id: catalog,
          extra: `genre=${genre}`,
        },
      });
    }
  }

  return requests;
}

async function bufferCatalog(req) {
  try {
    console.log(`Buffering catalog: ${req.params.id}${req.params.extra ? ` with ${req.params.extra}` : ""}`);
    await getCatalogResponse(req);
  } catch (error) {
    console.error(`Error buffering catalog ${req.params.id}:`, error.message);
  }
}

async function bufferAllCatalogs() {
  console.log("Starting catalog buffer process...");
  const requests = await generateCatalogRequests();

  // Process catalogs sequentially
  for (const req of requests) {
    await bufferCatalog(req);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay between catalogs
  }
  console.log("Finished buffering all catalogs");
}

function initializeBuffering() {
  // Schedule the daily buffer - runs at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled catalog buffer...");
    await bufferAllCatalogs();
  });

  // Initial buffer on startup
  console.log("Initializing first catalog buffer...");
  return bufferAllCatalogs().catch((error) => {
    console.error("Error during initial catalog buffer:", error);
  });
}

module.exports = {
  generateCatalogRequests,
  bufferAllCatalogs,
  initializeBuffering,
};
