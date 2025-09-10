import { Controller, Get, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('season-info')
  async getSeasonInfo(@Query('title') title: string, @Query('seasonNumber') seasonNumber: number) {
    try {
      const show = await this.tmdbService.searchShow(title);

      if (!show) {
        throw new Error('TV show "Rick and Morty" not found in TMDB');
      }

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
        showTitle: title,
        originalTitle: title,
        seasonNumber: seasonNumber,
        totalEpisodes: 0,
        airedEpisodes: 0,
        schedule: [],
        error: 'Failed to get season info',
      };
    }
  }
}
