# RuTracker MCP

## Project Overview

This is a Nest.js based backend implementing the Model Context Protocol (MCP) for the RuTracker ecosystem. MCP standardizes how applications provide context to Large Language Models (LLMs).

## Key Features

- Implements the open Model Context Protocol
- Provides specialized integrations for the RuTracker ecosystem
- Built with Nest.js for reliability and scalability
- RuTracker web scraping capabilities with cookie management and encoding support
- Advanced search functionality with multi-page result handling
- Magnet link extraction for torrents

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run start:dev
```

### Testing

```bash
npm run test
npm run test:e2e
```

### Production Build

```bash
npm run build
npm run start:prod
```

## Documentation

For detailed information about the project architecture, development standards, and contribution guidelines, please refer to the [INSTRUCTIONS.md](./INSTRUCTIONS.md) file.

## Project Modules

### RuTracker Module

The RuTracker module provides functionality to interact with the RuTracker website:

- Emulates browser behavior for web requests
- Handles cookies for maintaining session state
- Provides universal visit method for different pages
- Automatically detects and converts Win-1251 encoding
- Implements login functionality with cookie persistence
- Stores session cookies in a file for persistent authentication
- Advanced search functionality with pagination
- Retrieves all search results across multiple pages
- Extracts magnet links from torrent topic pages

#### Example Usage

```typescript
// Inject the service in your class
constructor(private readonly rutrackerService: RutrackerService) {}

// Visit the main page
const mainPageResult = await this.rutrackerService.visitMainPage();

// Check if already logged in
const isLoggedIn = this.rutrackerService.getLoginStatus();

// Login to RuTracker (if not already logged in)
if (!isLoggedIn) {
  const loginSuccess = await this.rutrackerService.login();
  console.log(`Login successful: ${loginSuccess}`);
}

// Visit any specific page
const forumResult = await this.rutrackerService.visit('viewforum.php?f=1538');

// Search for torrents (with pagination)
const searchResponse = await this.rutrackerService.search({
  query: 'ubuntu',
  page: 1,
  resultsPerPage: 50
});
console.log(`Found ${searchResponse.totalResults} results`);

// Search across all pages
const allResults = await this.rutrackerService.searchAllPages({
  query: 'ubuntu'
});
console.log(`Found ${allResults.length} total results across all pages`);

// Get magnet link for a specific torrent
const magnetLink = await this.rutrackerService.getMagnetLink('12345');
```

#### Configuration

Create a `.env` file based on the `.env.example`:

```bash
# RuTracker credentials
RUTRACKER_USERNAME=your_username
RUTRACKER_PASSWORD=your_password

# Cookie file path (relative to project root)
RUTRACKER_COOKIE_FILE=rutracker.cookie

# RuTracker base URL
RUTRACKER_BASE_URL=https://rutracker.org/forum/
```

## Search Functionality

The module provides powerful search capabilities to find torrents on RuTracker:

### Basic Search

```typescript
const searchResponse = await rutrackerService.search({
  query: 'ubuntu',
  page: 1,
  resultsPerPage: 50,
});
```

The search response includes:

- `results`: Array of torrent results
- `totalResults`: Total count of matching torrents
- `page`: Current page number
- `hasMorePages`: Whether more pages are available

### Complete Search (All Pages)

To retrieve all results across multiple pages in a single call:

```typescript
const allResults = await rutrackerService.searchAllPages({
  query: 'ubuntu',
});
```

This method fetches all pages concurrently for better performance.

### Magnet Link Extraction

To get a magnet link for a specific torrent:

```typescript
const magnetLink = await rutrackerService.getMagnetLink('12345');
```

Each search result includes:

- Torrent ID
- Name
- Size
- Seeders and leechers count
- Publication date
- Download link
- Topic page link
