import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Cookie, PageVisitResult } from './interfaces/rutracker.interface';
import { parseCookies } from './utils/cookie.utils';
import * as iconv from 'iconv-lite';

@Injectable()
export class RutrackerService {
  private cookies: Cookie[] = [];
  private rawCookies: string[] = [];

  /**
   * Base URL for RuTracker
   */
  private readonly baseUrl = 'https://rutracker.org/forum/';

  /**
   * Generic method to visit any page on RuTracker
   * @param page The page path (relative to baseUrl)
   * @param method HTTP method to use
   * @param data Optional data to send with request (for POST, PUT, etc.)
   * @returns Promise with visit result (cookies and page body)
   */
  async visit(page: string, method: Method = 'GET', data?: any): Promise<PageVisitResult> {
    const url = this.baseUrl + page;

    try {
      const options: AxiosRequestConfig = {
        method,
        url,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        },
        maxRedirects: 5,
        validateStatus: status => status < 400, // Only reject if status code is >= 400
        responseType: 'arraybuffer', // Important for correct encoding handling
      };

      // Add cookies if we have them from previous requests
      if (this.rawCookies.length > 0) {
        const cookieHeader = this.rawCookies.map(cookie => cookie.split(';')[0]).join('; ');
        options.headers['Cookie'] = cookieHeader;
      }

      // Add data for non-GET requests
      if (data && method !== 'GET') {
        options.data = data;
      }

      const response = await axios(options);

      // Extract cookies from response
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        this.rawCookies = setCookieHeaders;
        this.cookies = parseCookies(setCookieHeaders);
        console.log('Cookies saved:', this.cookies);
      }

      // Convert body from Windows-1251 to UTF-8
      const contentType = response.headers['content-type'] || '';
      let body = '';

      if (response.data) {
        // Check if content-type header indicates Windows-1251 encoding
        if (contentType.includes('windows-1251') || contentType.includes('charset=windows-1251')) {
          body = iconv.decode(Buffer.from(response.data), 'win1251');
        } else {
          // Auto-detect encoding or use win1251 by default for RuTracker
          body = iconv.decode(Buffer.from(response.data), 'win1251');
        }
      }

      return {
        cookies: this.cookies,
        body,
      };
    } catch (error) {
      console.error('Error visiting RuTracker:', error.message);
      throw error;
    }
  }

  /**
   * Visit the main page of RuTracker
   * @returns Promise with visit result (cookies and page body)
   */
  async visitMainPage(): Promise<PageVisitResult> {
    return this.visit('index.php');
  }
}
