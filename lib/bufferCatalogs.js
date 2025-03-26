const getManifest = require("./getManifest");
const cron = require("node-cron");
const getCatalogResponse = require("./getCatalogResponse");
const { parseConfig } = require("./utils");
const config = parseConfig("{}"); //load default config
const fs = require("fs");
const { tempDbPath } = require("./cache");

async function generateCatalogRequests(config) {
  const manifest = await getManifest(config); //no catalog config, gonna buffer all the catalogs
  const genres = manifest.catalogs[0].extra.find((e) => e.name === "genre").options;
  const catalogs = manifest.catalogs.filter((catalog) => !catalog.id.endsWith("search")).map((catalog) => catalog.id);
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
    // console.log(`Buffering catalog: ${req.params.id}${req.params.extra ? ` with ${req.params.extra}` : ""}`);
    await getCatalogResponse(req);
  } catch (error) {
    console.error(`Error buffering catalog ${req.params.id}:`, error.message);
  }
}

async function bufferAllCatalogs(config) {
  const startTimeBuffer = process.hrtime();
  console.log("Starting catalog buffer process...");
  const requests = await generateCatalogRequests(config);

  // Process catalogs sequentially
  for (const req of requests) {
    req.config = config;
    await bufferCatalog(req);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay between catalogs
  }
  const endTimeBuffer = process.hrtime(startTimeBuffer);
  const minutesBuffer = (endTimeBuffer[0] * 1000 + endTimeBuffer[1] / 1000000) / 60000;
  console.log(`Finished buffering all catalogs in: ${minutesBuffer.toFixed(2)} minutes`);
}

function initializeBuffering(PORT, config) {
  // Schedule the daily buffer - runs at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log(`Running scheduled catalog buffer...(port ${PORT})`);
    await bufferAllCatalogs(config);
  });

  // Setup periodic check for SQLite file existence
  setInterval(async () => {
    if (!fs.existsSync(tempDbPath)) {
      console.log("SQLite cache file not found");
    } else {
      const stats = fs.statSync(tempDbPath);
      console.log(`SQLite cache file found. Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  }, 30 * 60 * 1000); // Check every 30 minutes

  // Initial buffer on startup
  console.log(`Initializing first catalog buffer...(port ${PORT})`);
  return bufferAllCatalogs(config).catch((error) => {
    console.error(`Error during initial catalog buffer: ${error.message}`);
  });
}

module.exports = {
  generateCatalogRequests,
  bufferAllCatalogs,
  initializeBuffering,
};
