const { initMovieDb, getCollectionIDsFromMovieIDs } = require("./getTmdb");
let moviedb = null;
(async () => (moviedb = await initMovieDb()))();

async function discoverCollections(parameters, fromPage = 1, toPage = 5) {
  try {
    // 1. Fetch movies from all pages in parallel
    const pagePromises = [];
    for (let page = fromPage; page <= toPage; page++) {
      pagePromises.push(
        moviedb.discoverMovie({ ...parameters, page }).catch((err) => {
          console.error(`Discover page ${page}: ${err.response?.status} - ${err.response?.data?.status_message}`);
          return { results: [] };
        })
      );
    }

    const pagesResults = await Promise.all(pagePromises);

    // Collect all movie IDs
    const movieIds = new Set(pagesResults.flatMap((response) => (response.results ? response.results.map((movie) => movie.id) : [])));

    if (movieIds.size === 0) {
      return [];
    }

    // 2. Split movie IDs into chunks for parallel processing
    const chunkSize = 20; // Process 20 movies at a time
    const movieIdChunks = [...movieIds].reduce((chunks, id, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
      chunks[chunkIndex].push(id);
      return chunks;
    }, []);

    // Process each chunk in parallel
    const chunkPromises = movieIdChunks.map((chunk) => getCollectionIDsFromMovieIDs(chunk));

    const chunkResults = await Promise.all(chunkPromises);

    // 3. Combine all collection IDs into a single unique set
    const allCollectionIds = new Set(chunkResults.flatMap((collectionIds) => [...collectionIds]));

    return [...allCollectionIds];
  } catch (err) {
    console.error(`Discover: ${err.response?.status} - ${err.response?.data?.status_message}`);
    return [];
  }
}

async function discoverXCollections(parameters, minCollections = 30, maxPage = 20) {
  try {
    const PAGE_CHUNK = 5; // Number of pages to fetch in each attempt
    let collections = [];
    let currentStartPage = 1;

    while (collections.length < minCollections && currentStartPage <= maxPage) {
      const endPage = Math.min(currentStartPage + PAGE_CHUNK - 1, maxPage);

      console.log(`Fetching collections from pages ${currentStartPage} to ${endPage}`);
      const newCollections = await discoverCollections(parameters, currentStartPage, endPage);

      // Add new unique collections
      collections = [...new Set([...collections, ...newCollections])];

      // If no new collections found, break to avoid unnecessary requests
      if (newCollections.length === 0) break;

      currentStartPage = endPage + 1;
    }

    return collections;
  } catch (err) {
    console.error(`Extended discover: ${err.response?.status} - ${err.response?.data?.status_message}`);
    return [];
  }
}

module.exports = {
  discoverCollections,
  discoverXCollections,
};
