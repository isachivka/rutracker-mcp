import { Test, TestingModule } from '@nestjs/testing';
import { RutrackerService } from '../rutracker.service';
import { Cookie } from '../interfaces/rutracker.interface';
import { ConfigModule } from '@nestjs/config';

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
});
