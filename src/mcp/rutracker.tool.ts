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
      query: z.string().describe(`
        Search query, e.g.: "Матрица 1999", "Одни из нас Сезон: 2", "The Last of Us Сезон: 2"
        Это русский торрент трекер, поэтому можно использовать русский язык. 
        Обычно название дублируется на английском, но не всегда.
        В названии можно использовать год, например: "Матрица 1999".
        
        Разрешено использовать:
        - Название на русском
        - Название на английском
        - Год
        - "Сезон 2"

        Запрещено использовать:
        - "Серия: 3"
        
        Вот больше примеров как называются торренты (а ты будешь искать по этим названиям):
        - Одни из нас / The Last of Us / Сезон: 2 / Серии: 1-2 из 7 (Крэйг Мэйзин) [2025, Канада, США, ужасы, фантастика, боевик, драма, WEB-DLRip] MVO (HDRezka Studio)
        - Список заветных желаний / The Life List (Адам Брукс / Adam Brooks) [2025, США, драма, мелодрама, комедия, WEB-DLRip-AVC] MVO (заКАДРЫ)
        - Ущелье / The Gorge (Скотт Дерриксон / Scott Derrickson) [2025, Великобритания, США, фантастика, боевик, мелодрама, WEB-DLRip] Dub (Red Head Sound)
      `),
    }),
  })
  async search({ query }) {
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
        .map(result => ({
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
