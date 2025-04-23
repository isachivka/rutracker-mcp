import { Injectable, OnModuleInit } from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';

export interface Cookie {
  name: string;
  value: string;
  path: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface PageVisitResult {
  cookies: Cookie[];
  body: any;
  statusCode: number;
}

export interface VisitOptions {
  method?: Method;
  data?: any;
  allowRedirects?: boolean;
  checkSession?: boolean;
  isBinary?: boolean;
}

/**
 * Base abstract class for torrent tracker services
 */
@Injectable()
export abstract class BaseTorrentTrackerService implements OnModuleInit {
  protected cookies: Cookie[] = [];
  protected rawCookies: string[] = [];
  protected baseUrl: string;
  protected username: string;
  protected password: string;
  protected isLoggedIn: boolean = false;
  protected cookieFilePath: string;
  protected isReloggingIn: boolean = false;
  protected torrentFilesFolder: string;

  constructor(protected configService: ConfigService) {
    this.baseUrl = '';
    this.username = '';
    this.password = '';
    this.cookieFilePath = '';
    this.torrentFilesFolder = '';
  }

  /**
   * Initialize the service by loading cookies from file
   */
  async onModuleInit() {
    console.log(`🔄 Initializing ${this.constructor.name}, loading cookies from file...`);
    await this.loadCookiesFromFile();
    this.updateLoginStatus();
    console.log(`👤 Initial login status: ${this.isLoggedIn}`);
  }

  /**
   * Load cookies from the cookie file
   */
  protected async loadCookiesFromFile(): Promise<void> {
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
  protected async saveCookiesToFile(): Promise<void> {
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
   * Update login status
   */
  protected abstract updateLoginStatus(): void;

  /**
   * Check if user is logged in by HTML content
   */
  protected abstract isLoggedInByHtml(html: string): boolean;

  /**
   * Generic method to visit any page on the tracker
   */
  async visit(page: string, options: VisitOptions = {}): Promise<PageVisitResult> {
    const {
      method = 'GET',
      data,
      allowRedirects = true,
      checkSession = true,
      isBinary = false,
    } = options;

    const url = this.baseUrl + page;

    try {
      // Setup request configuration
      const requestConfig = this.createRequestConfig(url, method, data, allowRedirects);

      // Execute the request
      const response = await axios(requestConfig);

      // Process cookies from response
      await this.processCookiesFromResponse(response);

      // Process response body
      const body = this.processResponseBody(response, isBinary);

      // Check session validity and relogin if necessary
      if (this.shouldCheckSession(isBinary, checkSession, page)) {
        const isLoggedInByHtml = this.isLoggedInByHtml(body);

        if (!isLoggedInByHtml && this.username && this.password) {
          console.log('Session appears to be expired, attempting to re-login');
          const reLoginResult = await this.handleSessionReLogin();

          if (reLoginResult) {
            console.log('Re-login successful, repeating original request');
            // Repeat the original request with session check disabled
            return this.visit(page, {
              ...options,
              checkSession: false, // Prevent infinite recursion
            });
          }
        }
      }

      return {
        cookies: this.cookies,
        body,
        statusCode: response.status,
      };
    } catch (error) {
      console.error(`Error visiting ${this.constructor.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Creates request configuration for axios
   */
  protected createRequestConfig(
    url: string,
    method: Method,
    data?: any,
    allowRedirects: boolean = true,
  ): AxiosRequestConfig {
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
      maxRedirects: allowRedirects ? 5 : 0,
      validateStatus: allowRedirects ? _status => _status < 400 : () => true,
      responseType: 'arraybuffer',
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

    return options;
  }

  /**
   * Process cookies from response
   */
  protected abstract processCookiesFromResponse(response: any): Promise<void>;

  /**
   * Process response body based on binary flag
   */
  protected processResponseBody(response: any, isBinary: boolean): any {
    if (isBinary) {
      // For binary data, don't attempt to decode and just return the raw buffer
      return Buffer.from(response.data);
    }

    // Convert body from Windows-1251 to UTF-8 for text data
    const contentType = response.headers['content-type'] || '';

    if (response.data) {
      // Check if content-type header indicates specific encoding
      if (contentType.includes('windows-1251') || contentType.includes('charset=windows-1251')) {
        return iconv.decode(Buffer.from(response.data), 'win1251');
      } else {
        // Use default encoding or auto-detect based on tracker
        return this.decodeResponseData(Buffer.from(response.data), contentType);
      }
    }

    return '';
  }

  /**
   * Decode response data with appropriate encoding
   */
  protected abstract decodeResponseData(data: Buffer, contentType: string): string;

  /**
   * Check if session validation should be performed
   */
  protected shouldCheckSession(isBinary: boolean, checkSession: boolean, page: string): boolean {
    return (
      !isBinary && checkSession && !this.isLoginPage(page) && !this.isReloggingIn && !!this.username
    );
  }

  /**
   * Check if page is login page to avoid session check
   */
  protected abstract isLoginPage(page: string): boolean;

  /**
   * Handle session re-login process
   */
  protected async handleSessionReLogin(): Promise<boolean> {
    this.isReloggingIn = true;

    try {
      // Clear all cookies before re-login attempt
      await this.clearCookies();

      // Try to login again
      const loginSuccess = await this.login();
      return loginSuccess;
    } finally {
      this.isReloggingIn = false;
    }
  }

  /**
   * Visit the main page of tracker
   */
  abstract visitMainPage(): Promise<PageVisitResult>;

  /**
   * Login to tracker using configured credentials
   */
  abstract login(): Promise<boolean>;

  /**
   * Check if the service is currently logged in
   */
  getLoginStatus(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Decode HTML entities in a string
   */
  protected decodeHtmlEntities(text: string): string {
    // Basic HTML entity decoding
    return text
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
  }

  /**
   * Clear all cookies in memory and in the cookie file
   */
  protected async clearCookies(): Promise<void> {
    console.log('Clearing all cookies from memory and file');
    this.cookies = [];
    this.rawCookies = [];
    this.isLoggedIn = false;

    try {
      // Clear the cookie file by writing an empty array
      await fs.promises.writeFile(this.cookieFilePath, JSON.stringify([]), 'utf8');
      console.log('Cookie file cleared');
    } catch (error) {
      console.error(`Error clearing cookie file: ${error.message}`);
    }
  }

  /**
   * Download .torrent file
   */
  abstract downloadTorrentFile(id: string): Promise<string>;
}
