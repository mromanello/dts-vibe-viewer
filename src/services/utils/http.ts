/**
 * HTTP Client Utility
 * Provides fetch wrapper with error handling for DTS API calls
 */

import type { DTSError } from '@/types/dts';

export class HTTPError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HTTPError';
  }
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch JSON with error handling
 */
export async function fetchJSON<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        Accept: 'application/ld+json, application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      throw new HTTPError(response.status, response.statusText, errorData);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    if (error instanceof TypeError) {
      // Network error (CORS, DNS, etc.)
      throw new Error(
        'Network error: Unable to connect to the endpoint. Check CORS configuration or network connectivity.'
      );
    }

    throw error;
  }
}

/**
 * Fetch text/XML content with error handling
 */
export async function fetchText(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new HTTPError(response.status, response.statusText, errorText);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Network error: Unable to connect to the endpoint. Check CORS configuration or network connectivity.'
      );
    }

    throw error;
  }
}

/**
 * Parse DTS XML error response
 * Extracts title and description from DTS error format:
 * <error xmlns="https://w3id.org/dts/api#" statusCode="501">
 *   <title>Not implemented</title>
 *   <description>Retrieving the whole document as plaintext is not implemented.</description>
 * </error>
 */
function parseDTSXMLError(xmlString: string): { title?: string; description?: string } | null {
  try {
    // Check if it looks like DTS error XML
    if (!xmlString.includes('<error') || !xmlString.includes('dts/api')) {
      return null;
    }

    // Extract title
    const titleMatch = xmlString.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract description
    const descMatch = xmlString.match(/<description>([^<]+)<\/description>/);
    const description = descMatch ? descMatch[1].trim() : undefined;

    if (title || description) {
      return { title, description };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert error to user-friendly DTSError format
 */
export function toDTSError(error: unknown): DTSError {
  if (error instanceof HTTPError) {
    // Try to parse DTS XML error format
    if (typeof error.data === 'string') {
      const dtsError = parseDTSXMLError(error.data);
      if (dtsError) {
        return {
          error: dtsError.title || 'HTTP Error',
          message: dtsError.description || error.message,
          status: error.status,
          details: error.data,
        };
      }

      // Try to parse JSON error format
      try {
        const jsonError = JSON.parse(error.data);
        if (jsonError.error || jsonError.message) {
          return {
            error: jsonError.error || 'HTTP Error',
            message: jsonError.message || error.message,
            status: error.status,
            details: jsonError,
          };
        }
      } catch {
        // Not JSON, continue with default handling
      }
    }

    // Default HTTP error format
    return {
      error: 'HTTP Error',
      message: error.message,
      status: error.status,
      details: error.data,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.name,
      message: error.message,
      status: 0,
    };
  }

  return {
    error: 'Unknown Error',
    message: 'An unexpected error occurred',
    status: 0,
    details: error,
  };
}

/**
 * Expand URI template with parameters (simplified RFC 6570 implementation)
 * Supports basic query parameter expansion: /path{?param1,param2}
 */
export function expandURITemplate(
  template: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  // Handle query parameter templates: {?param1,param2}
  const queryMatch = template.match(/\{\?([^}]+)\}/);

  if (queryMatch) {
    const baseUrl = template.substring(0, queryMatch.index);
    const paramNames = queryMatch[1].split(',');

    // Build query string manually to avoid encoding URLs in the 'id' and 'resource' parameters
    // Some DTS servers (like DraCor) expect full @id URLs without encoding
    const queryParts: string[] = [];
    paramNames.forEach((paramName) => {
      const name = paramName.trim();
      const value = params[name];
      if (value !== undefined && value !== null) {
        const stringValue = String(value);
        // Don't encode 'id' or 'resource' parameters if they look like URLs
        if ((name === 'id' || name === 'resource') && (stringValue.startsWith('http://') || stringValue.startsWith('https://'))) {
          queryParts.push(`${name}=${stringValue}`);
        } else {
          queryParts.push(`${name}=${encodeURIComponent(stringValue)}`);
        }
      }
    });

    const queryString = queryParts.join('&');
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  // Handle path parameter templates: {param}
  return template.replace(/\{([^}]+)\}/g, (match, paramName) => {
    const value = params[paramName.trim()];
    return value !== undefined ? String(value) : match;
  });
}
