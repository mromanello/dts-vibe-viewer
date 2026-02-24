/**
 * Document Page
 * Displays document content with navigation context
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDTS } from '@/context/DTSContext';
import { fetchEntryPoint, extractEndpointTemplates } from '@/services/dts/entry';
import { fetchFullTree } from '@/services/dts/navigation';
import { fetchCollectionById } from '@/services/dts/collections';
import {
  fetchFullDocument,
  fetchCitationRef,
} from '@/services/dts/document';
import { toDTSError } from '@/services/utils/http';
import { isResource } from '@/types/dts';
import { useURLParams } from '@/hooks/useURLParams';
import { useURLSync } from '@/hooks/useURLSync';
import { useSyncContextToURL } from '@/hooks/useSyncContextToURL';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import DocumentViewer from '@/components/reading/DocumentViewer';
import FormatSelector from '@/components/reading/FormatSelector';
import SearchBar from '@/components/reading/SearchBar';
import SearchMatchTooltip from '@/components/reading/SearchMatchTooltip';

export default function DocumentPage() {
  const navigate = useNavigate();
  const { resourceId, citation } = useParams<{
    resourceId: string;
    citation?: string;
  }>();
  const urlParams = useURLParams();
  const { isInitializing } = useURLSync();

  const {
    endpoints,
    entryPointURL,
    entryPoint,
    currentResource,
    currentNavigation,
    currentCitation,
    currentDocument,
    documentLoading,
    setEntryPoint,
    setEndpoints,
    setCurrentResource,
    setCurrentNavigation,
    setCurrentCitation,
    setCurrentDocument,
    setDocumentLoading,
    setError,
    isLoading,
    setLoading,
    error,
    showToast,
  } = useDTS();

  const [selectedFormat, setSelectedFormat] = useState<string>('application/tei+xml');
  const [isConnectingEndpoint, setIsConnectingEndpoint] = useState(false);

  // Search functionality
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const { currentMatch, totalMatches, hoveredMatch, search, clearSearch, setHoveredMatch } = useDocumentSearch();

  // Sync context to URL
  useSyncContextToURL();

  // Clear search when search bar is hidden
  useEffect(() => {
    if (!isSearchVisible) {
      clearSearch();
    }
  }, [isSearchVisible, clearSearch]);

  // Handle viewing citation details from search match
  const handleViewCitationDetails = () => {
    setHoveredMatch(null);

    // If we're viewing a specific citation, we can show its details
    // The navigation panel already shows citation metadata when currentCitation is set
    // So we just need to ensure the sidebar navigation tab is active
    // This is handled by the Layout component based on currentCitation

    // For full document view, we'd need more complex logic to find the citation
    // For now, just close the tooltip
    if (!currentCitation) {
      showToast(
        'info',
        'Full Document View',
        'Citation details are available when viewing specific citations',
        3000
      );
    }
  };

  // Update selected format when resource changes
  useEffect(() => {
    const mediaTypes = currentResource?.mediaTypes || currentNavigation?.resource?.mediaTypes;
    if (mediaTypes && mediaTypes.length > 0) {
      // Set to first available format if current format not available
      if (!mediaTypes.includes(selectedFormat)) {
        setSelectedFormat(mediaTypes[0]);
      }
    }
  }, [currentResource, currentNavigation]);

  // Auto-connect to endpoint if specified in URL but not yet connected
  useEffect(() => {
    const connectToEndpoint = async () => {
      // Check if endpoint parameter exists in URL
      if (!urlParams.endpoint) {
        // No endpoint in URL - check if we need one
        if (resourceId && !entryPoint && !isConnectingEndpoint) {
          // Redirect to entry page with error
          setError({
            error: 'Missing Endpoint',
            message: 'Cannot load resource without DTS endpoint connection. Please connect to an endpoint first.',
            status: 400,
          });
          navigate('/', { replace: true });
        }
        return;
      }

      // If endpoint in URL matches current connection, skip
      if (entryPointURL === urlParams.endpoint) return;

      // If already connecting or loading, skip
      if (isConnectingEndpoint || isLoading) return;

      // Connect to endpoint
      setIsConnectingEndpoint(true);
      setError(null);

      try {
        const entry = await fetchEntryPoint(urlParams.endpoint);
        const endpointTemplates = extractEndpointTemplates(entry);

        setEntryPoint(urlParams.endpoint, entry);
        setEndpoints(endpointTemplates);
      } catch (err) {
        const dtsError = toDTSError(err);
        setError(dtsError);
        // Redirect to entry page if connection fails
        navigate('/', { replace: true });
      } finally {
        setIsConnectingEndpoint(false);
      }
    };

    connectToEndpoint();
  }, [urlParams.endpoint, entryPointURL, resourceId]);

  // Load resource and navigation on mount
  useEffect(() => {
    const loadResourceAndNavigation = async () => {
      if (!resourceId || !endpoints.collection || !endpoints.navigation) return;

      setLoading(true);
      setError(null);

      try {
        // IMPORTANT: Decode the URL-encoded resource @id with error handling
        let decodedResourceId: string;
        try {
          decodedResourceId = decodeURIComponent(resourceId);
        } catch (decodeErr) {
          throw new Error(`Invalid resource ID in URL: "${resourceId}". The URL appears to be malformed.`);
        }

        // Fetch resource if not already loaded or if different resource
        if (!currentResource || currentResource['@id'] !== decodedResourceId) {
          const resource = await fetchCollectionById(endpoints.collection, decodedResourceId);

          if (!isResource(resource)) {
            throw new Error('Selected item is not a Resource');
          }

          setCurrentResource(resource);

          // Fetch navigation tree for this resource
          const navigation = await fetchFullTree(
            endpoints.navigation,
            decodedResourceId,
            -1 // Load full tree for document page
          );

          setCurrentNavigation(navigation);

          // If citation parameter provided, find and set it
          if (citation) {
            let decodedCitation: string;
            try {
              decodedCitation = decodeURIComponent(citation);
            } catch (decodeErr) {
              console.warn(`Invalid citation in URL: "${citation}". Loading full document instead.`);
              setCurrentCitation(null);
              return;
            }

            const unit = navigation.member.find(
              (m) => m.identifier === decodedCitation
            );
            if (unit) {
              setCurrentCitation(unit);
            } else {
              // Citation not found - log warning and load full document
              console.warn(`Citation "${decodedCitation}" not found in navigation tree. Loading full document instead.`);
              setCurrentCitation(null);
            }
          }
        } else if (citation) {
          // Resource already loaded, just update citation
          let decodedCitation: string;
          try {
            decodedCitation = decodeURIComponent(citation);
          } catch (decodeErr) {
            console.warn(`Invalid citation in URL: "${citation}". Loading full document instead.`);
            setCurrentCitation(null);
            return;
          }

          if (currentNavigation) {
            const unit = currentNavigation.member.find(
              (m) => m.identifier === decodedCitation
            );
            if (unit) {
              setCurrentCitation(unit);
            } else {
              // Citation not found - log warning and load full document
              console.warn(`Citation "${decodedCitation}" not found in navigation tree. Loading full document instead.`);
              setCurrentCitation(null);
            }
          }
        }
      } catch (err) {
        const dtsError = toDTSError(err);
        setError(dtsError);

        // If it's a 404, provide helpful message
        if (dtsError.status === 404) {
          setError({
            ...dtsError,
            message: `Resource not found. The resource "${resourceId}" does not exist or is not accessible.`,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadResourceAndNavigation();
  }, [resourceId, citation, endpoints]);

  // Load document content
  useEffect(() => {
    const loadDocument = async () => {
      if (!endpoints.document || !currentResource) return;

      setDocumentLoading(true);
      setError(null);

      try {
        let doc;

        if (currentCitation) {
          // Load specific citation
          doc = await fetchCitationRef(
            endpoints.document,
            currentResource['@id'],
            currentCitation.identifier,
            undefined, // tree (use default from resource)
            selectedFormat
          );
        } else {
          // Load full document
          doc = await fetchFullDocument(
            endpoints.document,
            currentResource['@id'],
            undefined, // tree
            selectedFormat
          );
        }

        setCurrentDocument(doc);
      } catch (err) {
        const dtsError = toDTSError(err);
        setError(dtsError);
        setCurrentDocument(null);
      } finally {
        setDocumentLoading(false);
      }
    };

    loadDocument();
  }, [currentResource, currentCitation, selectedFormat, endpoints.document]);

  if (!resourceId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Alert type="error">No resource ID provided</Alert>
      </div>
    );
  }

  // Show loading state for endpoint connection or resource loading
  if (isLoading || isConnectingEndpoint || isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner />
          {isConnectingEndpoint && (
            <p className="mt-4 text-sm text-gray-600">
              Connecting to DTS endpoint...
            </p>
          )}
          {isLoading && (
            <p className="mt-4 text-sm text-gray-600">
              Loading resource...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentResource) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Alert type="warning">
          Resource not found. Please select a resource from the Collections browser.
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          <Link
            to="/"
            className="text-primary-600 hover:text-primary-700 hover:underline"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900">
            {typeof currentResource.title === 'string'
              ? currentResource.title
              : currentResource['@id']}
          </span>
          {currentCitation && (
            <>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900">
                {currentCitation.identifier}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Actions bar with format selector and search */}
        {currentDocument && !documentLoading && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex items-center justify-between">
              <FormatSelector
                availableFormats={
                  currentResource?.mediaTypes ||
                  currentNavigation?.resource?.mediaTypes ||
                  ['application/tei+xml']
                }
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
              />
              <div className="flex items-center gap-2">
                {/* Search toggle button */}
                <button
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSearchVisible
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Search in document"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        {currentDocument && !documentLoading && (
          <SearchBar
            onSearch={(query, direction) => search(query, direction, documentContainerRef.current)}
            onClose={() => setIsSearchVisible(false)}
            currentMatch={currentMatch}
            totalMatches={totalMatches}
            isVisible={isSearchVisible}
            containerRef={documentContainerRef.current}
          />
        )}

        {/* Document content */}
        <div ref={documentContainerRef} className="flex-1 overflow-hidden bg-white">
          <DocumentViewer
            document={currentDocument}
            isLoading={documentLoading}
            error={error}
          />
        </div>

        {/* Search match tooltip */}
        {hoveredMatch && (
          <div
            onMouseEnter={() => setHoveredMatch(hoveredMatch)}
            onMouseLeave={() => setHoveredMatch(null)}
          >
            <SearchMatchTooltip
              matchText={hoveredMatch.text}
              citationRef={currentCitation?.identifier}
              onViewCitation={handleViewCitationDetails}
              position={hoveredMatch.position}
            />
          </div>
        )}
      </div>
    </div>
  );
}
