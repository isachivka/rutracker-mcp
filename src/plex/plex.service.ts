import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  PlexAuthResponse,
  PlexLibrary,
  PlexMediaContainer,
  PlexMediaItem,
  PlexResponse,
} from './interfaces/plex.interface';
import { CONFIG } from '../config/config.constants';

@Injectable()
export class PlexService {
  private readonly logger = new Logger(PlexService.name);
  private readonly baseUrl: string;
  private token: string | null;
  private readonly username: string | null;
  private readonly password: string | null;
  private readonly tokenFile: string | null;
  private tokenExpirationTime: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(CONFIG.PLEX.URL);
    this.token = this.configService.get<string>(CONFIG.PLEX.TOKEN);
    this.username = this.configService.get<string>(CONFIG.PLEX.USERNAME);
    this.password = this.configService.get<string>(CONFIG.PLEX.PASSWORD);
    this.tokenFile = this.configService.get<string>(CONFIG.PLEX.TOKEN_FILE);

    // Попытка загрузить токен из файла при инициализации
    if (this.tokenFile) {
      this.loadTokenFromFile();
    }
  }

  /**
   * Загружает токен из файла
   */
  private loadTokenFromFile(): void {
    try {
      if (!this.tokenFile) return;

      const tokenFilePath = path.resolve(process.cwd(), this.tokenFile);
      const tokenDir = path.dirname(tokenFilePath);

      // Создаем директорию, если она не существует
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }

      if (fs.existsSync(tokenFilePath)) {
        const fileContent = fs.readFileSync(tokenFilePath, 'utf-8');
        const tokenData = JSON.parse(fileContent);

        if (tokenData.token && tokenData.expirationTime) {
          this.token = tokenData.token;
          this.tokenExpirationTime = new Date(tokenData.expirationTime);
          this.logger.log('Токен Plex успешно загружен из файла');
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка при загрузке токена из файла: ${error.message}`);
    }
  }

  /**
   * Сохраняет токен в файл
   */
  private saveTokenToFile(): void {
    try {
      if (!this.tokenFile || !this.token || !this.tokenExpirationTime) return;

      const tokenFilePath = path.resolve(process.cwd(), this.tokenFile);
      const tokenDir = path.dirname(tokenFilePath);

      // Создаем директорию, если она не существует
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }

      const tokenData = {
        token: this.token,
        expirationTime: this.tokenExpirationTime.toISOString(),
      };

      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
      this.logger.log('Токен Plex успешно сохранен в файл');
    } catch (error) {
      this.logger.error(`Ошибка при сохранении токена в файл: ${error.message}`);
    }
  }

  /**
   * Get a valid Plex token, automatically refreshing if needed
   */
  private async getValidToken(): Promise<string> {
    // If we have a token and it's not expired, use it
    if (this.token && this.tokenExpirationTime && this.tokenExpirationTime > new Date()) {
      return this.token;
    }

    // If we have username and password, authenticate to get a new token
    if (this.username && this.password) {
      try {
        const response = await axios.post<PlexAuthResponse>(
          'https://plex.tv/users/sign_in.json',
          {},
          {
            headers: {
              'X-Plex-Client-Identifier': 'rutracker-mcp-server',
              'X-Plex-Product': 'Plex MCP Tool',
              'X-Plex-Version': '1.0.0',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.username,
              password: this.password,
            },
          },
        );

        if (response.data && response.data.user && response.data.user.authToken) {
          this.token = response.data.user.authToken;

          // Set token expiration to 4 weeks from now (typical Plex token lifetime)
          this.tokenExpirationTime = new Date();
          this.tokenExpirationTime.setDate(this.tokenExpirationTime.getDate() + 28);

          // Сохраняем новый токен в файл
          this.saveTokenToFile();

          this.logger.log('Successfully obtained new Plex auth token');
          return this.token;
        } else {
          throw new Error('Invalid response from Plex authentication');
        }
      } catch (error) {
        this.logger.error(`Failed to authenticate with Plex: ${error.message}`);
        // If we have a previous token, try to use it as fallback
        if (this.token) {
          this.logger.warn('Falling back to previous token');
          return this.token;
        }
        throw new Error('Failed to authenticate with Plex');
      }
    }

    // If we don't have a token or credentials to get one, throw an error
    if (!this.token) {
      throw new Error('No Plex token available and no credentials to obtain one');
    }

    return this.token;
  }

  /**
   * Helper method to make authenticated Plex API requests, handles token renewal
   */
  private async plexRequest<T extends PlexMediaContainer>(
    url: string,
    params: any = {},
  ): Promise<T> {
    try {
      const token = await this.getValidToken();
      const response = await axios.get<T>(url, {
        params: { 'X-Plex-Token': token, ...params },
        headers: { Accept: 'application/json' },
      });
      return response.data;
    } catch (error) {
      // If we get an unauthorized error and have credentials, try to renew token
      if (error.response && error.response.status === 401 && this.username && this.password) {
        // Force token refresh
        this.tokenExpirationTime = null;
        const token = await this.getValidToken();

        // Retry request with new token
        const response = await axios.get<T>(url, {
          params: { 'X-Plex-Token': token, ...params },
          headers: { Accept: 'application/json' },
        });
        return response.data;
      }
      throw error;
    }
  }

  /**
   * Get all libraries from Plex server
   */
  async getLibraries(): Promise<PlexResponse<PlexLibrary[]>> {
    try {
      const data = await this.plexRequest<PlexMediaContainer>(`${this.baseUrl}/library/sections`);

      if (!data?.MediaContainer?.Directory) {
        return { success: false, error: 'No libraries found' };
      }

      const libraries: PlexLibrary[] = data.MediaContainer.Directory.map(lib => ({
        key: lib.key,
        type: lib.type,
        title: lib.title,
      }));

      return { success: true, data: libraries };
    } catch (error) {
      this.logger.error(`Failed to get libraries: ${error.message}`);
      return { success: false, error: `Failed to get libraries: ${error.message}` };
    }
  }

  /**
   * Get all media items (movies/shows) from specific libraries
   */
  async getAllMedia(
    libraryTypes: string[] = ['movie', 'show'],
  ): Promise<PlexResponse<PlexMediaItem[]>> {
    try {
      // First get all libraries
      const librariesResponse = await this.getLibraries();
      if (!librariesResponse.success) {
        return { success: false, error: librariesResponse.error };
      }

      // Filter libraries by type
      const relevantLibraries = librariesResponse.data.filter(lib =>
        libraryTypes.includes(lib.type),
      );

      if (relevantLibraries.length === 0) {
        return {
          success: false,
          error: `No libraries found with types: ${libraryTypes.join(', ')}`,
        };
      }

      // Get media from each library
      const allMedia: PlexMediaItem[] = [];

      for (const library of relevantLibraries) {
        try {
          const data = await this.plexRequest<PlexMediaContainer>(
            `${this.baseUrl}/library/sections/${library.key}/all`,
          );

          if (data?.MediaContainer?.Metadata) {
            const mediaItems = await Promise.all(
              data.MediaContainer.Metadata.map(async item => {
                const mediaItem: PlexMediaItem = {
                  title: item.title,
                  year: item.year,
                  type:
                    library.type === 'movie'
                      ? 'movie'
                      : library.type === 'show'
                        ? 'show'
                        : 'episode',
                  addedAt: new Date(item.addedAt * 1000),
                  summary: item.summary,
                  thumb: item.thumb
                    ? `${this.baseUrl}${item.thumb}?X-Plex-Token=${this.token}`
                    : undefined,
                  duration: item.duration,
                  ratingKey: item.ratingKey,
                  originalTitle: item.originalTitle,
                };

                // If it's a TV show, get seasons and episodes
                if (library.type === 'show' && item.ratingKey) {
                  try {
                    const seasonsData = await this.plexRequest<PlexMediaContainer>(
                      `${this.baseUrl}/library/metadata/${item.ratingKey}/children`,
                    );

                    if (seasonsData?.MediaContainer?.Metadata) {
                      const seasons = [];

                      // Get episodes for each season
                      for (const season of seasonsData.MediaContainer.Metadata) {
                        try {
                          const episodesData = await this.plexRequest<PlexMediaContainer>(
                            `${this.baseUrl}/library/metadata/${season.ratingKey}/children`,
                          );

                          const episodes = episodesData?.MediaContainer?.Metadata
                            ? episodesData.MediaContainer.Metadata.map(episode => ({
                                title: episode.title,
                                index: episode.index, // Episode number
                                summary: episode.summary,
                                duration: episode.duration,
                                addedAt: new Date(episode.addedAt * 1000).toLocaleDateString(),
                              }))
                            : [];

                          seasons.push({
                            title: season.title,
                            index: season.index, // Season number
                            episodes: episodes,
                          });
                        } catch (error) {
                          this.logger.error(
                            `Failed to get episodes for season ${season.index}: ${error.message}`,
                          );
                        }
                      }

                      mediaItem.seasons = seasons;
                    }
                  } catch (error) {
                    this.logger.error(
                      `Failed to get seasons for show ${item.title}: ${error.message}`,
                    );
                  }
                }

                return mediaItem;
              }),
            );

            allMedia.push(...mediaItems);
          }
        } catch (error) {
          this.logger.error(`Failed to get media from library ${library.title}: ${error.message}`);
        }
      }

      // Sort by newest first
      allMedia.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

      return { success: true, data: allMedia };
    } catch (error) {
      this.logger.error(`Failed to get media: ${error.message}`);
      return { success: false, error: `Failed to get media: ${error.message}` };
    }
  }
}
