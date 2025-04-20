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
}
