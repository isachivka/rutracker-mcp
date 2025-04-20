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
  size: string;
  seeders: number;
  leechers: number;
  pubDate: number;
  magnetLink?: string;
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
