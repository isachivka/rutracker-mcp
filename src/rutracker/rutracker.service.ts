import { Injectable, OnModuleInit } from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Cookie, PageVisitResult } from './interfaces/rutracker.interface';
import { parseCookies } from './utils/cookie.utils';
import * as iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RutrackerService implements OnModuleInit {
  private cookies: Cookie[] = [];
  private rawCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private isLoggedIn: boolean = false;
  private readonly cookieFilePath: string;
  private isReloggingIn: boolean = false; // Flag to prevent login recursion

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      CONFIG.RUTRACKER.BASE_URL,
      'https://rutracker.org/forum/',
    );
    this.username = this.configService.get<string>(CONFIG.RUTRACKER.USERNAME, '');
    this.password = this.configService.get<string>(CONFIG.RUTRACKER.PASSWORD, '');

    // Get cookie file path from config or use default
    const cookieFile = this.configService.get<string>(
      CONFIG.RUTRACKER.COOKIE_FILE,
      'rutracker.cookie',
    );

    // Resolve the absolute path for the cookie file
    this.cookieFilePath = path.isAbsolute(cookieFile)
      ? cookieFile
      : path.resolve(process.cwd(), cookieFile);

    console.log(`Cookie file path: ${this.cookieFilePath}`);
  }

  /**
   * Initialize the service by loading cookies from file
   */
  async onModuleInit() {
    console.log('🔄 Initializing RutrackerService, loading cookies from file...');
    await this.loadCookiesFromFile();
    this.updateLoginStatus();
    console.log(`👤 Initial login status: ${this.isLoggedIn}`);
  }

  /**
   * Load cookies from the cookie file
   */
  private async loadCookiesFromFile(): Promise<void> {
    try {
      if (fs.existsSync(this.cookieFilePath)) {
        const cookieData = await fs.promises.readFile(this.cookieFilePath, 'utf8');
        if (cookieData) {
          const cookies = JSON.parse(cookieData);
          if (Array.isArray(cookies)) {
            this.cookies = cookies;

            // Generate raw cookies for headers
            this.rawCookies = cookies.map(
              cookie => `${cookie.name}=${cookie.value}; path=${cookie.path}`,
            );

            console.log(`Loaded ${cookies.length} cookies from file`);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading cookies from file: ${error.message}`);
    }
  }

  /**
   * Save cookies to the cookie file
   */
  private async saveCookiesToFile(): Promise<void> {
    try {
      const dirPath = path.dirname(this.cookieFilePath);

      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }

      await fs.promises.writeFile(
        this.cookieFilePath,
        JSON.stringify(this.cookies, null, 2),
        'utf8',
      );

      console.log(`Saved ${this.cookies.length} cookies to file`);
    } catch (error) {
      console.error(`Error saving cookies to file: ${error.message}`);
    }
  }

  /**
   * Update login status based on whether bb_session cookie exists
   */
  private updateLoginStatus(): void {
    const bbSessionCookie = this.cookies.find(cookie => cookie.name === 'bb_session');
    this.isLoggedIn = !!bbSessionCookie;
    console.log(`Login status updated: ${this.isLoggedIn}`);
  }

  /**
   * Check if user is logged in by looking for username in HTML
   * @param html HTML content to check
   * @returns Whether the user appears to be logged in
   */
  private isLoggedInByHtml(html: string): boolean {
    if (!this.username) return false;

    // Look for the logged-in username element
    const usernamePattern = new RegExp(
      `<a id="logged-in-username"[^>]*href="[^"]*profile\\.php\\?mode=viewprofile[^"]*"[^>]*>${this.username}<\\/a>`,
      'i',
    );

    return usernamePattern.test(html);
  }

  /**
   * Generic method to visit any page on RuTracker
   * @param page The page path (relative to baseUrl)
   * @param method HTTP method to use
   * @param data Optional data to send with request (for POST, PUT, etc.)
   * @param allowRedirects Whether to allow automatic redirects
   * @param checkSession Whether to check if session is valid and relogin if needed
   * @returns Promise with visit result (cookies and page body)
   */
  async visit(
    page: string,
    method: Method = 'GET',
    data?: any,
    allowRedirects: boolean = true,
    checkSession: boolean = true,
  ): Promise<PageVisitResult> {
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
        maxRedirects: allowRedirects ? 5 : 0, // Only follow redirects if allowed
        validateStatus: allowRedirects
          ? _status => _status < 400 // Only reject if status code is >= 400 when redirects are allowed
          : () => true, // Accept all status codes when disabling redirects
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
        this.cookies = [...this.cookies, ...parseCookies(setCookieHeaders)];
        console.log('Cookies saved:', this.cookies);

        // Save cookies to file after each update
        await this.saveCookiesToFile();

        // Update login status
        this.updateLoginStatus();
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

      // Check if login session is valid by looking for username in HTML
      // Only for non-login requests and when not already in the process of re-logging in
      if (checkSession && page !== 'login.php' && !this.isReloggingIn && this.username) {
        const isLoggedInByHtml = this.isLoggedInByHtml(body);
        console.log(`Username check in HTML: ${isLoggedInByHtml ? 'FOUND' : 'NOT FOUND'}`);

        if (!isLoggedInByHtml && this.username && this.password) {
          console.log('Session appears to be expired, attempting to re-login');
          this.isReloggingIn = true;

          // Try to login again
          const loginSuccess = await this.login();

          if (loginSuccess) {
            console.log('Re-login successful, repeating original request');
            // Repeat the original request now that we're logged in
            this.isReloggingIn = false;
            return this.visit(page, method, data, allowRedirects, false); // Don't check session again
          } else {
            console.error('Failed to re-login');
            this.isReloggingIn = false;
          }
        }
      }

      return {
        cookies: this.cookies,
        body,
        statusCode: response.status,
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

  /**
   * Login to RuTracker using configured credentials
   * @returns Promise with login result
   */
  async login(): Promise<boolean> {
    try {
      // First visit the login page to get any required cookies
      await this.visitMainPage();

      // Prepare login form data
      const formData = new URLSearchParams();
      formData.append('login_username', this.username);
      formData.append('login_password', this.password);
      formData.append('login', '\u0432\u0445\u043e\u0434');

      // Submit login form WITHOUT allowing redirects to capture cookies
      // Don't check session validity for login request (to avoid recursion)
      await this.visit('login.php', 'POST', formData, false, false);

      // Check if bb_session cookie was set after login attempt
      const bbSessionCookie = this.cookies.find(cookie => cookie.name === 'bb_session');
      const isSuccess = !!bbSessionCookie;

      this.isLoggedIn = isSuccess;

      if (isSuccess) {
        console.log('Successfully logged into RuTracker');
      } else {
        console.error('Failed to login to RuTracker - bb_session cookie not found');
      }

      return isSuccess;
    } catch (error) {
      console.error('Error during RuTracker login:', error.message);
      this.isLoggedIn = false;
      return false;
    }
  }

  /**
   * Check if the service is currently logged in
   * @returns Current login status
   */
  getLoginStatus(): boolean {
    return this.isLoggedIn;
  }
}
