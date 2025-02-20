const { getFanart } = require("./getFanart");
const { getLogo } = require("./getTmdb");
const { processCollectionDetails } = require("./processCollectionDetails");
const { cacheWrapCollectionDetails } = require("./cache");

async function getMetaResponse(req) {
  console.log("requested metadata for", req.params.type, "and id", req.params.id);
  const collectionId = req.params.id.split(".")[1];

  // Return null if collectionId is not a valid number
  // meta for 'tmdb:' prefix used in tmdb-addon sometimes requested, which causes an server crash (strange, because while testing, prefix filtering works)
  if (!collectionId || isNaN(collectionId)) {
    return { meta: [] };
  }

  // Get the base collection
  const collection = await processCollectionDetails(collectionId);

  // somehow are requested collections IDs which exist in the collections list, but not in collection details API endpoint, even though getCatalogRespons should not return these collections
  if (!collection) {
    return { meta: [] };
  }

  // Get or create movie thumbnails mappings from cache
  const movieThumbnailsMappings = await cacheWrapCollectionDetails(`movieThumbnails:${collectionId}`, async () => {
    const mappings = await Promise.all(
      collection.videos.map(async (video) => {
        if (video.id) {
          let thumnbailUrl = await getFanart(video.id); // get fanart
          if (!thumnbailUrl) {
            thumnbailUrl = await getLogo(video.id); //...or get logo
          }
          return {
            id: video.id,
            thumbnail: thumnbailUrl || video.thumbnail, // fallback to original thumbnail
          };
        }
        return null;
      })
    );
    return mappings.filter(Boolean); // Remove null entries
  });

  // Apply thumbnail mappings to collection
  collection.videos = collection.videos.map((video) => {
    if (video.id) {
      const movieThumbnailsData = movieThumbnailsMappings.find((m) => m.id === video.id);
      if (movieThumbnailsData) {
        return { ...video, thumbnail: movieThumbnailsData.thumbnail };
      }
    }
    return video;
  });

  return { meta: collection };
}

module.exports = getMetaResponse;
