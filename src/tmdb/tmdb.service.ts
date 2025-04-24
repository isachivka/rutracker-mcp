import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CONFIG } from '../config/config.constants';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(CONFIG.TMDB.API_KEY);
  }

  /**
   * Search for TV show by title
   */
  async searchShow(title: string): Promise<any> {
    try {
      this.logger.debug(`Searching for TV show with title: ${title}`);
      const response = await axios.get(`${this.baseUrl}/search/tv`, {
        params: {
          api_key: this.apiKey,
          query: title,
        },
      });

      if (!response.data.results?.length) {
        this.logger.warn(`No results found for TV show: ${title}`);
        return null;
      }

      this.logger.debug(`Found ${response.data.results.length} results for "${title}"`);
      return response.data.results[0];
    } catch (error) {
      this.logger.error('Failed to search show. Details:', {
        title,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get season details including episode count
   */
  async getSeasonDetails(showId: number, seasonNumber: number): Promise<any> {
    try {
      this.logger.debug(`Fetching season details for showId: ${showId}, season: ${seasonNumber}`);
      const response = await axios.get(`${this.baseUrl}/tv/${showId}/season/${seasonNumber}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      this.logger.debug(`Successfully retrieved season data:`, {
        showId,
        seasonNumber,
        episodeCount: response.data.episodes?.length,
        firstEpisodeDate: response.data.episodes?.[0]?.air_date,
        lastEpisodeDate: response.data.episodes?.[response.data.episodes.length - 1]?.air_date,
      });

      return {
        seasonNumber,
        episodeCount: response.data.episodes.length,
        totalEpisodes: response.data.episodes.length,
        airedEpisodes: response.data.episodes.filter(
          (ep: any) => new Date(ep.air_date) <= new Date(),
        ).length,
        schedule: response.data.episodes.map((ep: any) => ({
          episodeNumber: ep.episode_number,
          airDate: ep.air_date,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get season details. Details:', {
        showId,
        seasonNumber,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }
}
