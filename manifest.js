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
      "Addon lets you explore TMDB Collections, which are essentially grouped movie series. Discover collections featuring newly released films or browse catalogs of popular and top-rated collections. You can filter by genre or search collections by movie, actor, director, or collection name in any language.",
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
