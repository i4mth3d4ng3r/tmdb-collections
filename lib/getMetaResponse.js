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

  // Get both collection logo and thumbnails in parallel and cache them
  const [collectionLogo, movieThumbnailsMappings] = await Promise.all([
    cacheWrapCollectionDetails(`collectionLogo:${collectionId}`, async () => {
      return await getFanart(collectionId, "hdmovielogo");
    }),
    cacheWrapCollectionDetails(`movieThumbnails:${collectionId}`, async () => {
      const mappings = await Promise.all(
        collection.videos.map(async (video) => {
          if (video.id) {
            let thumbnailUrl = await getFanart(video.id, "moviethumb"); // get fanart
            if (!thumbnailUrl) {
              thumbnailUrl = await getLogo(video.id); //...or get logo
            }
            return {
              id: video.id,
              thumbnail: thumbnailUrl || video.thumbnail, // fallback to original thumbnail
            };
          }
          return null;
        })
      );
      return mappings.filter(Boolean); // Remove null entries
    }),
  ]);

  // Set collection logo if there is one from fanart
  if (collectionLogo) {
    collection.logo = collectionLogo;
  }

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
