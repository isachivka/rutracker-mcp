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

#### Example Usage
```typescript
// Inject the service in your class
constructor(private readonly rutrackerService: RutrackerService) {}

// Visit the main page
const mainPageResult = await this.rutrackerService.visitMainPage();

// Visit any specific page
const forumResult = await this.rutrackerService.visit('viewforum.php?f=1538');

// Post data to a form
const loginResult = await this.rutrackerService.visit('login.php', 'POST', {
  username: 'user',
  password: 'pass'
});

// Get the page content and cookies
const { body, cookies } = result;
``` 