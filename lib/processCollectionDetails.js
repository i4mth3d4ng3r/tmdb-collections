const getManifest = require("../manifest");
const { getCollectionDetails, getMovieDetails, getImdbId } = require("./getTmdb");
const { cacheWrapCollectionDetails } = require("./cache");

async function processCollectionDetails(collectionId) {
  return cacheWrapCollectionDetails(collectionId, async () => {
    const manifest = await getManifest();
    const collectionPrefix = manifest.idPrefixes[0];

    const collectionDetails = await getCollectionDetails(collectionId);
    // Return null if collection not found or has no parts
    if (!collectionDetails || !collectionDetails.parts || collectionDetails.parts.length === 0) {
      return null;
    }

    const firstMovieDetails = await getMovieDetails(collectionDetails.parts[0].id);
    const imdbIds = await Promise.all(collectionDetails.parts.map((movie) => getImdbId(movie.id)));

    if (!firstMovieDetails || !imdbIds) {
      return null;
    }

    const parts = collectionDetails.parts;
    const releasedParts = parts.filter((movie) => movie.release_date && movie.popularity && new Date(movie.release_date) < new Date());

    return {
      id: collectionPrefix + collectionDetails.id.toString(),
      type: "movie",
      name: collectionDetails.name,
      latestReleaseDate: new Date(releasedParts[releasedParts.length - 1]?.release_date || 0), // for collections sorting
      popularity: releasedParts.reduce((sum, movie) => sum + (movie.popularity || 0), 0) / releasedParts.length, // for collections sorting
      rating:
        releasedParts.reduce((sum, movie) => {
          const voteCount = movie.vote_count || 0;
          const voteAverage = movie.vote_average || 0;
          return sum + voteCount * voteAverage;
        }, 0) / releasedParts.reduce((sum, movie) => sum + (movie.vote_count || 0), 0) || 0, // for collections sorting
      director: firstMovieDetails.credits?.crew?.filter((person) => person.job === "Director")?.map((director) => director.name) || [],
      cast: firstMovieDetails.credits?.cast?.slice(0, 10)?.map((actor) => actor.name) || [],
      genres: firstMovieDetails.genres?.map((genre) => genre.name) || [],
      releaseInfo: `${new Date(parts[0].release_date).getFullYear()}-${
        new Date(parts[parts.length - 1].release_date).getFullYear() ||
        new Date(releasedParts[releasedParts.length - 1].release_date).getFullYear() + " (New part soon)"
      }`,
      poster: `https://image.tmdb.org/t/p/w500${collectionDetails.poster_path || parts[0].poster_path || parts[1].poster_path}`,
      background: `https://image.tmdb.org/t/p/original${collectionDetails.backdrop_path || parts[0].backdrop_path || parts[1].backdrop_path}`,
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
