const url = require("url");

// Parse configuration from URL
const parseConfig = function (req) {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split("/");

  // Configuration can be in the format: /[config]/manifest.json
  let config = {};

  // Check if there's a potential config segment in the URL
  if (pathParts.length > 2 && pathParts[1] !== "catalog" && pathParts[1] !== "meta" && pathParts[1] !== "configure") {
    try {
      // Try to parse as JSON if it's URL encoded
      const configStr = decodeURIComponent(pathParts[1]);
      if (configStr) {
        try {
          config = JSON.parse(configStr);
        } catch (e) {
          // If not valid JSON, try to parse as query string
          const params = new URLSearchParams(configStr);
          params.forEach((value, key) => {
            // Convert string "true"/"false" to boolean
            if (value === "true") config[key] = true;
            else if (value === "false") config[key] = false;
            else config[key] = value;
          });
        }
      }
    } catch (e) {
      console.error("Error parsing config:", e);
    }
  }

  return config;
};

module.exports = { parseConfig };
