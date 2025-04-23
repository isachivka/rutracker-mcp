import { Injectable } from '@nestjs/common';
import {
  SearchOptions,
  SearchResponse,
  TorrentSearchResult,
  TorrentDetails,
  TorrentDetailsOptions,
} from './interfaces/rutracker.interface';
import { parseCookies } from './utils/cookie.utils';
import * as iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import * as TurndownService from 'turndown';
import { BaseTorrentTrackerService, PageVisitResult } from '../common/base-tracker.service';

@Injectable()
export class RutrackerService extends BaseTorrentTrackerService {
  private readonly RE_RESULTS = new RegExp('Результатов\\sпоиска:\\s(\\d{1,3})\\s<span', 's');
  private readonly RESULTS_PER_PAGE = 50;
  private readonly turndownService: {
    turndown: (content: string) => string;
  };

  constructor(configService: ConfigService) {
    super(configService);
    this.turndownService = new TurndownService();

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

    // Get torrent files folder from config or use default
    const torrentFolder = this.configService.get<string>(
      CONFIG.RUTRACKER.TORRENT_FILES_FOLDER,
      './torrents',
    );

    // Resolve the absolute path for the torrent files folder
    this.torrentFilesFolder = path.isAbsolute(torrentFolder)
      ? torrentFolder
      : path.resolve(process.cwd(), torrentFolder);

    console.log(`Torrent files folder: ${this.torrentFilesFolder}`);
  }

  /**
   * Update login status based on whether bb_session cookie exists
   */
  protected updateLoginStatus(): void {
    const bbSessionCookie = this.cookies.find(cookie => cookie.name === 'bb_session');
    this.isLoggedIn = !!bbSessionCookie;
    console.log(`Login status updated: ${this.isLoggedIn}`);
  }

  /**
   * Check if user is logged in by looking for username in HTML
   * @param html HTML content to check
   * @returns Whether the user appears to be logged in
   */
  protected isLoggedInByHtml(html: string): boolean {
    if (!this.username) return false;

    // Look for the logged-in username element
    const usernamePattern = new RegExp(
      `<a id="logged-in-username"[^>]*href="[^"]*profile\\.php\\?mode=viewprofile[^"]*"[^>]*>${this.username}<\\/a>`,
      'i',
    );

    return usernamePattern.test(html);
  }

  /**
   * Process cookies from response
   */
  protected async processCookiesFromResponse(response: any): Promise<void> {
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
  }

  /**
   * Decode response data with appropriate encoding for RuTracker
   */
  protected decodeResponseData(data: Buffer): string {
    // RuTracker uses windows-1251 encoding by default
    return iconv.decode(data, 'win1251');
  }

  /**
   * Check if page is login page
   */
  protected isLoginPage(page: string): boolean {
    return page === 'login.php';
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
      await this.visit('login.php', {
        method: 'POST',
        data: formData,
        allowRedirects: false,
        checkSession: false,
      });

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
   * Search for torrents on RuTracker
   * @param options Search options
   * @returns Promise with search results
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const { query, page = 1, resultsPerPage = this.RESULTS_PER_PAGE } = options;

    if (!this.isLoggedIn) {
      console.log('Not logged in, attempting to login');
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Failed to login to RuTracker, cannot search');
      }
    }

