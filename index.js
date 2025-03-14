const express = require("express");
const path = require("path");
const addon = express();
const { parseConfig } = require("./lib/utils");
const getManifest = require("./lib/getManifest");
const { getCachePerformance, getCacheIndex, clearCache } = require("./lib/cache");
const getCatalogResponse = require("./lib/getCatalogResponse");
const getMetaResponse = require("./lib/getMetaResponse");

// Response helper
const respond = function (res, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=180");

  // Send the response
  res.send(data);
};

addon.use(
  require("express-status-monitor")({
    spans: [
      {
        interval: 1, // Every second
        retention: 60, // Keep 60 datapoints in memory
      },
      {
        interval: 5, // Every 5 seconds
        retention: 60,
      },
      {
        interval: 15, // Every 15 seconds
        retention: 60,
      },
      {
        interval: 5 * 60, // Every 5 minutes
        retention: 120,
      },
    ],
  })
);

addon.get("/", async function (_, res) {
  res.redirect("/configure");
});

// Configure endpoint - serve static files only for configure route
addon.get("/:config?/configure", async function (req, res) {
  res.sendFile(path.join(__dirname, "/Public/index.html"));
});

// Serve static files from Public directory
addon.use(express.static(path.join(__dirname, "Public")));

//first route for backward compatibility
addon.get(["/manifest.json", "/:config/manifest.json"], async function (req, res) {
  let config = parseConfig(req.params.config);
  const manifest = await getManifest(config);
  respond(res, manifest);
});

// Type validation middleware
addon.param("type", async function (req, res, next, val) {
  let config = parseConfig(req.params.config);
  const manifest = await getManifest(config);
  if (manifest.types.includes(val)) {
    //somehow 'series', which is not in the manifest as supported type, is being passed here from time to time
    next();
  } else {
    res.end();
  }
});

//first route for backward compatibility
addon.get(["/catalog/:type/:id/:extra?.json", "/:config/catalog/:type/:id/:extra?.json"], async function (req, res) {
  req.config = parseConfig(req.params.config);
  const response = await getCatalogResponse(req);
  respond(res, response);
});

//first route for backward compatibility
addon.get(["/meta/:type/:id.json", "/:config/meta/:type/:id.json"], async function (req, res) {
  req.config = parseConfig(req.params.config);
  const response = await getMetaResponse(req);
  respond(res, response);
});

// Cache monitoring routes
addon.get("/cache/performance", async (req, res) => {
  const performance = await getCachePerformance();
  respond(res, performance);
});

addon.get("/cache/index", async (req, res) => {
  const index = await getCacheIndex();
  respond(res, index);
});

addon.get("/cache/clear/:target?", async (req, res) => {
  const result = await clearCache(req.params.target);
  respond(res, result);
});

module.exports = {
  addon,
  getCatalogResponse,
};
