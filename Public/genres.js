const genres = [
  {
    id: 28,
    name: "Action",
  },
  {
    id: 12,
    name: "Adventure",
  },
  {
    id: 16,
    name: "Animation",
  },
  {
    id: 35,
    name: "Comedy",
  },
  {
    id: 80,
    name: "Crime",
  },
  {
    id: 99,
    name: "Documentary",
  },
  {
    id: 18,
    name: "Drama",
  },
  {
    id: 10751,
    name: "Family",
  },
  {
    id: 14,
    name: "Fantasy",
  },
  {
    id: 36,
    name: "History",
  },
  {
    id: 27,
    name: "Horror",
  },
  {
    id: 10402,
    name: "Music",
  },
  {
    id: 9648,
    name: "Mystery",
  },
  {
    id: 10749,
    name: "Romance",
  },
  {
    id: 878,
    name: "Science Fiction",
  },
  {
    id: 10770,
    name: "TV Movie",
  },
  {
    id: 53,
    name: "Thriller",
  },
  {
    id: 10752,
    name: "War",
  },
  {
    id: 37,
    name: "Western",
  },
];

//get all genres for all languages
// const fs = require("fs");
// const express = require("express");

// // Import languages array from languages.js
// const languages = require("./languages.js");

// // TMDB API configuration
// const TMDB_API_KEY = process.env.TMDB_API_KEY;
// const TMDB_API_URL = "https://api.themoviedb.org/3";

// async function getAllGenresForLanguages() {
//   const allGenres = {};

//   // Process each language
//   for (const lang of languages) {
//     try {
//       const response = await fetch(`${TMDB_API_URL}/genre/movie/list?api_key=257654f35e3dff105574f97fb4b97035&language=${lang.iso_639_1}`);

//       if (!response.ok) {
//         console.warn(`Failed to fetch genres for language ${lang.iso_639_1}: ${response.status}`);
//         continue;
//       }

//       const data = await response.json();
//       allGenres[lang.iso_639_1] = data.genres;

//       // Add a small delay to avoid hitting rate limits
//       await new Promise((resolve) => setTimeout(resolve, 250));

//       console.log(`Successfully fetched genres for ${lang.english_name} (${lang.iso_639_1})`);
//     } catch (error) {
//       console.error(`Error fetching genres for ${lang.iso_639_1}:`, error.message);
//     }
//   }

//   // Write results to file
//   try {
//     await fs.promises.writeFile("./Public/newGenres.js", `const genres = ${JSON.stringify(allGenres, null, 2)};\n\nmodule.exports = genres;`);
//     console.log("Successfully wrote genres to newGenres.js");
//   } catch (error) {
//     console.error("Error writing to file:", error);
//   }
// }

// getAllGenresForLanguages();

module.exports = {
  genres,
  // getAllGenresForLanguages
};