    try {
      // Encode query for URL
      const encodedQuery = encodeURIComponent(query);

      // Calculate start parameter for pagination
      const start = (page - 1) * this.RESULTS_PER_PAGE;

      // Build search URL
      let searchUrl = `tracker.php?nm=${encodedQuery}`;
      if (start > 0) {
        searchUrl += `&start=${start}`;
      }

      // Perform search request
      const searchResult = await this.visit(searchUrl);

      // Process search results
      const results = await this.parseSearchResults(searchResult.body);

      // Extract total results from the page
      let totalResults = 0;
      const resultsMatch = this.RE_RESULTS.exec(searchResult.body);
      if (resultsMatch && resultsMatch[1]) {
        totalResults = parseInt(resultsMatch[1], 10);
      }

      // Calculate if there are more pages
      const hasMorePages = totalResults > page * resultsPerPage;

      return {
        results,
        totalResults,
        page,
        hasMorePages,
      };
    } catch (error) {
      console.error('Error searching RuTracker:', error.message);
      throw error;
    }
  }

  /**
   * Search all pages for a query
   * @param options Search options
   * @returns Promise with all search results
   */
  async searchAllPages(options: SearchOptions): Promise<TorrentSearchResult[]> {
    const firstPageResults = await this.search(options);

    // If there's only one page, return the results
    if (!firstPageResults.hasMorePages) {
      return firstPageResults.results;
    }

    // Calculate total pages
    const totalPages = Math.ceil(
      firstPageResults.totalResults / (options.resultsPerPage || this.RESULTS_PER_PAGE),
    );

    // Create an array of promises for remaining pages
    const pagePromises = [];
    for (let i = 2; i <= totalPages; i++) {
      const pageOptions = { ...options, page: i };
      pagePromises.push(this.search(pageOptions));
    }

    // Execute all promises concurrently
    const remainingResults = await Promise.all(pagePromises);

    // Combine all results
    const allResults = [
      ...firstPageResults.results,
      ...remainingResults.flatMap(result => result.results),
    ];

    return allResults;
  }

  /**
   * Parse search results from HTML
   * @param html HTML content from search page
   * @returns Array of parsed torrent results
   */
  private async parseSearchResults(html: string): Promise<TorrentSearchResult[]> {
    const results: TorrentSearchResult[] = [];

    // Use regex to extract torrent information
    const regex =
      /<a\sdata-topic_id="(\d+?)".+?>(.+?)<\/a.+?tor-size"\sdata-ts_text="(\d+?)">.+?data-ts_text="([-\d]+?)">.+?Личи">(\d+?)<\/.+?data-ts_text="(\d+?)">/gs;

    let match;
    while ((match = regex.exec(html)) !== null) {
      const [, id, name, size, seedersStr, leechers, pubDateStr] = match;

      // Some entries might have negative seeders indicating issues, so we handle that
      const seeders = Math.max(0, parseInt(seedersStr, 10));

      const result: TorrentSearchResult = {
        id,
        name: this.decodeHtmlEntities(name),
        size: parseInt(size, 10),
        seeders,
        leechers: parseInt(leechers, 10),
        pubDate: parseInt(pubDateStr, 10),
        downloadLink: `${this.baseUrl}dl.php?t=${id}`,
        topicLink: `${this.baseUrl}viewtopic.php?t=${id}`,
      };

      results.push(result);
    }

    return results;
  }

  /**
   * Get magnet link for a torrent
   * @param topicId Topic ID of the torrent
   * @returns Promise with magnet link
   */
  async getMagnetLink(topicId: string): Promise<string> {
    try {
      const topicUrl = `viewtopic.php?t=${topicId}`;
      const response = await this.visit(topicUrl);

      // Extract magnet link from the topic page
      const magnetRegex = /href="(magnet:\?xt=urn:btih:[^"]+)"/;
      const match = magnetRegex.exec(response.body);

      if (match && match[1]) {
        return match[1];
      }

      throw new Error('Magnet link not found in the topic page');
    } catch (error) {
      console.error(`Error getting magnet link for topic ${topicId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get details for a torrent topic by ID
   * @param options Options with torrent ID
   * @returns Promise with torrent details
   */
  async getTorrentDetails(options: TorrentDetailsOptions): Promise<TorrentDetails> {
    try {
      const { id } = options;
      const topicId = id.includes('viewtopic.php?t=') ? id.split('viewtopic.php?t=')[1] : id;

      const topicUrl = `viewtopic.php?t=${topicId}`;
      const response = await this.visit(topicUrl);

      // Extract title from the page
      const titleRegex = /<title>(.+?)<\/title>/i;
      const titleMatch = titleRegex.exec(response.body);
      const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1]) : undefined;

      const content = this.turndownService.turndown(this.processContent(response.body));

      // Try to get magnet link
      let magnetLink;
      try {
        magnetLink = await this.getMagnetLink(topicId);
      } catch (e) {
        console.warn(`Could not get magnet link for topic ${topicId}: ${e.message}`);
      }

      return {
        id: topicId,
        title,
        content,
        magnetLink,
        downloadLink: `${this.baseUrl}dl.php?t=${topicId}`,
      };
    } catch (error) {
      console.error(`Error getting torrent details for ID ${options.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Process HTML content by removing everything before <div class="post_wrap" and after <!--/post_body--> and newlines/tabs
   * @param content HTML content to process
   * @returns Processed HTML content
   */
  private processContent(content: string): string {
    // Find the start and end markers
    const startIndex = content.indexOf('<div class="post_body"');

    let processedContent = content;

    // Cut from start if marker found
    if (startIndex > -1) {
      processedContent = processedContent.substring(startIndex);
    }

    const endMarker = '<!--/post_body-->';
    const endIndex = processedContent.indexOf(endMarker);

    // Cut to end if marker found, including the end marker itself
    if (endIndex > -1) {
      // Adding the length of the end marker to completely remove it
      processedContent = processedContent.substring(0, endIndex);
      console.log(`End marker found at ${endIndex}. Content trimmed.`);
    } else {
      console.log('End marker <!--/post_body--> not found in the content');
    }

    // Remove newlines and tabs
    return processedContent.replace(/[\n\t]/g, '');
  }

  /**
   * Download .torrent file for a specific torrent
   * @param topicId Topic ID of the torrent
   * @returns Promise with path to the downloaded torrent file
   */
  async downloadTorrentFile(topicId: string): Promise<string> {
    console.log(`Downloading torrent file for topic ID: ${topicId}`);

    try {
      // Ensure we are logged in
      if (!this.isLoggedIn) {
        console.log('Not logged in, attempting to login before downloading torrent file');
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Failed to login to RuTracker, cannot download torrent file');
        }
      }

      // Create torrents directory if it doesn't exist
      if (!fs.existsSync(this.torrentFilesFolder)) {
        console.log(`Creating torrent files directory: ${this.torrentFilesFolder}`);
        await fs.promises.mkdir(this.torrentFilesFolder, { recursive: true });
      }

      const downloadUrl = `dl.php?t=${topicId}`;

      console.log(`Sending request to download URL: ${this.baseUrl}${downloadUrl}`);

      // Download the torrent file with binary response type
      const response = await this.visit(downloadUrl, {
        method: 'GET',
        isBinary: true,
        allowRedirects: true,
        checkSession: true,
      });

      // Make sure the response is a torrent file
      // For binary data, check if it's a Buffer and has a reasonable size
      const isTorrentFile =
        Buffer.isBuffer(response.body) && response.body.length > 100 && response.body[0] === 100; // 'd' in ASCII is 100

      if (!isTorrentFile) {
        console.error(
          'Response does not appear to be a valid torrent file: \n',
          response.body.toString(),
        );

        throw new Error('Failed to download valid torrent file');
      }

      // Generate filename
      const filename = `${topicId}.torrent`;
      const filePath = path.join(this.torrentFilesFolder, filename);

      console.log(`Writing torrent file to: ${filePath}`);

      // Write the torrent file as raw binary data
      await fs.promises.writeFile(filePath, response.body);

      console.log(`Successfully downloaded torrent file: ${filename}`);

      return filePath;
    } catch (error) {
      console.error(`Error downloading torrent file for topic ${topicId}:`, error.message);
      throw new Error(`Failed to download torrent file: ${error.message}`);
    }
  }
}
