const qs = require("querystring");
const genres = require("../Static/genres");
const { getSearch } = require("./searchTmdbC");
const { discoverXCollections } = require("./discoverTmdb");
const { processCollectionDetails } = require("./processCollectionDetails");
const { cacheWrapSearch, cacheWrapCatalog } = require("./cache");

// Catalog processing function that can be used both for HTTP requests and prebuffering
async function getCatalogResponse(req) {
  const startTime = process.hrtime();
  const extra = req.params.extra ? qs.parse(req.params.extra) : { search: null, genre: null };

  const cacheKey = JSON.stringify({
    id: req.params.id, //catalog
    search: extra.search, //search query
    genre: extra.genre, //genre
  });
  let sortCollectionsBy = "popularity";
  let collections = [];

  console.log(`Catalog request for type ${req.params.type}, ${cacheKey}`);

  // Ignore skip requests - this is a workaround to avoid triggering skip requests
  if (extra.skip) {
    console.log("Ignoring request with skip parameter");
    return { metas: [] };
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
        discoverParams["vote_count.gte"] = 5;
        discoverParams["vote_average.gte"] = 5;
        sortCollectionsBy = "latestReleaseDate";
        break;
    }

    if (extra.genre) {
      console.log(`Filtering by genre ${extra.genre}`);
      discoverParams.with_genres = genres.find((g) => g.name === extra.genre).id;
    }

    collections = await cacheWrapCatalog("discover:" + cacheKey, async () => {
      return discoverXCollections(discoverParams);
    });
  }

  if (collections.length === 0) {
    console.log("no collections found");
    return { metas: [] };
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

  return { metas };
}

module.exports = getCatalogResponse;
