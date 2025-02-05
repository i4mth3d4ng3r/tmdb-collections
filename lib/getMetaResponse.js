const { getFanart } = require("./getFanart");
const { processCollectionDetails } = require("./processCollectionDetails");
const { cacheWrapCollectionDetails } = require("./cache");

async function getMetaResponse(req) {
  console.log("requested metadata for", req.params.type, "and id", req.params.id);
  const collectionId = req.params.id.split(".")[1];

  // Get the base collection
  const collection = await processCollectionDetails(collectionId);

  // Get or create fanart movie thumbnails mappings from cache
  const fanartMappings = await cacheWrapCollectionDetails(`${collectionId}_fanart`, async () => {
    // Create minimal fanart mappings
    const mappings = await Promise.all(
      collection.videos.map(async (video) => {
        if (video.id) {
          const fanartUrl = await getFanart(video.id);
          return {
            id: video.id,
            thumbnail: fanartUrl || video.thumbnail, // fallback to original thumbnail
          };
        }
        return null;
      })
    );
    return mappings.filter(Boolean); // Remove null entries
  });

  // Apply fanart mappings to collection
  collection.videos = collection.videos.map((video) => {
    if (video.id) {
      const fanartData = fanartMappings.find((m) => m.id === video.id);
      if (fanartData) {
        return { ...video, thumbnail: fanartData.thumbnail };
      }
    }
    return video;
  });

  return { meta: collection };
}

module.exports = getMetaResponse;
