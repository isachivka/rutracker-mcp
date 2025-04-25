import { Test, TestingModule } from '@nestjs/testing';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';
import { ConfigModule } from '@nestjs/config';

describe('TmdbController', () => {
  let controller: TmdbController;
  let service: TmdbService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [TmdbController],
      providers: [TmdbService],
    }).compile();

    controller = module.get<TmdbController>(TmdbController) as TmdbController;
    service = module.get<TmdbService>(TmdbService) as TmdbService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getSeasonInfo', () => {
    it('should return season information for a valid TV show and season', async () => {
      // Using a well-known TV show for testing
      const result = await controller.getSeasonInfo('Rick and Morty', 8);

      if (!result.hasOwnProperty('totalEpisodes')) {
        throw new Error('TV show "Rick and Morty" not found in TMDB');
      }

      expect(result).toHaveProperty('showTitle');
      expect(result).toHaveProperty('originalTitle');
      expect(result).toHaveProperty('seasonNumber', 8);
      expect(result).toHaveProperty('totalEpisodes');
      expect(result).toHaveProperty('airedEpisodes');
      expect(result).toHaveProperty('schedule');

      expect(result.totalEpisodes).toBeGreaterThan(0);
      expect(Array.isArray(result.schedule)).toBeTruthy();

      // Each episode in the schedule should have episodeNumber and airDate
      if (result.schedule.length > 0) {
        expect(result.schedule[0]).toHaveProperty('episodeNumber');
        expect(result.schedule[0]).toHaveProperty('airDate');
      }
    }, 15000); // Increase timeout to 15 seconds for API requests

    it('should return error for non-existent TV show', async () => {
      const result = await controller.getSeasonInfo('ThisShowDefinitelyDoesNotExist12345', 1);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('not found in TMDB');
    });

    it('should handle invalid season number for existing show', async () => {
      // Game of Thrones exists but season 99 doesn't
      const result = await controller.getSeasonInfo('Game of Thrones', 99);

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Failed to get season info');
    }, 15000);
  });
});
