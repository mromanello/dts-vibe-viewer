/**
 * Navigation Browser Component
 * Combines NavigationTree with CitableUnitMetadata detail panel
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Resource } from '@/types/dts';
import { useDTS } from '@/context/DTSContext';
import { fetchFullTree, getCitationTree } from '@/services/dts/navigation';
import { toDTSError } from '@/services/utils/http';
import { buildDocumentURL } from '@/utils/routing';
import NavigationTree from './NavigationTree';
import CitableUnitMetadata from './CitableUnitMetadata';
import CitationTreeSelector from './CitationTreeSelector';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';

interface NavigationBrowserProps {
  resource: Resource;
}

export default function NavigationBrowser({ resource }: NavigationBrowserProps) {
  const navigate = useNavigate();
  const {
    endpoints,
    entryPointURL,
    currentCollection,
    currentCitation,
    currentNavigation,
    validationMode,
    setCurrentCitation,
    setCurrentNavigation,
    setError,
  } = useDTS();

  const [selectedTreeId, setSelectedTreeId] = useState<string | undefined>(undefined);
  const [isLoadingNav, setIsLoadingNav] = useState(false);

  // Load navigation tree on mount or when tree selection changes
  useEffect(() => {
    const loadNavigation = async () => {
      if (!endpoints.navigation) return;

      // Prevent duplicate fetches - check if we already have navigation for this resource
      if (currentNavigation?.resource?.['@id'] === resource['@id'] && !selectedTreeId) {
        return;
      }

      setIsLoadingNav(true);
      setError(null);

      try {
        // IMPORTANT: Use full @id URL for API calls (DTS spec requirement)
        // Start with down=1 (top level only) for better performance
        // Children are loaded lazily when user expands nodes
        const navigation = await fetchFullTree(
          endpoints.navigation,
          resource['@id'],
          1, // down=1 = fetch top level only, lazy load children on expand
          selectedTreeId
        );

        setCurrentNavigation(navigation);
      } catch (err) {
        setError(toDTSError(err));
        setCurrentNavigation(null);
      } finally {
        setIsLoadingNav(false);
      }
    };

    loadNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoints.navigation, resource['@id'], selectedTreeId]);

  const handleTreeChange = (treeId: string) => {
    setSelectedTreeId(treeId);
    setCurrentCitation(null); // Clear selection when switching trees
  };

  const handleViewDocument = (unit: typeof currentCitation) => {
    if (!unit) return;

    // Build URL with full context (endpoint, collection, mode, tree)
    const url = buildDocumentURL({
      resourceId: resource['@id'],
      citation: unit.identifier,
      endpoint: entryPointURL || undefined,
      collection: currentCollection?.['@id'],
      mode: validationMode || undefined,
      tree: selectedTreeId,
    });

    navigate(url);
  };

  // Get selected citation tree from Navigation response (or fallback to Resource)
  const citationTree = selectedTreeId
    ? getCitationTree(currentNavigation?.resource || resource, selectedTreeId)
    : getCitationTree(currentNavigation?.resource || resource);

  if (!endpoints.navigation) {
    return (
      <div className="p-4">
        <Alert type="warning">
          Navigation endpoint not available. Please connect to a DTS endpoint first.
        </Alert>
      </div>
    );
  }

  // Note: Don't check resource.citationTrees here - that comes from Collection endpoint
  // The Navigation API response will have the actual citation tree structure

  // Get citation trees from Navigation response
  const citationTrees = currentNavigation?.resource?.citationTrees || resource.citationTrees || [];

  return (
    <div className="flex h-full flex-col">
      {/* Citation Tree Selector (if multiple trees) */}
      {citationTrees.length > 1 && (
        <CitationTreeSelector
          trees={citationTrees}
          selectedTree={selectedTreeId}
          onSelectTree={handleTreeChange}
        />
      )}

      {/* Citation Tree Info */}
      {citationTree && !isLoadingNav && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-sm">
          <div className="flex items-center gap-4 text-gray-700">
            <span className="font-medium">Citation Structure:</span>
            {citationTree.maxCiteDepth && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {citationTree.maxCiteDepth} levels deep
              </span>
            )}
            {citationTree.citeStructure && citationTree.citeStructure.length > 0 && (
              <span className="text-xs text-gray-600">
                {citationTree.citeStructure.map(s => s.citeType).join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingNav && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {/* Tree View */}
      {!isLoadingNav && (
        <div
          className={
            currentCitation
              ? 'flex-1 overflow-auto border-b border-gray-200'
              : 'flex-1 overflow-auto'
          }
        >
          <NavigationTree resource={resource} selectedTreeId={selectedTreeId} />
        </div>
      )}

      {/* Metadata Panel - shows when citation selected */}
      {currentCitation && !isLoadingNav && (
        <div className="h-96 overflow-auto border-t border-gray-200 bg-gray-50">
          <CitableUnitMetadata
            unit={currentCitation}
            resource={resource}
            citationTree={citationTree}
            onClose={() => setCurrentCitation(null)}
            onViewDocument={handleViewDocument}
          />
        </div>
      )}
    </div>
  );
}
