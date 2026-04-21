import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDTS } from '@/context/DTSContext';
import { fetchEntryPoint, extractEndpointTemplates } from '@/services/dts/entry';
import { fetchFullDocument, fetchCitationRef } from '@/services/dts/document';
import { toDTSError } from '@/services/utils/http';
import { useURLParams } from '@/hooks/useURLParams';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { buildEntryURL } from '@/utils/routing';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import DocumentViewer from '@/components/reading/DocumentViewer';
import FormatSelector from '@/components/reading/FormatSelector';
import SearchBar from '@/components/reading/SearchBar';
import SearchMatchTooltip from '@/components/reading/SearchMatchTooltip';
import CollectionWelcome from '@/components/collections/CollectionWelcome';

function EntryPage() {
  const navigate = useNavigate();
  const urlParams = useURLParams();
  const [endpointUrl, setEndpointUrl] = useState(urlParams.endpoint || '');
  const [navigationUrl, setNavigationUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('application/tei+xml');
  const {
    setEntryPoint,
    setEndpoints,
    isLoading,
    setLoading,
    error,
    setError,
    entryPoint,
    endpoints,
    currentResource,
    currentCitation,
    currentNavigation,
    currentDocument,
    documentLoading,
    setCurrentDocument,
    setDocumentLoading,
    showToast,
  } = useDTS();

  // Search functionality
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const { currentMatch, totalMatches, hoveredMatch, search, clearSearch, setHoveredMatch } = useDocumentSearch();

  const exampleEndpoints = [
    {
      name: 'DraCor',
      description: 'Drama Corpora Platform',
      url: 'https://dracor.org/api/v1/dts',
    },
    {
      name: 'Heidelberg Digital Library',
      description: 'Digital collections from Heidelberg University',
      url: 'https://digi.ub.uni-heidelberg.de/editionService/dts/',
    },
    {
      name: 'DOTS',
      description: 'Digital Obvil Text Services',
      url: 'https://dots.chartes.psl.eu/demo/api/dts/',
    },
  ];

  const handleConnect = async (url: string) => {
    setError(null);
    setLoading(true);

    try {
      const entry = await fetchEntryPoint(url);
      const endpoints = extractEndpointTemplates(entry, url);

      setEntryPoint(url, entry);
      setEndpoints(endpoints);

      // Show success toast
      showToast(
        'success',
        'Connected Successfully',
        `Connected to ${entry['@id']}`,
        5000
      );

      // Update URL with endpoint parameter
      navigate(buildEntryURL(url), { replace: true });
    } catch (err) {
      const dtsError = toDTSError(err);
      setError(dtsError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConnect(endpointUrl);
  };

  const handleExampleClick = (url: string) => {
    setEndpointUrl(url);
    handleConnect(url);
  };

  const handleResolveNavigation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!navigationUrl.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // Parse the navigation URL
      const url = new URL(navigationUrl);

      // Extract endpoint (remove /navigation and query params)
      const pathname = url.pathname;
      const endpointPath = pathname.replace(/\/navigation$/, '');
      const endpoint = `${url.origin}${endpointPath}`;

      // Extract resource and ref from query params
      const resourceId = url.searchParams.get('resource');
      const citationRef = url.searchParams.get('ref');

      if (!resourceId) {
        throw new Error('Navigation URL must include a "resource" parameter');
      }

      // Connect to endpoint
      const entry = await fetchEntryPoint(endpoint);
      const endpoints = extractEndpointTemplates(entry, endpoint);

      setEntryPoint(endpoint, entry);
      setEndpoints(endpoints);

      // Show success toast
      showToast(
        'success',
        'Resolved Citation Link',
        `Navigating to ${citationRef ? 'citation: ' + citationRef : 'resource'}`,
        3000
      );

      // Navigate to the resource/citation
      // Use buildDocumentURL to construct the proper URL
      if (citationRef) {
        navigate(`/document/${encodeURIComponent(resourceId)}/${encodeURIComponent(citationRef)}?endpoint=${encodeURIComponent(endpoint)}`);
      } else {
        navigate(`/document/${encodeURIComponent(resourceId)}?endpoint=${encodeURIComponent(endpoint)}`);
      }
    } catch (err) {
      const dtsError = toDTSError(err);
      setError({
        ...dtsError,
        message: dtsError.message || 'Failed to resolve navigation URL. Please check the URL format.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect if endpoint parameter is present in URL
  useEffect(() => {
    if (urlParams.endpoint && !entryPoint && !isLoading) {
      handleConnect(urlParams.endpoint);
    }
  }, [urlParams.endpoint]); // Only run when URL param changes

  // Clear search when search bar is hidden
  useEffect(() => {
    if (!isSearchVisible) {
      clearSearch();
    }
  }, [isSearchVisible, clearSearch]);

  // Handle viewing citation details from search match
  const handleViewCitationDetails = () => {
    setHoveredMatch(null);

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

  // Load document when currentResource changes
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
            undefined,
            selectedFormat
          );
        } else {
          // Load full document
          doc = await fetchFullDocument(
            endpoints.document,
            currentResource['@id'],
            undefined,
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

  // Show document viewer if a resource is selected
  if (currentResource && entryPoint) {
    return (
      <div className="flex h-full flex-col">
        {/* Resource title bar with format selector and search */}
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {typeof currentResource.title === 'string'
                ? currentResource.title
                : currentResource['@id']}
            </h2>
            {currentDocument && !documentLoading && (
              <div className="flex items-center gap-3">
                <FormatSelector
                  availableFormats={
                    currentResource.mediaTypes ||
                    currentNavigation?.resource?.mediaTypes ||
                    ['application/tei+xml']
                  }
                  selectedFormat={selectedFormat}
                  onSelectFormat={setSelectedFormat}
                />
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
            )}
          </div>
        </div>

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
    );
  }

  // Show collection welcome screen if connected (ignore collection loading errors)
  if (entryPoint) {
    return <CollectionWelcome />;
  }

  // Show connection form only if not connected
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to DTS Viewer
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter a DTS Entry Endpoint URL to start exploring text collections
          </p>
        </div>

        {error && (
          <Alert type="error" title={error.error} onClose={() => setError(null)}>
            <p>{error.message}</p>
            {error.details !== undefined && error.details !== null && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </Alert>
        )}

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="endpoint-url"
                className="block text-sm font-medium text-gray-700"
              >
                DTS Entry Endpoint URL
              </label>
              <div className="mt-2">
                <input
                  type="url"
                  id="endpoint-url"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder="https://example.org/api/dts/"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Connecting...
                </span>
              ) : (
                'Connect to Endpoint'
              )}
            </button>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">Quick Select Examples</h3>
            <div className="mt-4 space-y-3">
              {exampleEndpoints.map((endpoint) => (
                <button
                  key={endpoint.url}
                  onClick={() => handleExampleClick(endpoint.url)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary-500 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{endpoint.name}</h4>
                      <p className="mt-1 text-xs text-gray-500">{endpoint.description}</p>
                      <p className="mt-2 text-xs font-mono text-gray-600">{endpoint.url}</p>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Or Resolve Citation Link</h3>
            <p className="text-xs text-gray-500 mb-3">
              Paste a DTS Navigation URL to jump directly to a specific citation
            </p>
            <form onSubmit={handleResolveNavigation} className="space-y-3">
              <input
                type="url"
                value={navigationUrl}
                onChange={(e) => setNavigationUrl(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="https://dracor.org/api/v1/dts/navigation?resource=...&ref=..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !navigationUrl.trim()}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Resolving...
                  </span>
                ) : (
                  'Resolve Citation Link'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntryPage;
