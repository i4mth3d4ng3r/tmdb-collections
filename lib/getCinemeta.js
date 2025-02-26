const { cacheWrapMovieDetails } = require("./cache");
const fetch = require("node-fetch-retry");

async function getCinemetaMovieMeta(imdbId, type = "movie") {
  return cacheWrapMovieDetails(imdbId, async () => {
    try {
      const response = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`, {
        method: "GET",
        retry: 3,
        pause: 1000,
      });
      if (!response.ok) {
        console.error(`Cinemeta response not ok: ${response.status} ${response.statusText}`);
        return null;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Cinemeta response not JSON: ${contentType}`);
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

module.exports = { getCinemetaMovieMeta };
