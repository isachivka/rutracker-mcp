import { Test, TestingModule } from '@nestjs/testing';
import { PlexService } from './plex.service';
import { ConfigModule } from '@nestjs/config';

describe('PlexService', () => {
  let service: PlexService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [PlexService],
    }).compile();

    service = module.get<PlexService>(PlexService) as PlexService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLibraries', () => {
    it('should successfully connect to Plex server and fetch libraries', async () => {
      // Execute a real request to the Plex server
      const result = await service.getLibraries();
      console.log('Plex libraries:', JSON.stringify(result, null, 2));

      // Check request success
      expect(result.success).toBe(true);

      // Check response structure
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // If there are libraries, check their structure
      if (result.data.length > 0) {
        const library = result.data[0];
        expect(library).toHaveProperty('key');
        expect(library).toHaveProperty('title');
        expect(library).toHaveProperty('type');
      }
    }, 30000); // Increase timeout to 30 seconds for external request
  });

  describe('getAllMedia', () => {
    it('should fetch all media items from movie and show libraries', async () => {
      // Execute a real request to the Plex server
      const result = await service.getAllMedia();
      console.log(`Found ${result.data?.length || 0} media items`);

      // If there are media items, output a few for debugging
      if (result.success && result.data && result.data.length > 0) {
        const sampleSize = Math.min(3, result.data.length);
        console.log(
          `Sample ${sampleSize} media items:`,
          JSON.stringify(
            result.data.slice(0, sampleSize).map(item => ({
              title: item.title,
              type: item.type,
              year: item.year,
              addedAt: item.addedAt,
            })),
            null,
            2,
          ),
        );
      }

      // Check request success
      expect(result.success).toBe(true);

      // Check response structure
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // If there are media items, check their structure
      if (result.data.length > 0) {
        const mediaItem = result.data[0];
        expect(mediaItem).toHaveProperty('title');
        expect(mediaItem).toHaveProperty('type');
        expect(mediaItem).toHaveProperty('addedAt');
        expect(mediaItem).toHaveProperty('ratingKey');

        // Check different media types
        const movieItem = result.data.find(item => item.type === 'movie');
        const showItem = result.data.find(item => item.type === 'show');

        if (movieItem) {
          console.log(
            'Sample movie:',
            JSON.stringify(
              {
                title: movieItem.title,
                year: movieItem.year,
                originalTitle: movieItem.originalTitle,
              },
              null,
              2,
            ),
          );

          expect(movieItem).toHaveProperty('duration');
          expect(movieItem.type).toBe('movie');
        }

        if (showItem) {
          console.log(
            'Sample show:',
            JSON.stringify(
              {
                title: showItem.title,
                seasons: showItem.seasons ? showItem.seasons.length : 0,
              },
              null,
              2,
            ),
          );

          expect(showItem.type).toBe('show');
          if (showItem.seasons && showItem.seasons.length > 0) {
            const season = showItem.seasons[0];
            expect(season).toHaveProperty('index');
            expect(season).toHaveProperty('title');
            expect(season).toHaveProperty('episodes');
            expect(Array.isArray(season.episodes)).toBe(true);

            if (season.episodes.length > 0) {
              const episode = season.episodes[0];
              expect(episode).toHaveProperty('title');
              expect(episode).toHaveProperty('index');
            }
          }
        }
      }
    }, 120000); // 2 minutes timeout for loading the entire media library
  });

  describe('getAllMedia with filters', () => {
    it('should fetch only movies when filtered by movie type', async () => {
      // Only movies selection
      const result = await service.getAllMedia(['movie']);

      console.log(`Found ${result.data?.length || 0} movies`);

      // Check request success
      expect(result.success).toBe(true);

      // Check that all items are of movie type
      if (result.data && result.data.length > 0) {
        const allMovies = result.data.every(item => item.type === 'movie');
        expect(allMovies).toBe(true);

        // Check movie structure
        const movie = result.data[0];
        expect(movie).toHaveProperty('title');
        expect(movie).toHaveProperty('year');
        expect(movie.type).toBe('movie');
      }
    }, 60000); // 1 minute timeout

    it('should fetch only shows when filtered by show type', async () => {
      // Only shows selection
      const result = await service.getAllMedia(['show']);

      console.log(`Found ${result.data?.length || 0} shows`);

      // Check request success
      expect(result.success).toBe(true);

      // Check that all items are of show type
      if (result.data && result.data.length > 0) {
        const allShows = result.data.every(item => item.type === 'show');
        expect(allShows).toBe(true);

        // Check show structure
        const show = result.data[0];
        expect(show).toHaveProperty('title');
        expect(show).toHaveProperty('seasons');
        expect(show.type).toBe('show');

        if (show.seasons && show.seasons.length > 0) {
          console.log(`Sample show "${show.title}" has ${show.seasons.length} seasons`);
          console.log(`First season has ${show.seasons[0].episodes.length} episodes`);
        }
      }
    }, 60000); // 1 minute timeout
  });

  describe('token management', () => {
    it('should load token from file if available', async () => {
      // Get private token field using reflection
      const token = (service as any).token;

      // Check that token is defined
      expect(token).toBeDefined();

      // Make a request to ensure the token works
      const result = await service.getLibraries();
      expect(result.success).toBe(true);

      console.log('Token is valid, authentication successful');
    }, 30000);
  });
});
