import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlexService } from '../plex/plex.service';

@Injectable()
export class PlexTool {
  constructor(private readonly plexService: PlexService) {}

  @Tool({
    name: 'plex-get-all-media',
    description:
      'Get all movies and TV shows from Plex server with details about seasons and episodes',
    parameters: z.object({
      type: z
        .enum(['all', 'movies', 'shows'])
        .default('all')
        .describe('Type of media to retrieve: "all", "movies", or "shows"'),
    }),
  })
  async getAllMedia({ type }: { type: 'all' | 'movies' | 'shows' }) {
    try {
      // Define which library types to query based on the requested type
      let libraryTypes: string[] = [];
      if (type === 'all') {
        libraryTypes = ['movie', 'show'];
      } else if (type === 'movies') {
        libraryTypes = ['movie'];
      } else if (type === 'shows') {
        libraryTypes = ['show'];
      }

      const result = await this.plexService.getAllMedia(libraryTypes);

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting media from Plex: ${result.error}`,
            },
          ],
        };
      }

      // Format the media items for better display
      const formattedMedia = result.data.map(item => {
        const baseInfo = {
          title: item.title,
          year: item.year,
          type: item.type === 'movie' ? 'Movie' : 'TV Show',
          addedAt: item.addedAt.toLocaleDateString(),
          originalTitle: item.originalTitle,
        };

        // Add seasons and episodes for TV shows
        if (item.type === 'show' && item.seasons) {
          return {
            ...baseInfo,
            seasons: item.seasons.map(season => ({
              title: season.title,
              seasonNumber: season.index,
              episodeCount: season.episodes.length,
              episodes: season.episodes.map(episode => ({
                title: episode.title,
                episodeNumber: episode.index,
                addedAt: episode.addedAt,
              })),
            })),
          };
        }

        return baseInfo;
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedMedia, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting media from Plex: ${error.message}`,
          },
        ],
      };
    }
  }
}
