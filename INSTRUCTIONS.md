# Development Instructions

## Architecture Overview

This application implements the Model Context Protocol (MCP) with a client-server architecture. The backend is built with Nest.js, providing a structured and modular approach to development.

## Development History

- Initial project structure with Nest.js framework
- Added RuTracker module with basic functionality
- Implemented cookie management and HTTP request handling
- Added Win-1251 encoding support for Russian content
- Refactored to remove controller and simplify service API

## Project Structure

```
src/
├── app.controller.ts        # Main application controller
├── app.module.ts            # Root module
├── app.service.ts           # Main application service
├── main.ts                  # Application entry point
└── rutracker/               # RuTracker module
    ├── __tests__/           # Tests for RuTracker module
    ├── cookie.utils.ts      # Cookie handling utilities
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

The RuTracker module provides functionality to interact with the RuTracker website in an ethical and respectful manner. It handles sessions, cookie management, and content retrieval.

### Components

#### RutrackerService

The core service responsible for website interaction.

```typescript
// Key methods
visitMainPage(): Promise<{ cookies: CookieType[], body: string }>
visit(page: string, method: string = 'GET', data?: object): Promise<{ cookies: CookieType[], body: string }>
```

#### Cookie Utilities

Helper functions for cookie management:

```typescript
// Parse cookies from response headers
parseCookies(headers: any): CookieType[]

// Convert cookie array to string for request headers
cookiesArrayToString(cookies: CookieType[]): string
```

### Ethical Web Scraping Guidelines

1. Respect the website's terms of service
2. Implement reasonable request rates to avoid overloading servers
3. Identify your requests properly
4. Cache results when appropriate to minimize requests
5. Only extract publicly available information

### Error Handling

The module implements comprehensive error handling for network issues, unexpected responses, and other common scenarios. Errors are appropriately propagated with meaningful messages.

### Usage Examples

```typescript
// Inject the service
constructor(private readonly rutrackerService: RutrackerService) {}

// Visit the main page
const result = await this.rutrackerService.visitMainPage();
console.log(`Received ${result.cookies.length} cookies`);
console.log(`Page body length: ${result.body.length}`);

// Visit a specific page
const forumPage = await this.rutrackerService.visit('viewforum.php?f=1538');

// Post data to a form
const loginResult = await this.rutrackerService.visit('login.php', 'POST', {
  username: 'user',
  password: 'pass'
});
```
