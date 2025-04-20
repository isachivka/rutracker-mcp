import { parseCookie, cookiesToString, parseCookies } from '../utils/cookie.utils';
import { Cookie } from '../interfaces/rutracker.interface';

describe('Cookie Utilities', () => {
  describe('parseCookie', () => {
    it('should correctly parse a cookie string', () => {
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

    it('should correctly handle cookies without attributes', () => {
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
    it('should correctly convert an array of cookies to a string', () => {
      const cookies: Cookie[] = [
        { name: 'cookie1', value: 'value1', domain: '', path: '/' },
        { name: 'cookie2', value: 'value2', domain: '', path: '/' },
      ];

      const cookieString = cookiesToString(cookies);
      expect(cookieString).toBe('cookie1=value1; cookie2=value2');
    });

    it('should return an empty string for an empty array', () => {
      const cookies: Cookie[] = [];
      const cookieString = cookiesToString(cookies);
      expect(cookieString).toBe('');
    });
  });

  describe('parseCookies', () => {
    it('should handle an array of cookie strings', () => {
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
