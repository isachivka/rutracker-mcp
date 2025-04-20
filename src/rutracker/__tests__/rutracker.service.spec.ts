import { Test, TestingModule } from '@nestjs/testing';
import { RutrackerService } from '../rutracker.service';
import { Cookie } from '../interfaces/rutracker.interface';
import axios from 'axios';

describe('RutrackerService', () => {
  let service: RutrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RutrackerService],
    }).compile();

    service = module.get<RutrackerService>(RutrackerService);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('visit', () => {
    it('должен успешно подключиться к сайту и получить куки и тело страницы', async () => {
      // Выполняем реальный запрос к сайту
      const result = await service.visit('index.php');
      
      // Проверяем, что метод возвращает объект с cookies и body
      expect(result).toHaveProperty('cookies');
      expect(result).toHaveProperty('body');
      
      // Проверяем, что cookies это массив
      expect(Array.isArray(result.cookies)).toBe(true);
      
      // Проверяем, что body это непустая строка
      expect(typeof result.body).toBe('string');
      expect(result.body.length).toBeGreaterThan(0);
      
      // Проверяем структуру Cookie объектов, если куки были получены
      if (result.cookies.length > 0) {
        result.cookies.forEach((cookie: Cookie) => {
          expect(cookie).toHaveProperty('name');
          expect(cookie).toHaveProperty('value');
          expect(cookie).toHaveProperty('domain');
          expect(cookie).toHaveProperty('path');
        });
      }
    }, 30000); // Увеличиваем таймаут до 30 секунд для внешнего запроса
  });

  describe('visitMainPage', () => {
    it('должен вызывать метод visit с правильными параметрами', async () => {
      // Используем шпион для проверки вызова visit с правильными параметрами
      const visitSpy = jest.spyOn(service, 'visit').mockResolvedValueOnce({
        cookies: [],
        body: 'test body'
      });
      
      await service.visitMainPage();
      expect(visitSpy).toHaveBeenCalledWith('index.php');
    });
  });
}); 