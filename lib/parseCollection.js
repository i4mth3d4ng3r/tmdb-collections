const getManifest = require("../manifest");

async function parseCollection(collection, firstMovie, imdbIds) {
  const manifest = await getManifest();
  const collectionPrefix = manifest.idPrefixes[0];

  if (!collection || !firstMovie || !imdbIds) {
    return null;
  }

  const parts = collection.parts;
  const releasedParts = parts.filter((movie) => movie.release_date && movie.popularity && new Date(movie.release_date) < new Date());

  return {
    id: collectionPrefix + collection.id.toString(),
    type: "movie",
    name: collection.name,
    latestReleaseDate: new Date(releasedParts[0].release_date), // for collections sorting
    popularity: releasedParts.reduce((sum, movie) => sum + (movie.popularity || 0), 0) / releasedParts.length, // for collections sorting
    rating:
      releasedParts.reduce((sum, movie) => {
        const voteCount = movie.vote_count || 0;
        const voteAverage = movie.vote_average || 0;
        return sum + voteCount * voteAverage;
      }, 0) / releasedParts.reduce((sum, movie) => sum + (movie.vote_count || 0), 0) || 0, // for collections sorting
    director: firstMovie.credits?.crew?.filter((person) => person.job === "Director")?.map((director) => director.name) || [],
    cast: firstMovie.credits?.cast?.slice(0, 10)?.map((actor) => actor.name) || [],
    genres: firstMovie.genres?.map((genre) => genre.name) || [],
    releaseInfo: `${new Date(parts[parts.length - 1].release_date).getFullYear()}-${
      new Date(parts[0].release_date).getFullYear() || new Date(parts[1].release_date).getFullYear() + " (New part soon)"
    }`,
    poster: `https://image.tmdb.org/t/p/w500${collection.poster_path || parts[parts.length - 1].poster_path || parts[parts.length - 2].poster_path}`,
    background: `https://image.tmdb.org/t/p/original${collection.backdrop_path || parts[parts.length - 1].backdrop_path || parts[parts.length - 2].backdrop_path}`,
    description: collection.overview,
    videos: parts.map((movie, index) => ({
      id: imdbIds[index],
      title: movie.title,
      released: movie.release_date + "T00:00:00.000Z",
      season: 1,
      episode: index + 1,
      overview: movie.overview,
      thumbnail: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    })),
  };
}

module.exports = { parseCollection };
