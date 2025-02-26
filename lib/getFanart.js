require("dotenv").config();
const fanart = new (require("fanart.tv"))(process.env.FANART_API_KEY);

async function getFanart(imdbId) {
  try {
    const data = await fanart.movies.get(imdbId);

    // Return null if no data or no moviethumb
    if (!data || !data.moviethumb || !data.moviethumb.length) {
      return null;
    }

    // Filter English thumbs and sort by likes
    const englishThumbs = data.moviethumb.filter((thumb) => thumb.lang === "en").sort((a, b) => parseInt(b.likes) - parseInt(a.likes));

    // Return the URL of the most liked English thumb, or null if none found
    return englishThumbs.length > 0 ? englishThumbs[0].url : null;
  } catch (error) {
    if (!error.message.includes("404")) {
      //404 = not found
      console.error(`Error getting fanart for ${imdbId}: ${error}`);
    }
    return null;
  }
}

module.exports = { getFanart };
