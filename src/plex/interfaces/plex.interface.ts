export interface PlexConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface PlexAuthResponse {
  user: {
    authToken: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PlexEpisode {
  title: string;
  index: number;
  summary?: string;
  duration?: number;
  addedAt: string;
}

export interface PlexSeason {
  title: string;
  index: number;
  episodes: PlexEpisode[];
}

export interface PlexMediaItem {
  title: string;
  year?: number;
  type: 'movie' | 'show' | 'episode';
  addedAt: Date;
  summary?: string;
  thumb?: string;
  duration?: number;
  ratingKey?: string;
  seasons?: PlexSeason[];
  originalTitle?: string;
}

export interface PlexLibrary {
  key: string;
  type: string;
  title: string;
}

export interface PlexMetadata {
  key?: string;
  ratingKey?: string;
  title?: string;
  type?: string;
  year?: number;
  addedAt?: number;
  summary?: string;
  thumb?: string;
  duration?: number;
  index?: number;
  originalTitle?: string;
}

export interface PlexMediaContainer {
  MediaContainer: {
    Directory?: PlexMetadata[];
    Metadata?: PlexMetadata[];
    size?: number;
    totalSize?: number;
    [key: string]: any;
  };
}

export interface PlexResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
