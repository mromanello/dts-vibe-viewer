/**
 * URL Routing Utilities
 *
 * Centralized URL building and manipulation functions for DTS Viewer routing.
 * Handles encoding, query parameter management, and URL construction.
 */

import type { ValidationMode } from '@/types/validation';

export interface DocumentURLParams {
  resourceId: string;
  citation?: string;
  endpoint?: string;
  collection?: string;
  mode?: ValidationMode;
  tree?: string;
}

/**
 * Build a complete Document URL with path and query parameters
 *
 * @param params - Document URL parameters
 * @returns Complete URL path with query string
 *
 * @example
 * ```typescript
 * buildDocumentURL({
 *   resourceId: 'https://dracor.org/id/ger000087',
 *   citation: 'act1.scene1',
 *   endpoint: 'https://dracor.org/api/v1/dts'
 * });
 * // Returns: "/document/https%3A%2F%2Fdracor.org%2Fid%2Fger000087/act1.scene1?endpoint=https://dracor.org/api/v1/dts"
 * ```
 */
export function buildDocumentURL(params: DocumentURLParams): string {
  // Encode path parameters
  const encodedResource = encodeURIComponent(params.resourceId);
  const encodedCitation = params.citation
    ? encodeURIComponent(params.citation)
    : null;

  // Build path
  const path = encodedCitation
    ? `/document/${encodedResource}/${encodedCitation}`
    : `/document/${encodedResource}`;

  // Build query string
  const queryParams = new URLSearchParams();
  if (params.endpoint) queryParams.set('endpoint', params.endpoint);
  if (params.collection) queryParams.set('collection', params.collection);
  if (params.mode) queryParams.set('mode', params.mode);
  if (params.tree) queryParams.set('tree', params.tree);

  const query = queryParams.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Build Entry Page URL with optional endpoint parameter
 *
 * @param endpoint - Optional DTS endpoint URL
 * @returns Entry page path with query string
 *
 * @example
 * ```typescript
 * buildEntryURL('https://dracor.org/api/v1/dts');
 * // Returns: "/?endpoint=https%3A%2F%2Fdracor.org%2Fapi%2Fv1%2Fdts"
 * ```
 */
export function buildEntryURL(endpoint?: string): string {
  return endpoint
    ? `/?endpoint=${encodeURIComponent(endpoint)}`
    : '/';
}

/**
 * Extract short ID from full URL for display purposes
 *
 * @param url - Full URL string
 * @returns Last segment of URL path
 *
 * @example
 * ```typescript
 * extractIdFromUrl('https://dracor.org/id/ger000087');
 * // Returns: "ger000087"
 * ```
 */
export function extractIdFromUrl(url: string): string {
  // Extract last segment from URL for display purposes
  return url.split('/').pop() || url;
}

/**
 * Debounce function for delaying execution with cancel support
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debouncedFunction = function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };

  // Add cancel method
  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debouncedFunction as typeof debouncedFunction & { cancel: () => void };
}
