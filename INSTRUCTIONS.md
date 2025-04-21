# Development Instructions

## Architecture Overview

This application implements the Model Context Protocol (MCP) with a client-server architecture. The backend is built with Nest.js, providing a structured and modular approach to development.

## Development History

- Initial project structure with Nest.js framework
- Added RuTracker module with basic functionality
- Implemented cookie management and HTTP request handling
- Added Win-1251 encoding support for Russian content
- Refactored to remove controller and simplify service API
- Added search functionality with paginated results and magnet link extraction
- Added torrent details extraction with post content
- Implemented Model Context Protocol (MCP) server with RuTracker tools

## MCP Implementation

The application integrates the Model Context Protocol (MCP) to enable seamless interaction between AI models and the RuTracker functionality. This implementation follows the standard MCP specification.

### MCP Module Structure

```
src/
├── mcp/
│   ├── mcp.module.ts        # MCP module configuration
│   └── rutracker.tool.ts    # RuTracker MCP tools implementation
```

### MCP Server Configuration

The MCP server is configured in `mcp.module.ts` using the `@rekog/mcp-nest` package:

```typescript
@Module({
  imports: [
    McpModule.forRoot({
      name: 'rutracker-mcp-server',
      version: '1.0.0',
    }),
    RutrackerModule,
  ],
  providers: [RutrackerTool],
  exports: [McpModule],
})
export class McpServerModule {}
```

### MCP Endpoints

The application exposes the standard MCP endpoints:

- `GET /sse`: Server-Sent Events (SSE) connection endpoint
- `POST /messages`: Tool execution endpoint

### Available MCP Tools

The application implements the following MCP tools:

#### rutracker-search

Allows searching for torrents on RuTracker with the following parameters:

- `query`: Search query (string)

#### rutracker-get-magnet

Retrieves a magnet link for a specific torrent:

- `torrentId`: Torrent ID (string)

#### rutracker-get-details

Gets detailed information about a specific torrent:

- `torrentId`: Torrent ID (string)

### Tool Implementation

Tools are implemented using the `@Tool` decorator from the MCP NestJS package, with parameter validation using Zod schemas. Each tool calls the corresponding method from the RutrackerService.

Example tool implementation:

```typescript
@Tool({
  name: 'rutracker-search',
  description: 'Search for torrents on rutracker.org',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
})
async search({ query }) {
  // Implementation details
}
```

### MCP Integration in Main Application

The MCP server module is integrated into the main application in `app.module.ts`:

```typescript
@Module({
  imports: [ConfigModule.forRoot(), RutrackerModule, McpServerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

The main.ts file configures the application to handle MCP endpoints properly:

```typescript
// Set global prefix for API routes except MCP endpoints
app.setGlobalPrefix('/api', { exclude: ['sse', 'messages'] });

// Enable CORS for MCP client access
app.enableCors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
```

## Project Structure

```
src/
├── app.service.ts           # Main application service
├── main.ts                  # Application entry point
└── rutracker/               # RuTracker module
    ├── __tests__/           # Tests for RuTracker module
    ├── interfaces/          # Interfaces for RuTracker data structures
    │   └── rutracker.interface.ts  # Type definitions for RuTracker entities
    ├── utils/               # Utility functions
    │   └── cookie.utils.ts  # Cookie handling utilities
    ├── rutracker.module.ts  # RuTracker module definition
    └── rutracker.service.ts # RuTracker service implementation
```

## Development Workflow

### Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and configure environment variables

### Running Locally

```bash
npm run start:dev
```

### Testing

```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run end-to-end tests
```

### Building for Production

```bash
npm run build
npm run start:prod
```

## Coding Standards

- Use TypeScript for type safety
- Follow Nest.js best practices
- Write unit tests for all functionality
- Document public APIs and complex logic
- Update documentation when making significant changes

## Documentation Management

- Keep the README.md updated with high-level overview
- Maintain this INSTRUCTIONS.md for detailed development information
- Document all major architecture decisions

## RuTracker Module

### Overview

The RuTracker module provides functionality to interact with the RuTracker website in an ethical and respectful manner. It handles sessions, cookie management, content retrieval, and now includes powerful search capabilities.

### Components

#### RutrackerService

The core service responsible for website interaction.

```typescript
// Key methods
visitMainPage(): Promise<PageVisitResult>
visit(page: string, method: string = 'GET', data?: object): Promise<PageVisitResult>
login(): Promise<boolean>
getLoginStatus(): boolean
search(options: SearchOptions): Promise<SearchResponse>
searchAllPages(options: SearchOptions): Promise<TorrentSearchResult[]>
getMagnetLink(topicId: string): Promise<string>
getTorrentDetails(options: TorrentDetailsOptions): Promise<TorrentDetails>
```

#### Cookie Utilities

Helper functions for cookie management:

```typescript
// Parse cookies from response headers
parseCookies(headers: any): Cookie[]

