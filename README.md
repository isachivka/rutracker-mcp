# Rutracker MCP Server

A Model Context Protocol (MCP) server implementation for interacting with Rutracker.org via AI.

## Features

- Search for torrents on Rutracker.org
- Get magnet links for torrents
- Get detailed information about torrents
- MCP compliant API for AI integration

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
- `limit`: (Optional) Maximum number of results to return (default: 1000)

### rutracker-get-magnet

Get magnet link for a specific torrent.

Parameters:

- `torrentId`: Torrent ID

### rutracker-get-details

Get detailed information about a specific torrent.

Parameters:

- `torrentId`: Torrent ID

## Using with AI

This server implements the Model Context Protocol (MCP), making it compatible with AI systems that support MCP. You can connect any MCP-compatible AI client to this server to search for torrents and get magnet links via natural language.

## Environment Variables

The server requires the following environment variables:

- `RUTRACKER_USERNAME`: Your Rutracker username
- `RUTRACKER_PASSWORD`: Your Rutracker password
- `RUTRACKER_BASE_URL`: (Optional) Base URL for Rutracker (default: https://rutracker.org/forum/)
- `RUTRACKER_COOKIE_FILE`: (Optional) Path to cookie file (default: rutracker.cookie)

## Documentation

For detailed information about the project architecture, development standards, and contribution guidelines, please refer to the [INSTRUCTIONS.md](./INSTRUCTIONS.md) file.
