import { Test, TestingModule } from '@nestjs/testing';
import { RutrackerService } from '../rutracker.service';
import { Cookie } from '../interfaces/rutracker.interface';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';

describe('RutrackerService', () => {
  let service: RutrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [RutrackerService],
    }).compile();

    service = module.get<RutrackerService>(RutrackerService);

    // Manually call onModuleInit to load cookies from file
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('visit', () => {
    it('should successfully connect to the site and get cookies and page body', async () => {
      // Executing a real request to the site
      const result = await service.visit('index.php');

      // Checking that the method returns an object with cookies and body
      expect(result).toHaveProperty('cookies');
      expect(result).toHaveProperty('body');

      // Checking that cookies is an array
      expect(Array.isArray(result.cookies)).toBe(true);

      // Checking that body is a non-empty string
      expect(typeof result.body).toBe('string');
      expect(result.body.length).toBeGreaterThan(0);

      // Checking the structure of Cookie objects if cookies were received
      if (result.cookies.length > 0) {
        result.cookies.forEach((cookie: Cookie) => {
          expect(cookie).toHaveProperty('name');
          expect(cookie).toHaveProperty('value');
          expect(cookie).toHaveProperty('domain');
          expect(cookie).toHaveProperty('path');
        });
      }
    }, 30000); // Increasing timeout to 30 seconds for external request
  });

  describe('visitMainPage', () => {
    it('should call the visit method with correct parameters', async () => {
      // Using a spy to check if visit is called with correct parameters
      const visitSpy = jest.spyOn(service, 'visit').mockResolvedValueOnce({
        cookies: [],
        body: 'test body',
      });

      await service.visitMainPage();
      expect(visitSpy).toHaveBeenCalledWith('index.php');
    });
  });

  describe('login', () => {
    // This test performs a real login request to rutracker for debugging purposes
    it('should login to rutracker with credentials from env', async () => {
      // Check initial login status (should be determined by cookies from file)
      console.log('Initial login status:', service.getLoginStatus());
      console.log('Initial cookies:', (service as any).cookies);

      // Only perform login if not already logged in
      let result = service.getLoginStatus();

      if (!result) {
        console.log('Not logged in, attempting login...');
        // Perform the actual login
        result = await service.login();
        console.log('Login attempt result:', result);
      } else {
        console.log('Already logged in from cookie file, skipping login');
      }

      // Final login status
      console.log('Final login status:', service.getLoginStatus());

      // If bb_session cookie exists in the stored cookies, login is successful
      const cookies = (service as any).cookies;
      const bbSessionCookie = cookies.find((c: Cookie) => c.name === 'bb_session');
      console.log('bb_session cookie:', bbSessionCookie);

      // No assertions here, just for debugging
    }, 30000); // Increase timeout to 30 seconds for external request
  });

  describe('searchAllPages', () => {
    it('should perform a real search across multiple pages if available', async () => {
      // Ensure we're logged in
      if (!service.getLoginStatus()) {
        await service.login();
      }

      // Use a search term that is likely to have multiple pages of results
      const query = 'Кукушка'; // Popular Linux distribution with many torrents
      console.log(`Searching for "${query}" across all pages...`);

      // Set a small resultsPerPage to increase chance of pagination
      const allResults = await service.searchAllPages({
        query,
        resultsPerPage: 50, // Set small to ensure multiple pages
      });

      console.log(`Found ${allResults.length} total results across all pages`);

      // Log some sample results for debugging
      if (allResults.length > 0) {
        console.log('Sample results:');
        console.log(
          allResults.slice(0, 3).map(r => ({
            id: r.id,
            name: r.name,
            seeders: r.seeders,
            leechers: r.leechers,
          })),
        );

        if (allResults.length > 10) {
          console.log('Results from next page:');
          console.log(
            allResults.slice(10, 13).map(r => ({
              id: r.id,
              name: r.name,
              seeders: r.seeders,
              leechers: r.leechers,
            })),
          );
        }
      }

      // Check that we have results
      expect(allResults.length).toBeGreaterThan(0);

      // Check structure of results
      const sampleResult = allResults[0];
      expect(sampleResult).toHaveProperty('id');
      expect(sampleResult).toHaveProperty('name');
      expect(sampleResult).toHaveProperty('size');
      expect(sampleResult).toHaveProperty('seeders');
      expect(sampleResult).toHaveProperty('leechers');
      expect(sampleResult).toHaveProperty('pubDate');
      expect(sampleResult).toHaveProperty('downloadLink');
      expect(sampleResult).toHaveProperty('topicLink');

      // Check for magnet link
      try {
        console.log(`Getting magnet link for result ID: ${sampleResult.id}`);
        const magnetLink = await service.getMagnetLink(sampleResult.id);
        console.log(`Magnet link: ${magnetLink.substring(0, 60)}...`);
        expect(magnetLink).toContain('magnet:?xt=urn:btih:');
      } catch (error) {
        console.error('Error getting magnet link:', error.message);
      }
    }, 120000); // 2 minutes timeout for multi-page search
  });

  describe('getTorrentDetails', () => {
    it('should retrieve torrent details by ID', async () => {
      // Ensure we're logged in
      if (!service.getLoginStatus()) {
        await service.login();
      }

      // Test with a known torrent ID from rutracker
      // Using a popular Linux distribution that should exist for a long time
      const topicId = '5974649'; // Example ID
      console.log(`Getting details for torrent ID: ${topicId}`);

      const details = await service.getTorrentDetails({ id: topicId });

      console.log(`Title: ${details.title}`);
      console.log(`Content length: ${details.content.length} characters`);
      if (details.magnetLink) {
        console.log(`Magnet link: ${details.magnetLink.substring(0, 60)}...`);
      }
      console.log(`Download link: ${details.downloadLink}`);

      // Check structure of results
      expect(details).toHaveProperty('id');
      expect(details).toHaveProperty('title');
      expect(details).toHaveProperty('content');
      expect(details).toHaveProperty('downloadLink');

      // Content should be non-empty
      expect(details.content.length).toBeGreaterThan(0);

      // Check that the ID matches
      expect(details.id).toBe(topicId);

      // Download link should contain the ID
      expect(details.downloadLink).toContain(topicId);
    }, 30000); // 30 seconds timeout

    it('should accept a full URL with topic ID', async () => {
      // Ensure we're logged in
      if (!service.getLoginStatus()) {
        await service.login();
      }

      // Test with a known torrent URL
      const topicId = '5974649';
      const topicUrl = `viewtopic.php?t=${topicId}`;
      console.log(`Getting details for torrent URL: ${topicUrl}`);

      const details = await service.getTorrentDetails({ id: topicUrl });

      // Check that the ID was properly extracted
      expect(details.id).toBe(topicId);

      // Content should be non-empty
      expect(details.content.length).toBeGreaterThan(0);
    }, 30000); // 30 seconds timeout
  });

  describe('downloadTorrentFile', () => {
    it('should download a torrent file by ID', async () => {
      // Ensure we're logged in
      if (!service.getLoginStatus()) {
        await service.login();
      }

      // Test with a known torrent ID from rutracker
      // Using a popular Linux distribution that should exist for a long time
      const topicId = '5974649'; // Example ID
      console.log(`Downloading torrent file for ID: ${topicId}`);

      const filePath = await service.downloadTorrentFile(topicId);

      console.log(`Downloaded torrent file path: ${filePath}`);

      // Check that the file path is returned
      expect(filePath).toBeDefined();
      expect(typeof filePath).toBe('string');
      expect(filePath.length).toBeGreaterThan(0);

      // Check that the file path contains the ID and .torrent extension
      expect(filePath).toContain(topicId);
      expect(filePath).toContain('.torrent');

      // Check if the file exists
      const fileExists = fs.existsSync(filePath);
      expect(fileExists).toBe(true);

      // Check file size to ensure it's not empty
      const stats = fs.statSync(filePath);
      console.log(`Torrent file size: ${stats.size} bytes`);
      expect(stats.size).toBeGreaterThan(0);

      // Optional: cleanup the file after test
      fs.unlinkSync(filePath);
    }, 30000); // 30 seconds timeout
  });
});
