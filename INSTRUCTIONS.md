# RuTracker MCP - Development Documentation

## Architecture Overview
This application implements the Model Context Protocol (MCP) - an open protocol that standardizes how applications provide context to LLMs (Large Language Models).

MCP follows a client-server architecture:
- **MCP Hosts**: Programs like Claude Desktop, IDEs, or AI tools that want to access data through MCP
- **MCP Clients**: Protocol clients that maintain 1:1 connections with servers
- **MCP Servers**: Lightweight programs that expose specific capabilities through the standardized Model Context Protocol

This RuTracker MCP implementation provides integrations and tools specifically designed for the RuTracker ecosystem.

## Development History

### Initial Setup (Current)
- Basic Nest.js application scaffold created
- Standard modules and controllers in place
- Boilerplate code removed
- Documentation structure established

## Project Structure
The project follows a feature/module-based architecture:

```
src/
└── [feature-or-module]/
    ├── *.controller.ts
    ├── *.service.ts
    ├── *.module.ts
    ├── dto/
    │   └── *.dto.ts
    ├── entities/
    │   └── *.entity.ts
    └── interfaces/
        └── *.interface.ts
```

Each feature or module contains all related components (controllers, services, DTOs, entities) in its own directory, promoting better organization and easier navigation.

## Development Workflow

### Setup & Installation
```bash
npm install
```

### Running Locally
```bash
npm run start:dev
```

### Testing
```bash
npm run test
npm run test:e2e
```

### Building for Production
```bash
npm run build
npm run start:prod
```

## Coding Standards
- Use TypeScript features appropriately
- Follow Nest.js best practices
- Document new modules and complex logic
- Write tests for new features
- Follow the established project structure
- Update documentation as the project evolves

## Documentation Management
- README.md contains public-facing information for users
- INSTRUCTIONS.md (this file) contains internal development information

This document will be updated as the project evolves. 