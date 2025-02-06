const genres = require("./Static/genres");

// Extract only the names from the genres array
const genreNames = genres.map((genre) => genre.name);

console.log("[manifest.js] Module being loaded");

async function getManifest() {
  return {
    id: "org.stremio.tmdbcollections",
    version: "1.0.1",
    name: "TMDB Collections",
    description:
      "Addon allows you to explore TMDB Collections, which are basically grouped movie parts. Discover collections with newly released movies or catalogs with popular, top rated collections with possible filtering by genre...or search some collections by collection/movie/actor/director name in any language.",
    types: ["movie", "collections"],
    resources: ["catalog", "meta"],
    idPrefixes: ["tmdbc."],
    // favicon: "https://github.com/JMskch/TMDB-Collections/raw/main/Images/TMDBCollections_logo.png",
    logo: "https://github.com/JMskch/TMDB-Collections/raw/main/Images/TMDBCollections_logo.png",
    background: "https://github.com/JMskch/TMDB-Collections/raw/main/Images/TMDBCollections_logo.png",
    catalogs: [
      {
        type: "collections",
        id: "tmdbc.popular",
        name: "Popular",
        extra: [
          {
            name: "search",
            isRequired: false,
          },
          {
            name: "genre",
            isRequired: false,
            options: genreNames,
          },
        ],
      },
      {
        type: "collections",
        id: "tmdbc.topRated",
        name: "Top Rated",
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
        id: "tmdbc.newReleases",
        name: "New Releases",
        extra: [
          {
            name: "genre",
            isRequired: false,
            options: genreNames,
          },
        ],
      },
    ],
  };
}

module.exports = getManifest;
