const { getGenres } = require("./getTmdb");
const dev = process.argv.includes("--dev") == 1 ? "Dev" : "";
const version = "2.0.0";

console.log("[manifest.js] Module being loaded, version:", version);

async function getManifest(config) {
  const genres = await getGenres(config.language);
  const genreNames = genres.map((genre) => genre.name);

  // Default catalogs
  const defaultCatalogs = [
    {
      type: "collections",
      id: `tmdbc${dev}.popular`,
      name: "Popular" + dev,
      extra: [
        {
          name: "genre",
          isRequired: false,
          options: genreNames,
        },
      ],
    },
    {
      type: "collections",
      id: `tmdbc${dev}.topRated`,
      name: "Top Rated" + dev,
      extra: [
        {
          name: "genre",
          isRequired: false,
          options: genreNames,
        },
      ],
    },
    {
      type: "collections",
      id: `tmdbc${dev}.newReleases`,
      name: "New Releases" + dev,
      extra: [
        {
          name: "genre",
          isRequired: true,
          options: genreNames,
        },
      ],
    },
  ];

  // Start with empty catalogs array if catalogList is provided, otherwise use default catalogs
  let catalogs = [];

  if (config.catalogList && Array.isArray(config.catalogList) && config.catalogList.length > 0) {
    // For each catalog ID in catalogList, find the matching catalog in defaultCatalogs
    config.catalogList.forEach((catalogId) => {
      // Find the catalog with matching ID
      const catalog = defaultCatalogs.find((cat) => cat.id.replace(`tmdbc${dev}.`, "") === catalogId);
      catalog.extra.find((extra) => extra.name === "genre").isRequired = config.discoverOnly[catalogId]; //set catalog to be visible only in discover section
      catalog.extra.find((extra) => extra.name === "genre").options =
        config.discoverOnly[catalogId] === true ? ["Default", ...genreNames] : genreNames; //add default option to the genre options if discoverOnly is true...this setting in addition to showing catalog only in discover also removes Default option from the genre options

      catalogs.push(catalog);
    });
  } else if (!config.catalogList) {
    // If catalogList is not defined, use all default catalogs
    catalogs = [...defaultCatalogs];
  }

  // Add search catalog if enabled or not defined at all
  if (config.enableSearch === true || typeof config.enableSearch === "undefined") {
    catalogs.push({
      type: "collections",
      id: `tmdbc${dev}.search`,
      name: "Search" + dev,
      extra: [
        {
          name: "search",
          isRequired: true,
        },
      ],
    });
  }

  return {
    id: "org.stremio.tmdbcollections" + dev,
    version: version,
    name: "TMDB Collections",
    description:
      "Addon lets you explore TMDB Collections, which are essentially grouped movie series. Discover collections featuring newly released movies or browse catalogs of popular and top-rated collections. You can filter by genre or search collections by actor, director, writer, movie or collection name in any language.",
    types: ["movie", "collections"],
    resources: ["catalog", "meta"],
    idPrefixes: [`tmdbc${dev}.`],
    behaviorHints: {
      configurable: true,
    },
    favicon: "https://github.com/youchi1/tmdb-collections/raw/main/Images/favicon.png",
    logo: "https://github.com/youchi1/tmdb-collections/raw/main/Images/logo.png",
    background: "https://github.com/youchi1/tmdb-collections/raw/main/Images/bg.png",
    catalogs: catalogs,
    genres: genres, // for the code in getCatalogResponse.js
  };
}

module.exports = getManifest;
