import { Method } from 'axios';

/**
 * Cookie interface to store parsed cookie information
 */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

/**
 * PageVisitResult interface to store response from site visit
 */
export interface PageVisitResult {
  cookies: Cookie[];
  body: string;
  statusCode?: number;
}

/**
 * SearchResult interface to store individual torrent search result
 */
export interface TorrentSearchResult {
  id: string;
  name: string;
  size: number;
  seeders: number;
  leechers: number;
  pubDate: number;
  downloadLink: string;
  topicLink: string;
}

/**
 * SearchResponse interface to store complete search response
 */
export interface SearchResponse {
  results: TorrentSearchResult[];
  totalResults: number;
  page: number;
  hasMorePages: boolean;
}

/**
 * SearchOptions interface for search parameters
 */
export interface SearchOptions {
  query: string;
  page?: number;
  resultsPerPage?: number;
}

/**
 * API Response interface for external clients
 */
export interface ApiSearchResponse {
  success: boolean;
  data?: {
    results: TorrentSearchResult[];
    totalResults: number;
    page: number;
    hasMorePages: boolean;
  };
  error?: string;
}

/**
 * TorrentDetails interface to store torrent topic details
 */
export interface TorrentDetails {
  id: string;
  title?: string;
  content: string;
  magnetLink?: string;
  downloadLink: string;
}

/**
 * API Torrent Details Response interface for external clients
 */
export interface ApiTorrentDetailsResponse {
  success: boolean;
  data?: TorrentDetails;
  error?: string;
}

/**
 * TorrentDetailsOptions interface for getting torrent details
 */
export interface TorrentDetailsOptions {
  id: string;
}

/**
 * Options for the visit method
 */
export interface VisitOptions {
  /**
   * HTTP method to use
   * @default 'GET'
   */
  method?: Method;

  /**
   * Optional data to send with request (for POST, PUT, etc.)
   */
  data?: any;

  /**
   * Whether to allow automatic redirects
   * @default true
   */
  allowRedirects?: boolean;

  /**
   * Whether to check if session is valid and relogin if needed
   * @default true
   */
  checkSession?: boolean;

  /**
   * Whether to treat response as binary data without decoding
   * @default false
   */
  isBinary?: boolean;
}
