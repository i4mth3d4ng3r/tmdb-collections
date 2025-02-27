const { cacheWrapMovieDetails } = require("./cache");

// Initialize ky module at the top level with dynamic import (ESM)
let ky;
(async () => {
  ({ default: ky } = await import("ky")); //ESM support only
})();

async function getCinemetaMovieMeta(imdbId, type = "movie") {
  return cacheWrapMovieDetails(imdbId, async () => {
    try {
      const response = await ky.get(`https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`, {
        retry: {
          limit: 3,
          onRetry: (retry) => {},
        },
        hooks: {
          beforeRetry: [
            async ({ request, options, error, retryCount }) => {
              console.error(`Retry no. ${retryCount} for ${imdbId}, error: ${error}, options: ${options}`);
            },
          ],
        },
        timeout: 10000, //timeout of all retries combined
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
    }
  });
}

// Example of another function that could use ky
async function getOtherData(param) {
  try {
    const response = await ky.get(`https://some-api.com/${param}`);
    return response.json();
  } catch (error) {
    console.error(`Error fetching other data: ${error}`);
  }
}

module.exports = { getCinemetaMovieMeta, getOtherData };
