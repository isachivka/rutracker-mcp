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

- `query`: Search query

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

- `RUTRACKER_USERNAME`: Your Rutracker username
- `RUTRACKER_PASSWORD`: Your Rutracker password
- `RUTRACKER_BASE_URL`: (Optional) Base URL for Rutracker (default: https://rutracker.org/forum/)
- `RUTRACKER_COOKIE_FILE`: (Optional) Path to cookie file (default: rutracker.cookie)
- `TORRENT_FILES_FOLDER`: (Optional) Path to directory for storing downloaded torrent files (default: ./torrents)

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
