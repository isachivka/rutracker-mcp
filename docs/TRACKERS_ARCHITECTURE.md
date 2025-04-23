# Torrent Trackers Architecture

## Overview

This document describes the architecture of torrent trackers integration in the system. The architecture is designed to be extensible, allowing easy addition of new torrent trackers while reusing common functionality.

## Base Architecture

The system uses a base abstract class `BaseTorrentTrackerService` that provides common functionality for all tracker implementations. Each specific tracker (like RuTracker) extends this base class and implements tracker-specific methods.

### Class Diagram

```
BaseTorrentTrackerService (Abstract)
    ↑
    |
RutrackerService
```

## BaseTorrentTrackerService

The base abstract class provides common functionality:

- Cookie management (loading/saving)
- HTTP requests with proper encoding
- Session management and auto-relogin
- File downloads

### Key Abstract Methods

These methods must be implemented by each tracker:

- `updateLoginStatus()`: Check if user is logged in based on cookies
- `isLoggedInByHtml(html)`: Check login status from HTML content
- `processCookiesFromResponse(response)`: Process cookies from HTTP response
- `decodeResponseData(data, contentType)`: Decode response data with appropriate encoding
- `isLoginPage(page)`: Check if page is login page
- `visitMainPage()`: Visit the main page of tracker
- `login()`: Login to tracker using configured credentials
- `downloadTorrentFile(id)`: Download .torrent file

## Tracker-Specific Implementation

Each tracker service extends the base class and implements:

1. Specific login logic
2. Specific methods for parsing search results
3. Specific torrent details extraction
4. Any additional tracker-specific functionality

## Adding New Trackers

To add a new torrent tracker:

1. Create a new service that extends `BaseTorrentTrackerService`
2. Implement all required abstract methods
3. Add tracker-specific features
4. Register the service in the appropriate module

## Example: RutrackerService

The RuTracker implementation extends the base class and adds:

- RuTracker-specific HTML parsing
- Search functionality with pagination
- Torrent details extraction
- Magnet link extraction

## Configuration

Each tracker implementation requires specific configuration:

- Base URL
- Username/password
- Cookie storage location
- Torrent files storage location

Configuration is loaded via NestJS ConfigService and can be customized per tracker.
