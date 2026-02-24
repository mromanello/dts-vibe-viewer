/**
 * DTS Collection Endpoint Client
 * Handles fetching and navigating collection hierarchies
 */

import type { Collection, Resource, CollectionRequest } from '@/types/dts';
import { fetchJSON, expandURITemplate } from '@/services/utils/http';

/**
 * Fetch a collection or resource from the Collection Endpoint
 * @param collectionTemplate - Collection URI template from Entry Endpoint
 * @param params - Request parameters (id, page, nav)
 * @returns Collection or Resource object
 */
export async function fetchCollection(
  collectionTemplate: string,
  params: CollectionRequest = {}
): Promise<Collection | Resource> {
  const url = expandURITemplate(collectionTemplate, {
    id: params.id,
    page: params.page,
    nav: params.nav,
  });

  console.log('[fetchCollection] Requesting:', url);

  const data = await fetchJSON<Collection | Resource>(url);
  console.log('[fetchCollection] Response:', {
    '@id': data['@id'],
    '@type': data['@type'],
    'member?': !!data.member,
    'member.length': data.member?.length,
  });

  // Validate response has required fields
  if (!data['@id'] || !data['@type'] || !data.title) {
    throw new Error('Invalid Collection response: missing required fields');
  }

  if (data['@type'] !== 'Collection' && data['@type'] !== 'Resource') {
    throw new Error(`Invalid @type: Expected Collection or Resource, got ${data['@type']}`);
  }

  return data;
}

/**
 * Fetch the root collection (no id parameter)
 * @param collectionTemplate - Collection URI template from Entry Endpoint
 * @returns Root Collection
 */
export async function fetchRootCollection(
  collectionTemplate: string
): Promise<Collection | Resource> {
  return fetchCollection(collectionTemplate);
}

/**
 * Fetch a specific collection by ID
 * @param collectionTemplate - Collection URI template
 * @param id - Collection or Resource identifier
 * @returns Collection or Resource
 */
export async function fetchCollectionById(
  collectionTemplate: string,
  id: string
): Promise<Collection | Resource> {
  return fetchCollection(collectionTemplate, { id });
}

/**
 * Fetch children of a collection (with pagination support)
 * @param collectionTemplate - Collection URI template
 * @param id - Parent collection identifier (should be full @id URL)
 * @param page - Page number for pagination
 * @returns Collection with member array
 *
 * Note: Most DTS servers return children in the member array when fetching
 * a collection by ID (without nav parameter). The nav=children parameter
 * is not universally supported (e.g., DraCor only supports nav=parents).
 */
export async function fetchChildren(
  collectionTemplate: string,
  id: string,
  page?: number
): Promise<Collection | Resource> {
  console.log('[fetchChildren] Called with:', { collectionTemplate, id, page });
  // Don't use nav=children - just fetch by ID and children are in member array
  const result = await fetchCollection(collectionTemplate, { id, page });
  console.log('[fetchChildren] Result:', {
    '@id': result['@id'],
    '@type': result['@type'],
    'member.length': result.member?.length,
    totalChildren: result.totalChildren,
  });
  return result;
}

/**
 * Fetch parents of a collection (with pagination support)
 * @param collectionTemplate - Collection URI template
 * @param id - Child collection identifier
 * @param page - Page number for pagination
 * @returns Collection with member array
 */
export async function fetchParents(
  collectionTemplate: string,
  id: string,
  page?: number
): Promise<Collection | Resource> {
  return fetchCollection(collectionTemplate, { id, page, nav: 'parents' });
}

/**
 * Extract collection/resource identifier from @id URL
 * Handles various formats and returns the last path segment
 * @param atId - The @id URL
 * @returns Extracted identifier
 */
export function extractIdFromUrl(atId: string): string {
  try {
    const url = new URL(atId);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] || atId;
  } catch {
    // If not a valid URL, return as-is
    return atId;
  }
}

/**
 * Get display title from metadata
 * Supports LocalizedString and plain string values
 * @param item - Collection or Resource
 * @returns Display title
 */
export function getDisplayTitle(item: Collection | Resource): string {
  if (typeof item.title === 'string') {
    return item.title;
  }
  // If title is an array or localized, return first value or fallback
  return item.title || item['@id'];
}

/**
 * Get display description from metadata
 * Supports LocalizedString and plain string values
 * @param item - Collection or Resource
 * @returns Display description or undefined
 */
export function getDisplayDescription(item: Collection | Resource): string | undefined {
  if (!item.description) return undefined;

  if (typeof item.description === 'string') {
    return item.description;
  }

  // If description is an array or localized, return first value
  return undefined;
}

/**
 * Check if a collection has children to load
 * @param item - Collection or Resource
 * @returns true if has children to load
 */
export function hasChildren(item: Collection | Resource): boolean {
  return item.totalChildren > 0;
}

/**
 * Check if collection has more pages
 * @param item - Collection or Resource
 * @returns true if pagination has next page
 */
export function hasNextPage(item: Collection | Resource): boolean {
  return item.view?.next !== null && item.view?.next !== undefined;
}

/**
 * Check if collection has previous pages
 * @param item - Collection or Resource
 * @returns true if pagination has previous page
 */
export function hasPreviousPage(item: Collection | Resource): boolean {
  return item.view?.previous !== null && item.view?.previous !== undefined;
}
