# TMDB Collections - Stremio Addon

Addon lets you explore TMDB Collections, which are essentially grouped movie series. Discover collections featuring newly released movies or browse catalogs of popular and top-rated collections. You can filter by genre or search collections by actor, director, writer, movie or collection name in any language.

## Features

- **Multiple Catalogs:**

  - Popular Collections
  - Top Rated Collections
  - Collections with Newly Released Movies

- **Rich Filtering:**

  - Browse by genres
  - Search by collection name
  - Search by movie name
  - Search by person (actor/director/writer)

## Installation

1. Go to the addon webpage and click on the "Install addon" button

## Development

### Environment Variables

1. Copy `.env.example` to `.env`
2. Get your Fanart.tv API key from https://fanart.tv/get-an-api-key/
3. Add your Fanart.tv API key to `.env`

Note: TMDB API key is automatically handled by the freekeys package.

### Running Locally

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## API Integration

This addon uses:

- TMDB API for movie collections and metadata
- Fanart.tv for high-quality movie artwork

## License

MIT License

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for their excellent API
- [Fanart.tv](https://fanart.tv/) for providing high-quality artwork
- [Stremio](https://www.stremio.com/) for the amazing streaming platform
