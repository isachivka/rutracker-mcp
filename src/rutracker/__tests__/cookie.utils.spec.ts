import { parseCookie, cookiesToString, parseCookies } from '../utils/cookie.utils';
import { Cookie } from '../interfaces/rutracker.interface';

describe('Cookie Utilities', () => {
  describe('parseCookie', () => {
    it('должен корректно парсить строку с куки', () => {
      const cookieString =
        'name=value; Domain=example.com; Path=/; Expires=Wed, 21 Oct 2023 07:28:00 GMT; HttpOnly; Secure';
      const cookie = parseCookie(cookieString);

      expect(cookie).toEqual({
        name: 'name',
        value: 'value',
        domain: 'example.com',
        path: '/',
        expires: expect.any(Date),
        httpOnly: true,
        secure: true,
      });
    });

    it('должен корректно обрабатывать куки без атрибутов', () => {
      const cookieString = 'name=value';
      const cookie = parseCookie(cookieString);

      expect(cookie).toEqual({
        name: 'name',
        value: 'value',
        domain: '',
        path: '/',
      });
    });
  });

  describe('cookiesToString', () => {
    it('должен корректно преобразовывать массив куки в строку', () => {
      const cookies: Cookie[] = [
        { name: 'cookie1', value: 'value1', domain: '', path: '/' },
        { name: 'cookie2', value: 'value2', domain: '', path: '/' },
      ];

      const cookieString = cookiesToString(cookies);
      expect(cookieString).toBe('cookie1=value1; cookie2=value2');
    });

    it('должен возвращать пустую строку для пустого массива', () => {
      const cookies: Cookie[] = [];
      const cookieString = cookiesToString(cookies);
      expect(cookieString).toBe('');
    });
  });

  describe('parseCookies', () => {
    it('должен обрабатывать массив cookie строк', () => {
      const cookieStrings = [
        'cookie1=value1; Domain=example.com; Path=/',
        'cookie2=value2; HttpOnly',
      ];

      const cookies = parseCookies(cookieStrings);

      expect(cookies).toHaveLength(2);
      expect(cookies[0]).toEqual({
        name: 'cookie1',
        value: 'value1',
        domain: 'example.com',
        path: '/',
      });
      expect(cookies[1]).toEqual({
        name: 'cookie2',
        value: 'value2',
        domain: '',
        path: '/',
        httpOnly: true,
      });
    });
  });
});
