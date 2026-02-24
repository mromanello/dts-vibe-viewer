/**
 * Custom hook to synchronize DTS context state with URL query parameters
 *
 * This hook updates the URL query parameters when relevant context state changes,
 * enabling shareable URLs and proper browser history management.
 *
 * Features:
 * - Debounced updates to prevent history spam
 * - Uses replaceState (not pushState) to avoid excessive history entries
 * - Prevents infinite loops by tracking sync direction
 *
 * Usage: Call this hook in pages that should persist state in URL
 * (typically DocumentPage).
 *
 * @param options - Configuration options
 * @param options.debounceMs - Debounce delay in milliseconds (default: 300)
 */

import { useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDTS } from '@/context/DTSContext';
import { debounce } from '@/utils/routing';

export interface UseSyncContextToURLOptions {
  debounceMs?: number;
}

export function useSyncContextToURL(
  options: UseSyncContextToURLOptions = {}
): void {
  const { debounceMs = 300 } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const {
    entryPointURL,
    currentCollection,
    validationMode,
  } = useDTS();

  // Track sync direction to prevent loops
  const syncingFromURL = useRef(false);
  const previousValues = useRef({
    endpoint: entryPointURL,
    collection: currentCollection?.['@id'],
    mode: validationMode,
  });

  // Debounced query param updates
  const updateQueryParams = useMemo(
    () =>
      debounce((params: Record<string, string>) => {
        if (syncingFromURL.current) return;

        const searchParams = new URLSearchParams(location.search);
        let hasChanges = false;

        Object.entries(params).forEach(([key, value]) => {
          const currentValue = searchParams.get(key);

          if (value && value !== currentValue) {
            searchParams.set(key, value);
            hasChanges = true;
          } else if (!value && currentValue) {
            searchParams.delete(key);
            hasChanges = true;
          }
        });

        // Only navigate if there are actual changes
        if (hasChanges) {
          const queryString = searchParams.toString();
          const newURL = queryString
            ? `${location.pathname}?${queryString}`
            : location.pathname;

          navigate(newURL, { replace: true });
        }
      }, debounceMs),
    [location, navigate, debounceMs]
  );

  // Update query params when context changes
  useEffect(() => {
    const currentValues = {
      endpoint: entryPointURL,
      collection: currentCollection?.['@id'],
      mode: validationMode,
    };

    // Check if values have actually changed
    const hasChanged =
      currentValues.endpoint !== previousValues.current.endpoint ||
      currentValues.collection !== previousValues.current.collection ||
      currentValues.mode !== previousValues.current.mode;

    if (!hasChanged) return;

    // Update previous values
    previousValues.current = currentValues;

    // Update URL with new values
    updateQueryParams({
      endpoint: entryPointURL || '',
      collection: currentCollection?.['@id'] || '',
      mode: validationMode || '',
    });
  }, [entryPointURL, currentCollection, validationMode, updateQueryParams]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending debounced calls
      updateQueryParams.cancel?.();
    };
  }, [updateQueryParams]);
}
