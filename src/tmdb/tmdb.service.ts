import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CONFIG } from '../config/config.constants';

// TMDB API response interfaces
export interface TmdbTvShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  original_name: string;
  genre_ids: number[];
  origin_country: string[];
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TmdbEpisodeSchedule {
  episodeNumber: number;
  airDate: string;
}

export interface TmdbSeasonDetails {
  seasonNumber: number;
  episodeCount: number;
  totalEpisodes: number;
  airedEpisodes: number;
  schedule: TmdbEpisodeSchedule[];
}

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
  async searchShow(title: string): Promise<TmdbTvShow | null> {
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
  async getSeasonDetails(showId: number, seasonNumber: number): Promise<TmdbSeasonDetails> {
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
          (ep: TmdbEpisode) => ep.air_date && new Date(ep.air_date) <= new Date(),
        ).length,
        schedule: response.data.episodes.map((ep: TmdbEpisode) => ({
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
