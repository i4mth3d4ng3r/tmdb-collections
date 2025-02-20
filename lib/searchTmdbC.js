const { initMovieDb, getCollectionIDsFromMovieIDs } = require("./getTmdb");
let moviedb = null;
(async () => (moviedb = await initMovieDb()))();

async function searchMovies(query) {
  try {
    const maxResults = 99;
    const maxPages = 6;

    // First, fetch page 1 to get total pages
    const firstPageResponse = await moviedb.searchMovie({ query, page: 1 });

    if (!firstPageResponse.results || firstPageResponse.results.length === 0) {
      return new Set();
    }

    let allMovieIds = new Set(firstPageResponse.results.map((movie) => movie.id));
    const totalPages = Math.min(firstPageResponse.total_pages, maxPages);

    if (totalPages > 1) {
      // Prepare promises for remaining pages
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(moviedb.searchMovie({ query, page }));
      }

      // Fetch all remaining pages in parallel
      const remainingPagesResults = await Promise.all(pagePromises);

      // Add results from all pages
      remainingPagesResults.forEach((response) => {
        if (response.results && response.results.length > 0) {
          response.results.forEach((movie) => allMovieIds.add(movie.id));
        }
      });
    }

    // Convert to array, slice to max results, and back to Set
    return new Set([...allMovieIds].slice(0, maxResults));
  } catch (err) {
    console.error(`Movie search: ${err.response?.status} - ${err.response?.data?.status_message}`);
    return new Set();
  }
}

async function searchCollections(query) {
  try {
    const maxResults = 50;
    const maxPages = 6;

    // First, fetch page 1 to get total pages
    const firstPageResponse = await moviedb.searchCollection({ query, page: 1 });

    if (!firstPageResponse.results || firstPageResponse.results.length === 0) {
      return new Set();
    }

    let allCollectionIds = new Set(firstPageResponse.results.map((collection) => collection.id));
    const totalPages = Math.min(firstPageResponse.total_pages, maxPages);

    if (totalPages > 1) {
      // Prepare promises for remaining pages
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(moviedb.searchCollection({ query, page }));
      }

      // Fetch all remaining pages in parallel
      const remainingPagesResults = await Promise.all(pagePromises);

      // Add results from all pages
      remainingPagesResults.forEach((response) => {
        if (response.results && response.results.length > 0) {
          response.results.forEach((collection) => allCollectionIds.add(collection.id));
        }
      });
    }

    // Convert to array, slice to max results, and back to Set
    return new Set([...allCollectionIds].slice(0, maxResults));
  } catch (err) {
    console.error("Error during collection search:", err);
    return new Set();
  }
}

async function searchMoviesByPerson(query) {
  try {
    // Search for person
    const personResponse = await moviedb.searchPerson({ query });

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
    console.error(`Person search: ${err.response?.status} - ${err.response?.data?.status_message}`);
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

    return [...allCollectionIds];
  } catch (error) {
    console.error("Error during search:", error);
    return [];
  }
}

module.exports = {
  getSearch,
  searchCollections,
};
