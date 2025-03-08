const getManifest = require("../manifest");
const { getCollectionDetails, getImdbId } = require("./getTmdb");
const { cacheWrapCollectionDetails } = require("./cache");
const { getCinemetaMovieMeta } = require("./getCinemeta");

async function processCollectionDetails(collectionId) {
  return cacheWrapCollectionDetails(collectionId, async () => {
    const manifest = await getManifest();
    const collectionPrefix = manifest.idPrefixes[0];

    const collectionDetails = await getCollectionDetails(collectionId);
    // Return null if collection not found or has no parts
    if (!collectionDetails || !collectionDetails.parts || collectionDetails.parts.length === 0) {
      return null;
    }

    const parts = collectionDetails.parts;
    let releasedParts = parts.filter((movie) => movie.release_date && movie.popularity && new Date(movie.release_date) < new Date());
    const imdbIds = await Promise.all(parts.map((movie) => getImdbId(movie.id)));

    // Return parts if no released parts found (probably due to missing data)
    if (releasedParts.length === 0) {
      releasedParts = parts;
    }

    // Fetch Cinemeta metadata for each movie part
    const cinemetaData = await Promise.all(
      imdbIds.slice(0, releasedParts.length).map((imdbId) => {
        if (imdbId) {
          return getCinemetaMovieMeta(imdbId);
        }
        return Promise.resolve(null);
      })
    );

    const lastMovieMeta = cinemetaData[cinemetaData.length - 1];

    if (!lastMovieMeta || !imdbIds) {
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
      genres: [...new Set(cinemetaData.reverse().flatMap((meta) => meta?.genres || []))], //get all genres from all movies
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
      poster: `https://image.tmdb.org/t/p/w500${collectionDetails.poster_path || parts[0].poster_path || parts[1]?.poster_path}`,
      background: `https://image.tmdb.org/t/p/original${collectionDetails.backdrop_path || parts[0].backdrop_path || parts[1]?.backdrop_path}`,
      description: collectionDetails.overview,
      videos: parts.map((movie, index) => ({
        id: imdbIds[index] || "",
        title: movie.title,
        released: (movie.release_date ? movie.release_date : "9999-01-01") + "T00:00:00.000Z",
        season: 1,
        episode: index + 1,
        overview: movie.overview,
        thumbnail: `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`,
      })),
    };
  });
}

module.exports = { processCollectionDetails };
