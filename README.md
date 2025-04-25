# Rutracker MCP Server

A Model Context Protocol (MCP) server implementation for interacting with Rutracker.org via AI.

## Features

- Search for torrents on Rutracker.org
- Get magnet links for torrents
- Get detailed information about torrents
- MCP compliant API for AI integration
- Extensible architecture for adding more torrent trackers

## Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your Rutracker credentials
```

## Running the server

```bash
# Development mode
npm run start:dev

# Production mode
npm run start
```

The server will start on port 3000 by default.

## MCP Endpoints

- `GET /sse`: SSE connection endpoint
- `POST /messages`: Tool execution endpoint

## Available Tools

### rutracker-search

Search for torrents on Rutracker.org.

Parameters:

- `title`: Movie or TV show title in Russian or English
- `year`: (Optional) Movie or TV show year
- `season`: (Optional) TV show season

### rutracker-get-magnet

Get magnet link for a specific torrent.

Parameters:

- `torrentId`: Torrent ID

### rutracker-get-details

Get detailed information about a specific torrent.

Parameters:

- `torrentId`: Torrent ID

### rutracker-download-torrent

Download a .torrent file for a specific torrent.

Parameters:

- `torrentId`: Torrent ID

### tmdb-get-season-info

Get detailed information about TV show seasons from TMDB, including episode count and air dates.

Parameters:

- `title`: Original title of the TV show
- `seasonNumber`: Season number to get information about

Returns:

```json
{
  "showTitle": "Show Name",
  "originalTitle": "Original Show Name",
  "seasonNumber": 1,
  "totalEpisodes": 12,
  "airedEpisodes": 10,
  "schedule": [
    {
      "episodeNumber": 1,
      "airDate": "2024-01-01"
    }
  ]
}
```

### plex-get-all-media

Retrieve a list of all movies and TV shows from your Plex server with detailed information about seasons and episodes.

Parameters:

- `type`: (Optional) Type of media to retrieve: "all", "movies", or "shows" (default: "all")

## Architecture

The server uses an extensible architecture for torrent tracker integration:

- Base abstract class `BaseTorrentTrackerService` containing common functionality
- Specific implementations for each tracker (currently only RuTracker)
- Easy to add new trackers by extending the base class

For more detailed information about the architecture, see [TRACKERS_ARCHITECTURE.md](./docs/TRACKERS_ARCHITECTURE.md).

## Using with AI

This server implements the Model Context Protocol (MCP), making it compatible with AI systems that support MCP. You can connect any MCP-compatible AI client to this server to search for torrents and get magnet links via natural language.

## Environment Variables

The server requires the following environment variables:

### RuTracker Configuration

- `RUTRACKER_USERNAME`: Your Rutracker username
- `RUTRACKER_PASSWORD`: Your Rutracker password
- `RUTRACKER_BASE_URL`: (Optional) Base URL for Rutracker (default: https://rutracker.org/forum/)
- `RUTRACKER_COOKIE_FILE`: (Optional) Path to cookie file (default: rutracker.cookie)
- `TORRENT_FILES_FOLDER`: (Optional) Path to directory for storing downloaded torrent files (default: ./torrents)

### TMDB Configuration

- `TMDB_API_KEY`: Your TMDB API key (get it from https://www.themoviedb.org/settings/api)

### Plex Configuration

- `PLEX_URL`: URL of your Plex server (e.g., http://localhost:32400)
- `PLEX_TOKEN`: (Optional) Your Plex authentication token
- `PLEX_USERNAME`: (Optional) Your Plex username/email - alternative to token
- `PLEX_PASSWORD`: (Optional) Your Plex password - alternative to token

You can either use `PLEX_TOKEN` directly or provide `PLEX_USERNAME` and `PLEX_PASSWORD` to have the server automatically retrieve and refresh the token.

### App Configuration

- `PORT`: (Optional) Port for the server to listen on (default: 3000)

## Documentation

For detailed information about the project architecture, development standards, and contribution guidelines, please refer to the [INSTRUCTIONS.md](./INSTRUCTIONS.md) file.

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- On push to main branch: Runs tests, linting, builds the project, and deploys to production
- On pull requests: Runs tests, linting, and builds the project

For deployment, the project can be deployed in two ways:

- Using Docker (with provided Dockerfile and docker-compose.yml)

To deploy with Docker:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```
