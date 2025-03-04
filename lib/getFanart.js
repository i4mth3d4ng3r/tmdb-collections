require("dotenv").config();
const fanart = new (require("fanart.tv"))(process.env.FANART_API_KEY);

async function getFanart(ID, imageType) {
  //ID = imdbId or tmdbId
  try {
    const data = await fanart.movies.get(ID);

    // Return null if no data or no images of specified type
    if (!data || !data[imageType] || !data[imageType].length) {
      return null;
    }

    // Filter English images and sort by likes
    const englishImages = data[imageType].filter((img) => img.lang === "en").sort((a, b) => parseInt(b.likes) - parseInt(a.likes));

    // Return the URL of the most liked English image, or null if none found
    return englishImages.length > 0 ? englishImages[0].url : null;
  } catch (error) {
    if (!error.message.includes("404")) {
      //404 = not found
      console.error(`Error getting fanart for ${ID} (${imageType}): ${error}`);
    }
    return null;
  }
}

module.exports = { getFanart };
