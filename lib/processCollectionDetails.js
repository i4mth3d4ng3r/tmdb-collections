const getManifest = require("./getManifest");
const { getCollectionDetails, getMovieDetails } = require("./getTmdb");
const { cacheWrapCollectionDetails } = require("./cache");
const { getCinemetaMovieMeta } = require("./getCinemeta");

async function processCollectionDetails(collectionId, config) {
  const manifest = await getManifest(config);
  const collectionPrefix = manifest.idPrefixes[0];

  // Get the cached collection
  const cachedCollection = await cacheWrapCollectionDetails(collectionId, async () => {
    const collectionDetails = await getCollectionDetails(collectionId);
    // Return null if collection not found or has no parts
    if (!collectionDetails || !collectionDetails.parts || collectionDetails.parts.length === 0) {
      return null;
    }

    const parts = collectionDetails.parts;
    let releasedParts = parts.filter((movie) => movie.release_date && movie.popularity && new Date(movie.release_date) < new Date());
    const moviesDetails = await Promise.all(parts.map((movie) => getMovieDetails(movie.id)));

    // Return parts if no released parts found (probably due to missing data)
    if (releasedParts.length === 0) {
      releasedParts = parts;
    }

    // Fetch Cinemeta metadata for each movie part, mainly for imdb ratings
    const cinemetaData = await Promise.all(
      moviesDetails.slice(0, releasedParts.length).map((movie) => {
        if (movie?.imdb_id) {
          return getCinemetaMovieMeta(movie.imdb_id);
        }
        return Promise.resolve(null);
      })
    );

    const lastMovieMeta = cinemetaData[cinemetaData.length - 1];

    if (!lastMovieMeta || !moviesDetails) {
      return null;
    }

    return {
      id: collectionPrefix + collectionDetails.id.toString(),
      type: "movie",
      name: collectionDetails.name,
      adult: parts.some((movie) => movie.adult === true), //used to filter out some collections if set in config
      imdbRating: (
        cinemetaData.filter((meta) => meta && meta.imdbRating).reduce((sum, meta) => sum + parseFloat(meta.imdbRating), 0) /
        cinemetaData.filter((meta) => meta && meta.imdbRating).length
      ).toFixed(1),
      latestReleaseDate: new Date(releasedParts[releasedParts.length - 1].release_date),
      popularity: releasedParts.reduce((sum, movie) => sum + (movie.popularity || 0), 0) / releasedParts.length,
      genres: [...new Set(releasedParts.reverse().flatMap((movie) => movie.genre_ids || []))], //get all genres from all movies
      director: [...new Set(cinemetaData.reverse().flatMap((meta) => meta?.director || []))], //get all directors from all movies
      cast: [
        ...new Set(
          cinemetaData
            .reverse() // Reverse to start with newest movies
            .flatMap((meta) => meta?.cast || [])
        ),
      ].slice(0, 20), // Get cast from all movies(max 3 people/mainCharacters per movie), prioritizing newer movies
      // links: lastMovieMeta?.links || [],, //links functionality not implemented yet in Stremio, for the future --> cinemetaData also includes links
      trailers: lastMovieMeta.trailers || [], //only one trailer works, so there is no need to get all trailers
      releaseInfo: `${new Date(parts[0].release_date).getFullYear()}-${
        new Date(parts[parts.length - 1].release_date).getFullYear() +
          (new Date(parts[parts.length - 1]?.release_date) > new Date() ? " (New part soon)" : null) || //if released date of the last part known and is in the future, add " (New part soon)"
        new Date(releasedParts[releasedParts.length - 1].release_date).getFullYear() + " (New part soon)" //if released date of the last part unknown, add " (New part soon)"
      }`,
      poster: collectionDetails.poster_path,
      background: `https://image.tmdb.org/t/p/original${collectionDetails.backdrop_path || parts[0].backdrop_path || parts[1]?.backdrop_path}`,
      description: collectionDetails.overview,
      videos: parts.map((movie, index) => ({
        id: moviesDetails.find((movieDetails) => movieDetails?.id === movie.id)?.imdb_id || "",
        tmdbId: movie.id,
        title: movie.title,
        released: (movie.release_date ? movie.release_date : "9999-01-01") + "T00:00:00.000Z",
        season: 1,
        episode: index + 1,
        overview: movie.overview,
        poster: movie.poster_path, //just as alternative for collections with no posters...treated below
        thumbnail: movie.backdrop_path,
      })),
      translations: collectionDetails.translations.translations
        .filter((translation) => translation.iso_639_1 !== "en" && (translation.data.overview?.trim() || translation.data.title?.trim())) //filter out english translations, they are returned in collection by default
        .map((translation) => ({
          iso_639_1: translation.iso_639_1,
          description: translation.data.overview,
          title: translation.data.title,
        })),
      posters: collectionDetails.images.posters
        .filter((image) => image.iso_639_1 !== "en" && image.iso_639_1?.trim() && image.file_path) //filter out english posters, they are returned in collection by default
        .map((image) => ({
          iso_639_1: image.iso_639_1,
          poster: image.file_path,
          // aspect_ratio: image.aspect_ratio,
          vote_average: image.vote_average,
        })),
    };
  });

  //******************************************* out of cache part *************************************************
  if (!cachedCollection) {
    return null;
  }

  // Create a new object with shallow copies of the properties we'll modify
  // This preserves the cached object while allowing modifications to the returned object
  // const collection = {
  //   ...cachedCollection,
  //   // Deep clone only the arrays that will be modified
  //   genres: [...cachedCollection.genres],
  //   videos: [...cachedCollection.videos],
  // };

  // Create an empty object that will hold only the modified properties
  // All other properties will be accessed directly from cachedCollection
  const collection = {};

  // Set non-enumerable getter for any property not explicitly defined
  // This creates a property access fallback (references) to the cached collection = memory efficient
  // getters are executed on JSON serialization when response is being sent
  Object.keys(cachedCollection).forEach((key) => {
    // Only define getters for properties we don't plan to modify
    if (!["name", "description", "genres", "videos", "poster"].includes(key)) {
      Object.defineProperty(collection, key, {
        get: function () {
          return cachedCollection[key];
        },
        enumerable: true,
      });
    }
  });

  // Explicitly deep copy only properties we'll modify and do not want to modify the cached collection
  collection.name = cachedCollection.name;
  collection.description = cachedCollection.description;
  collection.poster = cachedCollection.poster;
  collection.genres = [...cachedCollection.genres];
  collection.videos = [...cachedCollection.videos];

  //apply chosen language to collection
  collection.name = collection.translations.filter((translation) => translation.iso_639_1 === config.language)[0]?.title || collection.name;
  collection.description =
    collection.translations.filter((translation) => translation.iso_639_1 === config.language)[0]?.description || collection.description;
  collection.genres = collection.genres.map((genre) => manifest.genres.find((g) => g.id === genre).name);
  collection.videos = await Promise.all(
    collection.videos.map(async (video) => {
      const movieDetails = await getMovieDetails(video.tmdbId); //should be already cached
      return {
        ...video,
        title: movieDetails?.translations.filter((translation) => translation.iso_639_1 === config.language)[0]?.title || video.title,
        overview: movieDetails?.translations.filter((translation) => translation.iso_639_1 === config.language)[0]?.description || video.overview,
        poster:
          movieDetails?.posters //just as alternative for collections with no posters
            .filter((poster) => poster.iso_639_1 === config.language)
            .sort((a, b) => b.vote_average - a.vote_average)[0]?.poster || video.poster,
      };
    })
  );
  collection.poster =
    "https://image.tmdb.org/t/p/w500" +
    (collection.posters //must be set after collection.videos
      .filter((poster) => poster.iso_639_1 === config.language)
      .sort((a, b) => b.vote_average - a.vote_average)[0]?.poster ||
      collection.poster || //english poster
      collection.videos[0]?.poster ||
      collection.videos[1]?.poster);

  //remove unnecessary data from collection
  delete collection.translations;
  delete collection.posters;

  return collection;
}

module.exports = { processCollectionDetails };
