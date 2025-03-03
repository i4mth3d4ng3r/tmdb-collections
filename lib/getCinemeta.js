const { cacheWrapMovieDetails } = require("./cache");

// Initialize ky module dynamically (ESM)
let ky;
const initKy = async () => {
  if (!ky) {
    const kyModule = await import("ky");
    ky = kyModule.default;
  }
  return ky;
};

async function getCinemetaMovieMeta(imdbId, type = "movie") {
  // Ensure ky is initialized
  ky = await initKy();

  return cacheWrapMovieDetails(imdbId, async () => {
    try {
      // const response = await ky.get(`https://httpstat.us/504`, {
      const response = await ky.get(`https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`, {
        retry: 5, //after 3 days of testing, max 3 retries were needed
        timeout: 3 * 60 * 1000, //timeout of all retries combined
        // hooks: {
        //   beforeRetry: [
        //     async ({ request, options, error, retryCount }) => {
        //       console.error(`Cinemeta retry no. ${retryCount} for ${imdbId}, error: ${error}`);
        //     },
        //   ],
        // },
      });

      const data = await response.json();
      return data.meta;
    } catch (error) {
      if (!error.message.includes("404")) {
        console.error(`Error fetching data from Cinemeta: ${imdbId}: ${error}`);
      }
      return null;
    }
  });
}

module.exports = { getCinemetaMovieMeta };
