const { getGenres } = require("./getTmdb");
const dev = process.argv.includes("--dev") == 1 ? "Dev" : "";
const version = "2.1.0";

console.log("[manifest.js] Module being loaded, version:", version);

async function getManifest(config) {
  const genres = await getGenres(config.language);
  const genreNames = genres.map((genre) => genre.name);

  config.enableSearch === true && !config.catalogList.includes("search") ? config.catalogList.push("search") : null; //add search to catalogList if enabled

  // Start with empty catalogs array if catalogList is provided, otherwise use default catalogs
  let catalogs = [];

  if (config.catalogList) {
    config.catalogList.forEach((catalogId) => {
      const catalog = {
        type: "collections",
        id: `tmdbc${dev}.${catalogId}`,
        name:
          catalogId //newReleases to New Releases
            .split(/(?=[A-Z])/)
            .join(" ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\b\w/g, (c) => c.toUpperCase()) + dev,
      };

      //change extra for search catalog
      catalog.extra =
        catalogId === "search"
          ? [
              {
                name: "search",
                isRequired: true,
              },
            ]
          : [
              {
                name: "genre",
                isRequired: config.discoverOnly[catalogId], //set catalog to be visible only in discover section
                options: config.discoverOnly[catalogId] === true ? ["Default", ...genreNames] : genreNames, //add default option to the genre options if discoverOnly is true...this setting in addition to showing catalog only in discover also removes Default option from the genre options
              },
            ];

      catalogs.push(catalog);
    });
  }

  return {
    id: "org.stremio.tmdbcollections" + dev,
    version: version,
    name: "TMDB Collections" + dev,
    description:
      "Addon lets you explore TMDB Collections, which are essentially grouped movie series. Discover collections featuring newly released movies or browse catalogs of popular and top-rated collections. You can filter by genre or search collections by actor, director, writer, movie or collection name in any language.",
    types: ["movie", "collections"],
    resources: [
      "catalog",
      { name: "meta", types: ["movie"], idPrefixes: [`tmdbc${dev}.`] },
      ...(config.enableCollectionFromMovie ? [{ name: "stream", types: ["movie"], idPrefixes: ["tt"] }] : []),
    ],
    idPrefixes: [`tmdbc${dev}.`], //addon doesn't need this in this "resource" setup, but there is other logic built on top of this
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
