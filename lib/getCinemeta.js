const { cacheWrapMovieDetails } = require("./cache");

// Initialize ky module
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
        retry: 3,
        timeout: 3 * 60 * 1000, //timeout of all retries combined
        hooks: {
          beforeRetry: [
            async ({ request, options, error, retryCount }) => {
              console.error(`Retry no. ${retryCount} for ${imdbId}, error: ${error}`);
            },
          ],
        },
      });

      if (!response.ok) {
        console.error(`Cinemeta response not ok: ${imdbId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Cinemeta response not JSON: ${imdbId}: ${contentType}`);
        console.log("Response:", await response.text());
        return null;
      }
      const data = await response.json();
      return data.meta;
    } catch (error) {
      console.error(`Error fetching data from Cinemeta: ${imdbId}: ${error}`);
      return null;
    }
  });
}

module.exports = { getCinemetaMovieMeta };
