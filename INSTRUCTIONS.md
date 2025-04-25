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

#### rutracker-download-torrent

Downloads a .torrent file for a specific torrent:

- `torrentId`: Torrent ID (string)

#### tmdb-get-season-info

Retrieves detailed information about TV show seasons from TMDB API:

Implementation details:

```typescript
@Tool({
  name: 'tmdb-get-season-info',
  description: 'Get information about total episodes in a TV show season using TMDB',
  parameters: z.object({
    title: z.string().describe('Original title of the TV show'),
    seasonNumber: z.number().describe('Season number to get information about'),
  }),
})
```

Process flow:

1. Search for TV show by title using TMDB API
2. If found, fetch detailed season information
3. Return formatted response with episode count and schedule

Error handling:

- Returns error message if show not found
- Returns error message if season information cannot be retrieved
- Includes detailed error logging for debugging

Required environment variables:

- `TMDB_API_KEY`: Your TMDB API key

#### plex-get-all-media

Retrieves a list of movies and TV shows from Plex server with detailed information about seasons and episodes:

- `type`: Type of media to retrieve: "all", "movies", or "shows" (default: "all")

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
├── mcp/                     # MCP server module
│   ├── mcp.module.ts        # MCP module configuration
│   ├── rutracker.tool.ts    # RuTracker MCP tools implementation
│   └── plex.tool.ts         # Plex MCP tools implementation
├── rutracker/               # RuTracker module
│   ├── __tests__/           # Tests for RuTracker module
│   ├── interfaces/          # Interfaces for RuTracker data structures
│   │   └── rutracker.interface.ts  # Type definitions for RuTracker entities
│   ├── utils/               # Utility functions
│   │   └── cookie.utils.ts  # Cookie handling utilities
│   ├── rutracker.module.ts  # RuTracker module definition
│   └── rutracker.service.ts # RuTracker service implementation
└── plex/                    # Plex module
    ├── interfaces/          # Interfaces for Plex data structures
    │   └── plex.interface.ts  # Type definitions for Plex entities
    ├── plex.module.ts       # Plex module definition
    └── plex.service.ts      # Plex service implementation
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
downloadTorrentFile(topicId: string): Promise<string>
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

### Environment Variables

The module relies on the following environment variables:

```
RUTRACKER_USERNAME=your_username
RUTRACKER_PASSWORD=your_password
RUTRACKER_COOKIE_FILE=rutracker.cookie
RUTRACKER_BASE_URL=https://rutracker.org/forum/
TORRENT_FILES_FOLDER=./torrents
```

Each variable has a default value if not specified in the environment.

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

// Download a torrent file
const torrentFilePath = await this.rutrackerService.downloadTorrentFile('5974649');
console.log(`Torrent file saved to: ${torrentFilePath}`);

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

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and continuous deployment.

### Pipeline Configuration

The pipeline is defined in `.github/workflows/ci-cd.yml` and consists of two main jobs:

1. **Build Job**: Runs on every push to main and pull requests

   - Checks out the repository
   - Sets up Node.js environment
   - Installs dependencies using `npm ci`
   - Runs linting checks
   - Builds the project
   - Runs unit tests

2. **Deploy Job**: Runs only on pushes to the main branch
   - Depends on successful completion of the build job
   - Connects to the production server via SSH using secrets
   - Pulls the latest code
   - Installs dependencies and builds the project
   - Restarts the application using PM2

### Docker Deployment

For Docker-based deployment, the project includes:

1. **Dockerfile**: Multi-stage build process

   - Build stage for compiling TypeScript to JavaScript
   - Production stage with minimal dependencies
   - Configuration for proper file handling and permissions

2. **docker-compose.yml**: Simplifies deployment
   - Defines service configuration
   - Sets up volume mapping for persistent data
   - Configures network settings
   - Handles environment variables

### Required Secrets

The following secrets must be configured in GitHub repository settings:

- `SSH_HOST`: Hostname or IP address of the deployment server
- `SSH_PORT`: SSH port (usually 22)
- `SSH_LOGIN`: SSH username for deployment
- `SSH_KEY`: SSH private key for authentication
- `DEPLOY_PATH`: Absolute path to the project directory on the server

### Manual Deployment

For manual deployment using Docker:

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Update after code changes
git pull
docker-compose up -d --build

# Stop services
docker-compose down
```

### CI/CD Best Practices

1. **Write good tests**: Ensure comprehensive test coverage
2. **Make atomic commits**: Each commit should represent a single logical change
3. **Use descriptive commit messages**: Explain what and why changes were made
4. **Create pull requests**: Use PRs for code review before merging
5. **Monitor deployments**: Check logs after deployment to verify success

### Troubleshooting Deployment Issues

If deployment fails, check:

1. GitHub Actions logs for specific error messages
2. SSH connectivity and permissions
3. Server disk space and resource utilization
4. Application logs on the server
5. Docker logs if using container-based deployment

## Plex Module

### Overview

The Plex module provides functionality to interact with a Plex Media Server, allowing the retrieval of information about movies and TV shows stored in the user's media library.

### Authentication

The module supports two methods of authentication with Plex:

1. **Direct Token Authentication**: Using a pre-obtained Plex authentication token

   - Configure using the `PLEX_TOKEN` environment variable
   - Simplest method, but tokens may eventually expire

2. **Username/Password Authentication**: Using Plex account credentials
   - Configure using the `PLEX_USERNAME` and `PLEX_PASSWORD` environment variables
   - More robust as the server can automatically obtain and refresh tokens
   - Handles token expiration automatically

When both methods are configured, the module will use the token first, and if that fails or expires, it will automatically attempt to obtain a new token using the credentials.

### Components

#### PlexService

The core service responsible for interacting with the Plex API.

```typescript
// Key methods
getLibraries(): Promise<PlexResponse<PlexLibrary[]>>
getAllMedia(libraryTypes: string[] = ['movie', 'show']): Promise<PlexResponse<PlexMediaItem[]>>
private getValidToken(): Promise<string>  // Handles token management and refresh
```

#### Data Structures

The module uses the following interfaces:

```typescript
// Configuration for Plex connection
interface PlexConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
}

// Represents a movie or TV show in Plex
interface PlexMediaItem {
  title: string;
  year?: number;
  type: 'movie' | 'show' | 'episode';
  addedAt: Date;
  summary?: string;
  thumb?: string;
  duration?: number;
  ratingKey?: string;
  seasons?: PlexSeason[]; // For TV shows - list of seasons
}

// Represents a season of a TV show
interface PlexSeason {
  title: string;
  index: number;
  episodes: PlexEpisode[];
}

// Represents an episode of a TV show
interface PlexEpisode {
  title: string;
  index: number;
  summary?: string;
  duration?: number;
  addedAt: string;
}

// Represents a library section in Plex
interface PlexLibrary {
  key: string;
  type: string;
  title: string;
}

// Standard response format for Plex operations
interface PlexResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### MCP Tools

The module provides one MCP tool:

1. **plex-get-all-media**: Retrieves a list of all movies and TV shows from the Plex server, including detailed information about seasons and episodes for TV shows.

```

```
