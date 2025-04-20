# RuTracker MCP - Project Instructions

## Project Overview
This is a Nest.js based backend for the RuTracker MCP (Model Context Protocol) application. The application will serve as an implementation of the Model Context Protocol - an open protocol that standardizes how applications provide context to LLMs (Large Language Models).

MCP follows a client-server architecture:
- **MCP Hosts**: Programs like Claude Desktop, IDEs, or AI tools that want to access data through MCP
- **MCP Clients**: Protocol clients that maintain 1:1 connections with servers
- **MCP Servers**: Lightweight programs that expose specific capabilities through the standardized Model Context Protocol

This RuTracker MCP implementation will provide integrations and tools specifically designed for the RuTracker ecosystem.

## Development History

### Initial Setup (Current)
- Basic Nest.js application scaffold created
- Standard modules and controllers in place

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

## Coding Standards
- Use TypeScript features appropriately
- Follow Nest.js best practices
- Document new modules and complex logic
- Write tests for new features
- Follow the established project structure
- Update this documentation as the project evolves to reflect new features and architectural changes

This document will be updated as the project evolves. 