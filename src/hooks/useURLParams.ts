/**
 * Custom hook to extract URL parameters (both path and query params)
 *
 * Provides type-safe access to URL state including:
 * - Query parameters: endpoint, collection, mode, tree
 * - Path parameters: resourceId, citation (automatically decoded)
 *
 * @returns Object containing all URL parameters
 */

import { useSearchParams, useParams } from 'react-router-dom';
import type { ValidationMode } from '@/types/validation';

export interface URLParams {
  // Query parameters
  endpoint: string | null;
  collection: string | null;
  mode: ValidationMode | null;
  tree: string | null;

  // Path parameters (decoded)
  resourceId: string | null;
  citation: string | null;
}

export function useURLParams(): URLParams {
  const [searchParams] = useSearchParams();
  const params = useParams<{
    resourceId?: string;
    citation?: string;
  }>();

  return {
    // Query params
    endpoint: searchParams.get('endpoint'),
    collection: searchParams.get('collection'),
    mode: searchParams.get('mode') as ValidationMode | null,
    tree: searchParams.get('tree'),

    // Path params (decoded)
    resourceId: params.resourceId
      ? decodeURIComponent(params.resourceId)
      : null,
    citation: params.citation
      ? decodeURIComponent(params.citation)
      : null,
  };
}
