import { Cookie } from '../interfaces/rutracker.interface';

/**
 * Parse a Set-Cookie header string into a Cookie object
 * @param cookieString The Set-Cookie header string
 * @returns Cookie object
 */
export function parseCookie(cookieString: string): Cookie {
  const parts = cookieString.split(';').map(part => part.trim());
  const [nameValue, ...attributes] = parts;

  const [name, value] = nameValue.split('=');

  const cookie: Cookie = {
    name,
    value,
    domain: '',
    path: '/',
  };

  attributes.forEach(attribute => {
    const [key, val] = attribute.split('=');
    const keyLower = key.toLowerCase();

    if (keyLower === 'domain') {
      cookie.domain = val || '';
    } else if (keyLower === 'path') {
      cookie.path = val || '/';
    } else if (keyLower === 'expires') {
      cookie.expires = val ? new Date(val) : undefined;
    } else if (keyLower === 'httponly') {
      cookie.httpOnly = true;
    } else if (keyLower === 'secure') {
      cookie.secure = true;
    }
  });

  return cookie;
}

/**
 * Convert Cookie objects to a string that can be used in the Cookie header
 * @param cookies Array of Cookie objects
 * @returns Cookie header string
 */
export function cookiesToString(cookies: Cookie[]): string {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

/**
 * Parse an array of Set-Cookie header strings into Cookie objects
 * @param cookieStrings Array of Set-Cookie header strings
 * @returns Array of Cookie objects
 */

export function parseCookies(cookieStrings: string[]): Cookie[] {
  return cookieStrings.map(parseCookie);
}