// Convert cookie array to string for request headers
cookiesArrayToString(cookies: Cookie[]): string
```

### Search Functionality

The search implementation provides the following features:

1. **Single Page Search**: Performs a search on RuTracker and returns results from one page
2. **Multi-Page Search**: Retrieves all results across all pages using parallel requests
3. **Magnet Link Extraction**: Extracts magnet links from topic pages

#### Data Structures

The module uses the following interfaces for search functionality:

```typescript
// Search options for queries
interface SearchOptions {
  query: string;
  page?: number;
  resultsPerPage?: number;
}

// Search response with pagination info
interface SearchResponse {
  results: TorrentSearchResult[];
  totalResults: number;
  page: number;
  hasMorePages: boolean;
}

// Individual torrent search result
interface TorrentSearchResult {
  id: string;
  name: string;
  size: string;
  seeders: number;
  leechers: number;
  pubDate: number;
  magnetLink?: string;
  downloadLink: string;
  topicLink: string;
}

// Torrent details options
interface TorrentDetailsOptions {
  id: string; // Can be either numeric ID or full URL
}

// Torrent details response
interface TorrentDetails {
  id: string;
  title?: string;
  content: string; // HTML content from the post message
  magnetLink?: string;
  downloadLink?: string;
}
```

### Search Implementation Details

The search implementation uses regular expressions to parse the HTML content of search results pages:

1. The `search()` method performs pagination-aware searches
2. The `searchAllPages()` method handles retrieving all results across multiple pages
3. The `parseSearchResults()` method extracts structured data from HTML
4. The `getMagnetLink()` method parses topic pages to extract magnet links

For pagination, the service uses concurrent requests to fetch all pages simultaneously, improving performance for large result sets.

### Torrent Details Extraction

The module can extract detailed information about a specific torrent, including the HTML content of the first post that typically contains the description:

1. The `getTorrentDetails()` method retrieves the content of a torrent topic page
2. It extracts the title from the page header
3. It uses multiple matching strategies to find the post content in the HTML structure
4. It attempts to get the magnet link for the torrent
5. It returns a structured `TorrentDetails` object with all available information

The implementation uses a resilient approach with multiple fallback patterns for extracting content, handling different HTML structures that may be encountered on RuTracker.

### Ethical Web Scraping Guidelines

1. Respect the website's terms of service
2. Implement reasonable request rates to avoid overloading servers
3. Identify your requests properly
4. Cache results when appropriate to minimize requests
5. Only extract publicly available information

### Error Handling

The module implements comprehensive error handling for network issues, unexpected responses, and other common scenarios. Errors are appropriately propagated with meaningful messages.

The search functionality includes additional error handling for:

- Session expiration with automatic re-login
- Encoding detection and conversion
- Proper character escaping in search queries

### Usage Examples

```typescript
// Inject the service
constructor(private readonly rutrackerService: RutrackerService) {}

// Basic search with pagination
const searchResponse = await this.rutrackerService.search({
  query: 'ubuntu',
  page: 1,
  resultsPerPage: 50
});
console.log(`Found ${searchResponse.totalResults} results, page ${searchResponse.page}`);

// Search across all pages
const allResults = await this.rutrackerService.searchAllPages({
  query: 'ubuntu'
});
console.log(`Found ${allResults.length} total results across all pages`);

// Get magnet link for a specific torrent
const magnetLink = await this.rutrackerService.getMagnetLink('12345');
console.log(`Magnet link: ${magnetLink}`);

// Get detailed information for a torrent
const details = await this.rutrackerService.getTorrentDetails({ id: '5974649' });
console.log(`Title: ${details.title}`);
console.log(`Content length: ${details.content.length} characters`);
console.log(`Download link: ${details.downloadLink}`);

// Access using full URL
const detailsByUrl = await this.rutrackerService.getTorrentDetails({
  id: 'viewtopic.php?t=5974649'
});
```

### Testing

The module includes comprehensive tests for all functionality:

1. **Unit tests**: Validate the behavior of individual components
2. **Integration tests**: Test the full workflow with the actual RuTracker website
3. **Mock tests**: Test edge cases and error handling without external dependencies

Run the search-specific tests with:

```bash
npm run test -- --testNamePattern="search"
```

Run the torrent details tests with:

```bash
npm run test -- --testNamePattern="getTorrentDetails"
```
