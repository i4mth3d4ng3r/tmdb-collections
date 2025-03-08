const express = require("express");
const path = require("path");
const addon = express();
const getManifest = require("./manifest");
const { parseConfig } = require("./lib/utils");
const { getCachePerformance, getCacheIndex, clearCache } = require("./lib/cache");
const getCatalogResponse = require("./lib/getCatalogResponse");
const getMetaResponse = require("./lib/getMetaResponse");

// Response helper
const respond = function (res, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json");
  res.send(data);
};

addon.get("/", async function (_, res) {
  res.redirect("/configure");
});

// Configure endpoint
addon.get("/:config?/configure", async function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Handle config in URL path
//first route for backward compatibility
addon.get(["/manifest.json", "/:config/manifest.json"], async function (req, res) {
  const config = parseConfig(req);
  const manifest = await getManifest(config);
  respond(res, manifest);
});

// Type validation middleware
addon.param("type", async function (req, res, next, val) {
  const config = parseConfig(req);
  const manifest = await getManifest(config);
  if (manifest.types.includes(val)) {
    //somehow 'series', which is not in the manifest as supported type, is being passed here from time to time
    next();
  } else {
    res.end();
  }
});

// Handle config in URL path for catalog
//first route for backward compatibility
addon.get(["/catalog/:type/:id/:extra?.json", "/:config/catalog/:type/:id/:extra?.json"], async function (req, res) {
  req.config = parseConfig(req);
  const response = await getCatalogResponse(req);
  respond(res, response);
});

// Handle config in URL path for meta
//first route for backward compatibility
addon.get(["/meta/:type/:id.json", "/:config/meta/:type/:id.json"], async function (req, res) {
  req.config = parseConfig(req);
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
