# RuTracker MCP

## Project Overview

This is a Nest.js based backend implementing the Model Context Protocol (MCP) for the RuTracker ecosystem. MCP standardizes how applications provide context to Large Language Models (LLMs).

## Key Features

- Implements the open Model Context Protocol
- Provides specialized integrations for the RuTracker ecosystem
- Built with Nest.js for reliability and scalability
- RuTracker web scraping capabilities with cookie management and encoding support

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

// Post data to a form
const searchResult = await this.rutrackerService.visit('tracker.php', 'POST', {
  nm: 'search query'
});

// Get the page content and cookies
const { body, cookies } = forumResult;
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
