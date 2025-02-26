const express = require("express");
const path = require("path");
const addon = express();
const getManifest = require("./manifest");

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
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Manifest endpoint
addon.get("/manifest.json", async function (req, res) {
  // console.log("manifest requested");
  const manifest = await getManifest();
  respond(res, manifest);
});

// Type validation middleware
addon.param("type", async function (req, res, next, val) {
  const manifest = await getManifest();
  if (manifest.types.includes(val)) {
    next();
  } else {
    next("Unsupported type " + val);
  }
});

// Catalog endpoint using the shared function
addon.get("/catalog/:type/:id/:extra?.json", async function (req, res) {
  const response = await getCatalogResponse(req);
  respond(res, response);
});

// Meta endpoint using the shared function
addon.get("/meta/:type/:id.json", async function (req, res) {
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
