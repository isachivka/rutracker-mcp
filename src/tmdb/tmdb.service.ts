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
      const response = await axios.get(`${this.baseUrl}/search/tv`, {
        params: {
          api_key: this.apiKey,
          query: title,
        },
      });

      return response.data.results[0]; // Return first match
    } catch (error) {
      this.logger.error(`Failed to search show: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get season details including episode count
   */
  async getSeasonDetails(showId: number, seasonNumber: number): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/tv/${showId}/season/${seasonNumber}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      console.log(JSON.stringify(response.data, null, '\t'));

      return {
        seasonNumber,
        episodeCount: response.data.episodes.length,
        totalEpisodes: response.data.episodes.length, // Total planned episodes
        airedEpisodes: response.data.episodes.filter(
          (ep: any) => new Date(ep.air_date) <= new Date(),
        ).length, // Episodes aired so far
        schedule: response.data.episodes.map((ep: any) => ({
          episodeNumber: ep.episode_number,
          airDate: ep.air_date,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get season details: ${error.message}`);
      throw error;
    }
  }
}
