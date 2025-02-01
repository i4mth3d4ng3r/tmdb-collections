const { MovieDb } = require("moviedb-promise");
const freekeys = require("freekeys");
const { cacheWrapMovieDetails } = require("./cache");

let moviedb = null;
let initializationPromise = null;

// Initialize moviedbimmediately
initMovieDb();

async function initMovieDb() {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    // console.log("MovieDB already initializing, reusing existing promise");
    return initializationPromise;
  }

  // If already initialized, return the existing instance
  if (moviedb) {
    // console.log("MovieDB already initialized, reusing existing instance");
    return moviedb;
  }

  // Create a single initialization promise
  initializationPromise = (async () => {
    console.log(`[${new Date().toISOString()}] Initializing MovieDB`);
    const { tmdb_key } = await freekeys();
    moviedb = new MovieDb(tmdb_key);
    return moviedb;
  })();

  return initializationPromise;
}

async function getImdbId(movieId) {
  return await moviedb
    .movieExternalIds({ id: movieId })
    .then((res) => {
      return res.imdb_id || null;
    })
    .catch((err) => {
      console.error(`Movie ${movieId}: ${err.response?.status} - ${err.response?.data?.status_message}`);
      return null;
    });
}

async function getGenres() {
  try {
    const response = await moviedb.genreMovieList();
    if (!response || !response.genres) {
      return [];
    }
    return response.genres;
  } catch (err) {
    console.error(`Genres: ${err.response?.status} - ${err.response?.data?.status_message}`);
    return [];
  }
}

async function getMovieDetails(movieId) {
  return cacheWrapMovieDetails(movieId, async () => {
    return await moviedb
      .movieInfo({ id: movieId, append_to_response: "credits" })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.error(`Movie ${movieId}: ${err.response?.status} - ${err.response?.data?.status_message}`);
        return null;
      });
  });
}

async function getCollectionDetails(collectionId) {
  return await moviedb
    .collectionInfo({ id: collectionId })
    .then((res) => {
      res.parts.sort((a, b) => {
        // If both dates are missing, maintain original order
        if (!a.release_date && !b.release_date) return 0;
        // Put missing dates at the beginning (treat as future)
        if (!a.release_date) return -1;
        if (!b.release_date) return 1;
        // Sort by date if both exist
        return new Date(b.release_date) - new Date(a.release_date);
      });
      return res;
    })
    .catch((err) => {
      console.error(`Collection ${collectionId}: ${err.response?.status} - ${err.response?.data?.status_message}`);
      return null;
    });
}

async function getCollectionIDsFromMovieIDs(movieIds) {
  // Fetch all movie details in parallel
  const movieDetailsPromises = [...movieIds].map((movieId) => getMovieDetails(movieId));

  const movieDetails = await Promise.all(movieDetailsPromises);

  // Filter movies that belong to collections
  const collectionIds = new Set(movieDetails.filter((movie) => movie && movie.belongs_to_collection).map((movie) => movie.belongs_to_collection.id));

  return collectionIds;
}

// Export the initialized instance getter
module.exports = {
  initMovieDb,
  getImdbId,
  getMovieDetails,
  getCollectionDetails,
  getCollectionIDsFromMovieIDs,
  getGenres,
};
