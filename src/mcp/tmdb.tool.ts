import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TmdbService } from '../tmdb/tmdb.service';

@Injectable()
export class TmdbTool {
  constructor(private readonly tmdbService: TmdbService) {}

  @Tool({
    name: 'tmdb-get-season-info',
    description: 'Get information about total episodes in a TV show season using TMDB',
    parameters: z.object({
      title: z.string().describe('Original title of the TV show'),
      seasonNumber: z.number().describe('Season number to get information about'),
    }),
  })
  async getSeasonInfo({ title, seasonNumber }: { title: string; seasonNumber: number }) {
    try {
      // First, search for the TV show by title
      const show = await this.tmdbService.searchShow(title);

      if (!show) {
        return {
          content: [
            {
              type: 'text',
              text: `TV show "${title}" not found in TMDB`,
            },
          ],
        };
      }

      // Get season information
      const seasonInfo = await this.tmdbService.getSeasonDetails(show.id, seasonNumber);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                showTitle: show.name,
                originalTitle: show.original_name,
                seasonNumber: seasonInfo.seasonNumber,
                totalEpisodes: seasonInfo.totalEpisodes,
                airedEpisodes: seasonInfo.airedEpisodes,
                schedule: seasonInfo.schedule,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                showTitle: title,
                originalTitle: title,
                seasonNumber: seasonNumber,
                totalEpisodes: 0,
                airedEpisodes: 0,
                schedule: 'No information available',
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }
}
