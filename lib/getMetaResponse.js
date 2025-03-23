const { getFanart } = require("./getFanart");
const { getMovieDetails } = require("./getTmdb");
const { processCollectionDetails } = require("./processCollectionDetails");

async function getMetaResponse(req) {
  const config = req.config;
  const startTime = process.hrtime();
  const collectionId = req.params.id.split(".")[1];

  // Return null if collectionId is not a valid number
  // meta for 'tmdb:' prefix used in tmdb-addon sometimes requested, which causes an server crash (strange, because while testing, prefix filtering works)
  if (!collectionId || isNaN(collectionId)) {
    return { meta: [] };
  }

  // Get the base collection
  const collection = await processCollectionDetails(collectionId, config);

  // somehow are requested collection IDs which exist in the collections list, but not in collection details API endpoint, even though getCatalogRespons should not return these collections
  if (!collection) {
    return { meta: [] };
  }

  // Apply translations to movies in collection
  if (config.language !== "en") {
    // Apply translations
    collection.videos.forEach((video) => {
      // Find the translation for the configured language
      const translation = video.translations?.find((t) => t.iso_639_1 === config.language);

      // Apply translation if found
      if (translation) {
        video.title = translation.title || video.title;
        video.overview = translation.description || video.overview;
      }
    });
  }
  delete collection.videos.translations;

  // Get both collection logo and thumbnails in parallel and cache them
  const [collectionLogo, movieThumbnailsMappings] = await Promise.all([
    //get collection logo
    (async () => {
      return await getFanart(collectionId, "hdmovielogo").then((data) => {
        return data?.hdmovielogo
          ?.filter((logo) => {
            return data?.hdmovielogo?.some((l) => l.lang === config.language)
              ? logo.lang === config.language
              : logo.lang === "en" || logo.lang?.trim() === null;
          })
          ?.sort((a, b) => b.likes - a.likes)[0]?.url;
      });
    })(),

    //get collection movies thumbnails
    (async () => {
      const mappings = await Promise.all(
        collection.videos.map(async (video) => {
          if (video.id) {
            let thumbnailUrl = await getFanart(video.id, "moviethumb").then((data) => {
              return data?.moviethumb
                ?.filter((thumb) => {
                  return data.moviethumb?.some((t) => t.lang === config.language)
                    ? thumb.lang === config.language
                    : thumb.lang === "en" || thumb.lang?.trim() === null;
                })
                ?.sort((a, b) => b.likes - a.likes)[0]?.url; // get fanart
            });

            //fallback to logo or backdrop image if no fanart is found
            if (!thumbnailUrl) {
              thumbnailUrl = await getMovieDetails(video.tmdbId).then((data) => {
                return (
                  "https://image.tmdb.org/t/p/w780" +
                  (data.logos
                    ?.filter((logo) => {
                      return data.logos?.some((l) => l.iso_639_1 === config.language)
                        ? logo.iso_639_1 === config.language
                        : logo.iso_639_1 === "en" || logo.iso_639_1?.trim() === null;
                    })
                    ?.sort((a, b) => b.vote_average - a.vote_average)[0]?.logo || video.thumbnail)
                );
              });
            }

            return {
              id: video.id,
              thumbnail: thumbnailUrl,
            };
          }
          return null;
        })
      );
      return mappings.filter(Boolean); // Remove null entries
    })(),
  ]);

  // Set collection logo if there is one
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

  const endTime = process.hrtime(startTime);
  const milliseconds = endTime[0] * 1000 + endTime[1] / 1000000;
  console.log(
    `Metadata request for language ${config.language} and type ${req.params.type} and id ${req.params.id}\nfetching time: ${milliseconds.toFixed(
      2
    )}ms`
  );

  return { meta: collection };
}

module.exports = getMetaResponse;
