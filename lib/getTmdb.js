const { MovieDb } = require("moviedb-promise");
// const freekeys = require("freekeys");
const { genres } = require("../Public/genres");
require("dotenv").config();
const { cacheWrapMovieDetails, cacheWrapOthers } = require("./cache");

let moviedb = null;
let initializationPromise = null;

// Initialize moviedbimmediately
initMovieDb();

function handleTmdbError(err, errorText) {
  if (err.response?.status != 404 && !err.message?.includes("404")) {
    console.error(`${errorText}: ${err.response?.status} - ${err.response?.data?.status_message}`, {
      error: err.message,
      stack: err.stack,
    });
  }
}

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
    // const { tmdb_key } = await freekeys();
    moviedb = new MovieDb(process.env.TMDB_API_KEY);
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
      handleTmdbError(err, `Error getting imdb id for ${movieId}`);
      return null;
    });
}

async function getGenres(language = "en") {
  if (language === "en") {
    return Promise.resolve(genres);
  }

  try {
    const response = await cacheWrapOthers(`genres:${language}`, async () => {
      return await moviedb.genreMovieList({ language });
    });
    if (!response || !response.genres) {
      return [];
    } else if (response.genres.some((genre) => genre.name === null)) {
      return Promise.resolve(genres);
    }
    return response.genres;
  } catch (err) {
    handleTmdbError(err, "Error getting genres");
    return [];
  }
}

async function getMovieDetails(movieId) {
  return cacheWrapMovieDetails(movieId, async () => {
    return await moviedb
      .movieInfo({ id: movieId, append_to_response: "translations,images" })
      .then((movie) => {
        return {
          id: movie.id,
          imdb_id: movie.imdb_id,
          genres: movie.genres,
          belongs_to_collection: { id: movie.belongs_to_collection?.id },
          translations: movie.translations?.translations
            ?.filter((translation) => translation.iso_639_1 !== "en" && (translation.data.overview?.trim() || translation.data.title?.trim())) //filter out english translations, they are returned in collection by default
            .map((translation) => ({
              iso_639_1: translation.iso_639_1,
              description: translation.data.overview,
              title: translation.data.title,
            })),
          posters: movie.images?.posters
            ?.filter((image) => image.iso_639_1 !== "en" && image.iso_639_1?.trim() && image.file_path) //filter out english posters, they are returned in collection by default
            .map((image) => ({
              iso_639_1: image.iso_639_1,
              poster: image.file_path,
              // aspect_ratio: image.aspect_ratio,
              vote_average: image.vote_average,
            })),
          logos: movie.images?.logos
            ?.filter((image) => image.file_path && image.aspect_ratio >= 1 && image.aspect_ratio <= 2)
            .map((image) => ({
              iso_639_1: image.iso_639_1,
              logo: image.file_path,
              // aspect_ratio: image.aspect_ratio,
              vote_average: image.vote_average,
            })),
        };
      })
      .catch((err) => {
        // console.log(err);
        handleTmdbError(err, `Error getting movie details for ${movieId}`);
        return null;
      });
  });
}

async function getCollectionDetails(collectionId) {
  return await moviedb
    .collectionInfo({ id: collectionId, append_to_response: "translations,images" })
    .then((res) => {
      res.parts.sort((a, b) => {
        // If both dates are missing, maintain original order
        if (!a.release_date && !b.release_date) return 0;
        // Put missing dates at the beginning (treat as future)
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        // Sort by date if both exist
        return new Date(a.release_date) - new Date(b.release_date);
      });
      return res;
    })
    .catch((err) => {
      handleTmdbError(err, `Error getting collection details for ${collectionId}`);
      return null;
    });
}

async function getCollectionIDsFromMovieIDs(movieIds) {
  const BATCH_SIZE = 5;
  const allCollectionIds = new Set();

  // Process movies in batches
  for (let i = 0; i < movieIds.length; i += BATCH_SIZE) {
    const batch = movieIds.slice(i, i + BATCH_SIZE);

    // Fetch batch of movie details in parallel
    const batchDetails = await Promise.all(batch.map((movieId) => getMovieDetails(movieId)));

    // Add collection IDs from this batch
    batchDetails.filter((movie) => movie && movie.belongs_to_collection?.id).forEach((movie) => allCollectionIds.add(movie.belongs_to_collection.id));
  }

  return allCollectionIds;
}

async function getLogo(movieId) {
  try {
    const response = await moviedb.movieImages({
      id: movieId,
      include_image_language: "en,null", // get English logos and logos without language
    });

    // Find the first English logo or any logo if no English one exists
    // that has an aspect ratio between 1.5 and 1.85 (banner-like)
    const logo = response.logos?.find(
      (logo) => (logo.iso_639_1 === "en" || logo.iso_639_1 === null) && logo.aspect_ratio >= 1.5 && logo.aspect_ratio <= 1.85
    );

    if (logo) {
      return `https://image.tmdb.org/t/p/w500${logo.file_path}`;
    }
    return null;
  } catch (err) {
    handleTmdbError(err, `Error getting movie logo for ${movieId}`);
    return null;
  }
}

// Export the initialized instance getter
module.exports = {
  initMovieDb,
  getImdbId,
  getMovieDetails,
  getCollectionDetails,
  getCollectionIDsFromMovieIDs,
  getGenres,
  getLogo,
  handleTmdbError,
};
