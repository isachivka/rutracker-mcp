import { Controller, Get, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('season-info')
  async getSeasonInfo(@Query('title') title: string, @Query('seasonNumber') seasonNumber: number) {
    const show = await this.tmdbService.searchShow(title);

    if (!show) {
      return {
        error: `TV show "${title}" not found in TMDB`,
      };
    }

    try {
      const seasonInfo = await this.tmdbService.getSeasonDetails(show.id, seasonNumber);

      return {
        showTitle: show.name,
        originalTitle: show.original_name,
        seasonNumber: seasonInfo.seasonNumber,
        totalEpisodes: seasonInfo.totalEpisodes,
        airedEpisodes: seasonInfo.airedEpisodes,
        schedule: seasonInfo.schedule,
      };
    } catch (error) {
      console.error(error);
      return {
        showTitle: show.name,
        originalTitle: show.original_name,
        seasonNumber: seasonNumber,
        totalEpisodes: 0,
        airedEpisodes: 0,
        schedule: [],
        error: 'Failed to get season info',
      };
    }
  }
}
