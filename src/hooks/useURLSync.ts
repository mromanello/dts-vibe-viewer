/**
 * Custom hook to synchronize URL parameters with DTS context on mount
 *
 * This hook reads URL parameters and updates the DTS context accordingly.
 * It's primarily used for initializing application state from URL on page load
 * or when navigating via browser back/forward buttons.
 *
 * Usage: Call this hook in components that need URL-driven initialization
 * (typically DocumentPage).
 *
 * @returns isInitializing - Whether the initialization process is ongoing
 */

import { useState, useEffect, useRef } from 'react';
import { useDTS } from '@/context/DTSContext';
import { useURLParams } from './useURLParams';

export interface UseURLSyncResult {
  isInitializing: boolean;
}

export function useURLSync(): UseURLSyncResult {
  const urlParams = useURLParams();
  const { validationMode, setValidationMode } = useDTS();

  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once on mount
    if (hasInitialized.current) {
      setIsInitializing(false);
      return;
    }

    // Check if validation mode from URL differs from context
    if (urlParams.mode && urlParams.mode !== validationMode) {
      setValidationMode(urlParams.mode);
    }

    // Mark as initialized
    hasInitialized.current = true;

    // Allow components to handle endpoint connection
    // (DocumentPage and EntryPage handle this separately)

    setIsInitializing(false);
  }, [urlParams.mode, validationMode, setValidationMode]);

  return { isInitializing };
}
