// const { getGenres } = require("./lib/getTmdb"); //since manifest is loaded first and it is importing getTmdb where moviedb is initialized, other initialization is node needed anymore

console.log("[manifest.js] Module being loaded");

async function getManifest() {
  // console.log("[manifest.js] getManifest called");
  // try { //not need to call genres dynamicly, list is static
  //   genre = await getGenres().then((genres) => genres.map((genre) => genre.name));
  // } catch (err) {
  // console.error("Error getting genres:", err);
  genre = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "History",
    "Horror",
    "Music",
    "Mystery",
    "Romance",
    "Science Fiction",
    "TV Movie",
    "Thriller",
    "War",
    "Western",
  ]; // Fallback genres
  // }

  return {
    id: "org.stremio.tmdbcollections",
    version: "1.0.0",
    name: "TMDB Collections",
    description:
      "Addon allows you to explore TMDB Collections, which are basically grouped movie parts. Discover collection catalogs by genres or search by collection/movie name or person.",
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
            options: genre,
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
            options: genre,
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
            options: genre,
          },
        ],
      },
    ],
  };
}

module.exports = getManifest;
