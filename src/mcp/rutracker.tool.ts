import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RutrackerService } from '../rutracker/rutracker.service';

@Injectable()
export class RutrackerTool {
  constructor(private readonly rutrackerService: RutrackerService) {}

  @Tool({
    name: 'rutracker-search',
    description: 'Search for torrents on rutracker.org',
    parameters: z.object({
      query: z.string().describe('Search query'),
      limit: z.number().optional().default(1000).describe('Maximum number of results to return'),
    }),
  })
  async search({ query, limit }) {
    try {
      // Check login status
      if (!this.rutrackerService.getLoginStatus()) {
        await this.rutrackerService.login();
      }

      // Perform search
      const searchResults = await this.rutrackerService.searchAllPages({ query });

      // Format results and limit them
      const limitedResults = searchResults.slice(0, limit);
      const formattedResults = limitedResults.map(result => ({
        id: result.id,
        name: result.name,
        size: result.size,
        seeders: result.seeders,
        leechers: result.leechers,
        pubDate: result.pubDate,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching for "${query}": ${error.message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'rutracker-get-magnet',
    description: 'Get magnet link for a specific torrent',
    parameters: z.object({
      torrentId: z.string().describe('Torrent ID'),
    }),
  })
  async getMagnet({ torrentId }) {
    try {
      // Check login status
      if (!this.rutrackerService.getLoginStatus()) {
        await this.rutrackerService.login();
      }

      // Get magnet link
      const magnetLink = await this.rutrackerService.getMagnetLink(torrentId);

      return {
        content: [
          {
            type: 'text',
            text: magnetLink,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting magnet link for torrent ID ${torrentId}: ${error.message}`,
          },
        ],
      };
    }
  }

  @Tool({
    name: 'rutracker-get-details',
    description: 'Get detailed information about a specific torrent',
    parameters: z.object({
      torrentId: z.string().describe('Torrent ID'),
    }),
  })
  async getTorrentDetails({ torrentId }) {
    try {
      // Check login status
      if (!this.rutrackerService.getLoginStatus()) {
        await this.rutrackerService.login();
      }

      // Get torrent details
      const details = await this.rutrackerService.getTorrentDetails({ id: torrentId });

      // Format the torrent details as text to avoid any issues with JSON content
      const formattedDetails = {
        id: details.id,
        title: details.title || '',
        magnetLink: details.magnetLink || '',
        downloadLink: details.downloadLink || '',
        contentSummary: details.content,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedDetails),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting details for torrent ID ${torrentId}: ${error.message}`,
          },
        ],
      };
    }
  }
}
