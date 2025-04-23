import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RutrackerService } from '../rutracker/rutracker.service';
import { CONFIG } from '../config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RutrackerTool {
  private readonly ETA_SPEED = this.configService.get<number>(CONFIG.RUTRACKER.ETA_SPEED, 100);

  constructor(
    private readonly rutrackerService: RutrackerService,
    private readonly configService: ConfigService,
  ) {}

  @Tool({
    name: 'rutracker-search',
    description: 'Search for torrents on rutracker.org',
    parameters: z.object({
      title: z
        .string()
        .describe(`Movie or TV show title ru or (and) en, e.g. "Титаник" or "Titanic"`),
      year: z.string().optional().describe(`Movie or TV show year, e.g. "2023"`),
      season: z.string().optional().describe(`TV show season, e.g. "1", "2", etc.`),
    }),
  })
  async search({ title, year, season }: { title: string; year?: string; season?: string }) {
    let query = title;
    if (year) {
      query += ` ${year}`;
    }
    if (season) {
      query += ` Сезон: ${season}`;
    }

    try {
      // Check login status
      if (!this.rutrackerService.getLoginStatus()) {
        await this.rutrackerService.login();
      }

      // Perform search
      const searchResults = await this.rutrackerService.searchAllPages({ query });

      // Format results
      const formattedResults = searchResults
        .sort((a, b) => b.seeders - a.seeders) // Sort by seeders in descending order
        .map(result => {
          const sizeInMegabytes = Math.ceil(result.size / 1024 / 1024);
          const etaInMinutes = Math.ceil(sizeInMegabytes / (this.ETA_SPEED / 8) / 60);
          const pubDateHuman = new Date(result.pubDate * 1000).toLocaleString();

          return {
            id: result.id,
            name: result.name,
            size: `${sizeInMegabytes} Megabytes`,
            etaInMinutes: `${etaInMinutes} minutes`,
            seeders: result.seeders,
            leechers: result.leechers,
            pubDate: pubDateHuman,
          };
        });

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

  @Tool({
    name: 'rutracker-download-torrent',
    description: 'Download a .torrent file for a specific torrent ID',
    parameters: z.object({
      torrentId: z.string().describe('Torrent ID'),
    }),
  })
  async downloadTorrent({ torrentId }) {
    try {
      // Check login status
      if (!this.rutrackerService.getLoginStatus()) {
        await this.rutrackerService.login();
      }

      // Download torrent file
      const filePath = await this.rutrackerService.downloadTorrentFile(torrentId);

      return {
        content: [
          {
            type: 'text',
            text: `Torrent file successfully downloaded to: ${filePath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error downloading torrent file for ID ${torrentId}: ${error.message}`,
          },
        ],
      };
    }
  }
}
