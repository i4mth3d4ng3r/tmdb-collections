const configDefaults = {
  language: "en",
  catalogList: ["popular", "topRated", "newReleases"],
  discoverOnly: { popular: false, topRated: false, newReleases: false },
  enableSearch: true,
  enableAdultContent: false,
};

// Parse configuration from URL
function parseConfig(config) {
  try {
    const configParsed = JSON.parse(config);
    return { ...configDefaults, ...configParsed };
  } catch (error) {
    // console.error("Error parsing config JSON:", error.message);
    return { ...configDefaults }; // Return defaults if parsing fails
  }
}

module.exports = { parseConfig };
