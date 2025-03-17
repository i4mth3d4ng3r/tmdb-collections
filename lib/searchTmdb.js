const { initMovieDb, getCollectionIDsFromMovieIDs, handleTmdbError } = require("./getTmdb");
let moviedb = null;
(async () => (moviedb = await initMovieDb()))();

async function searchMovies(query) {
  try {
    const maxResults = 50;
    const maxPages = 4;

    // First, fetch page 1 to get total pages
    const firstPageResponse = await moviedb.searchMovie({
      query,
      page: 1,
    });

    if (!firstPageResponse.results || firstPageResponse.results.length === 0) {
      return new Set();
    }

    let allMovieIds = new Set(firstPageResponse.results.map((movie) => movie.id));

    // If we have enough results from first page, return early
    if (allMovieIds.size >= maxResults) {
      return new Set([...allMovieIds].slice(0, maxResults));
    }

    const totalPages = Math.min(firstPageResponse.total_pages, maxPages);

    if (totalPages > 1) {
      // Sequential fetching instead of parallel to prevent timeouts
      for (let page = 2; page <= totalPages; page++) {
        try {
          const response = await moviedb.searchMovie({
            query,
            page,
          });
          if (response.results && response.results.length > 0) {
            response.results.forEach((movie) => allMovieIds.add(movie.id));
          }
          // If we have enough results, break early
          if (allMovieIds.size >= maxResults) break;
        } catch (err) {
          handleTmdbError(err, `Error during movie search page ${page} for ${query}:`);
          break; // Stop on first error
        }
      }
    }

    // Convert to array, slice to max results, and back to Set
    return new Set([...allMovieIds].slice(0, maxResults));
  } catch (err) {
    handleTmdbError(err, `Error during movie search for ${query}:`);
    return new Set();
  }
}

async function searchCollections(query) {
  try {
    const maxResults = 15;
    const maxPages = 3;

    // First, fetch page 1 to get total pages
    const firstPageResponse = await moviedb.searchCollection({
      query,
      page: 1,
    });

    if (!firstPageResponse.results || firstPageResponse.results.length === 0) {
      return new Set();
    }

    let allCollectionIds = new Set(firstPageResponse.results.map((collection) => collection.id));

    // If we have enough results from first page, return early
    if (allCollectionIds.size >= maxResults) {
      return new Set([...allCollectionIds].slice(0, maxResults));
    }

    const totalPages = Math.min(firstPageResponse.total_pages, maxPages);

    if (totalPages > 1) {
      // Sequential fetching instead of parallel to prevent timeouts
      for (let page = 2; page <= totalPages; page++) {
        try {
          const response = await moviedb.searchCollection({
            query,
            page,
          });
          if (response.results && response.results.length > 0) {
            response.results.forEach((collection) => allCollectionIds.add(collection.id));
          }
          // If we have enough results, break early
          if (allCollectionIds.size >= maxResults) break;
        } catch (err) {
          handleTmdbError(err, `Error during collection search page ${page} for ${query}:`);
          break; // Stop on first error
        }
      }
    }

    // Convert to array, slice to max results, and back to Set
    return new Set([...allCollectionIds].slice(0, maxResults));
  } catch (err) {
    handleTmdbError(err, `Error during collection search for ${query}:`);
    return new Set();
  }
}

async function searchMoviesByPerson(query) {
  try {
    // First, search for the person
    const personResponse = await moviedb.searchPerson({
      query,
    });

    if (!personResponse.results || personResponse.results.length === 0) {
      return new Set();
    }

    // Get first person's movie credits
    const personId = personResponse.results[0].id;
    const creditsResponse = await moviedb.personMovieCredits({ id: personId });

    if (!creditsResponse) {
      return new Set();
    }

    // Sort cast by popularity and get top 100 movies, then combine with crew
    return new Set([
      ...creditsResponse.cast
        // .sort((a, b) => b.popularity - a.popularity)
        // .slice(0, 100)
        .map((movie) => movie.id),
      ...creditsResponse.crew.filter((crew) => crew.department === "Writing" || crew.department === "Directing").map((movie) => movie.id),
    ]);
  } catch (err) {
    // Include the error stack to see where the error occurred
    const errorLocation = err.stack ? err.stack.split("\n")[1] : "unknown location";
    handleTmdbError(err, `Error during person search for ${query} at ${errorLocation}:`);
    return new Set();
  }
}

async function getSearch(query) {
  try {
    // Run all searches in parallel
    const [directCollectionIds, personMovieIds] = await Promise.all([searchCollections(query), searchMoviesByPerson(query)]);

    // Get collection IDs from person's movies if any were found
    let movieCollectionIdsByPerson = new Set();
    if (personMovieIds.size > 0) {
      //   console.log("Searched person found");
      movieCollectionIdsByPerson = await getCollectionIDsFromMovieIDs([...personMovieIds]);
    } else {
      new Set();
    }

    // Combine initial collection IDs
    let allCollectionIds = new Set([...directCollectionIds, ...movieCollectionIdsByPerson]);
    // const allCollectionIds = await searchCollections(query);

    // If no collections found, search movies and check their collections
    // takes a long time with every search, with only a little more results, but makes sense to search by movies, when other searches fail
    if (allCollectionIds.size === 0) {
      const movieIds = await searchMovies(query);
      if (movieIds.size > 0) {
        const movieCollectionIds = await getCollectionIDsFromMovieIDs([...movieIds]);
        allCollectionIds = new Set([...movieCollectionIds]);
      }
    }

    return [...allCollectionIds].slice(0, 20); // limit for performance...more than 20 collections is needed only if the search is too wide
  } catch (err) {
    handleTmdbError(err, `Error during search: ${query}:`);
    return [];
  }
}

module.exports = {
  getSearch,
  searchCollections,
};
