const express = require("express");
const path = require("path");
const addon = express();
const getManifest = require("./manifest");
const qs = require("querystring");

const { getGenres } = require("./lib/getTmdb");
const { getSearch } = require("./lib/searchTMDB");
const { discoverXCollections } = require("./lib/discoverTmdb");
const { processCollectionDetails } = require("./lib/processCollectionDetails");
const { cacheWrapSearch, cacheWrapCatalog, getCachePerformance, getCacheIndex, clearCache } = require("./lib/cache");

// Response helper
const respond = function (res, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json");
  // res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  // res.setHeader("Pragma", "no-cache");
  // res.setHeader("Expires", "0");
  res.send(data);
};

addon.get("/", async function (_, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Manifest endpoint
addon.get("/manifest.json", async function (req, res) {
  console.log("manifest requested");
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

// Catalog endpoint
addon.get("/catalog/:type/:id/:extra?.json", async function (req, res) {
  const startTime = process.hrtime();
  console.log(`Catalog request for type ${req.params.type} and id ${req.params.id}`);

  const extra = req.params.extra ? qs.parse(req.params.extra) : { search: null, genre: null };
  const cacheKey = JSON.stringify({
    id: req.params.id, //catalog
    search: extra.search, //search query
    genre: extra.genre, //genre
  });
  let sortCollectionsBy = "popularity";
  let collections = [];

  // Ignore skip requests - this is a workaround to avoid triggering skip requests
  if (extra.skip) {
    console.log("Ignoring request with skip parameter");
    return respond(res, { metas: [] });
  }

  if (extra.search) {
    console.log("search query", extra.search);
    collections = await cacheWrapSearch(cacheKey, async () => {
      return getSearch(extra.search);
    });
  } else {
    console.log("discovering collections for catalog:", req.params.id);
    // Discover collections with parameters based on catalog type
    const discoverParams = { "vote_count.gte": 100 }; //defaults

    switch (req.params.id) {
      case "tmdbc.popular":
        discoverParams.sort_by = "popularity.desc";
        discoverParams["vote_average.gte"] = 7;
        discoverParams["vote_count.gte"] = 20;
        break;

      case "tmdbc.topRated":
        discoverParams.sort_by = "vote_average.desc";
        sortCollectionsBy = "rating";
        break;

      case "tmdbc.newReleases":
        discoverParams.sort_by = "release_date.desc";
        // Get movies from last year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        discoverParams["primary_release_date.gte"] = oneYearAgo.toISOString().split("T")[0];
        discoverParams["vote_count.gte"] = 10;
        discoverParams["vote_average.gte"] = 2;
        sortCollectionsBy = "latestReleaseDate";
        break;

      default:
        console.warn("Unknown catalog ID:", req.params.id);
        break;
    }

    if (extra.genre) {
      console.log(`Filtering by genre ${extra.genre}`);
      genre = await getGenres();
      discoverParams.with_genres = genre.find((g) => g.name === extra.genre).id;
    }

    collections = await cacheWrapCatalog("discover:" + cacheKey, async () => {
      return discoverXCollections(discoverParams);
    });
  }

  if (collections.length === 0) {
    console.log("no collections found");
    respond(res, { metas: [] });
    return;
  }

  // Process collections with caching
  const processCollections = async (collections) => {
    const promises = collections.map((collectionId) => processCollectionDetails(collectionId));

    return (await Promise.all(promises)).filter(Boolean).sort((a, b) => (b[sortCollectionsBy] || 0) - (a[sortCollectionsBy] || 0));
  };

  const metas = extra.search
    ? await processCollections(collections)
    : await cacheWrapCatalog("catalog:" + cacheKey, () => processCollections(collections));

  const endTime = process.hrtime(startTime);
  const milliseconds = endTime[0] * 1000 + endTime[1] / 1000000;
  console.log(`fetching collections time: ${milliseconds.toFixed(2)}ms`);

  respond(res, { metas });
});

// Meta endpoint
addon.get("/meta/:type/:id.json", async function (req, res) {
  console.log("requested metadata for", req.params.type, "and id", req.params.id);
  const collectionId = req.params.id.split(".")[1];
  const collection = await processCollectionDetails(collectionId);

  respond(res, { meta: collection });
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

module.exports = addon;
