/**
 * Collection Welcome Component
 * Displays welcome screen with root collection metadata after successful connection
 */

import { useEffect, useState } from 'react';
import { useDTS } from '@/context/DTSContext';
import { fetchRootCollection } from '@/services/dts/collections';
import type { Collection } from '@/types/dts';
import { isResource } from '@/types/dts';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';

export default function CollectionWelcome() {
  const { endpoints, entryPoint } = useDTS();
  const [rootCollection, setRootCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRootCollection = async () => {
      if (!endpoints.collection) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchRootCollection(endpoints.collection);
        // Root should always be a Collection, but check just in case
        if (isResource(result)) {
          setError('Root is a Resource, not a Collection');
        } else {
          setRootCollection(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collection');
      } finally {
        setIsLoading(false);
      }
    };

    loadRootCollection();
  }, [endpoints.collection]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Show a simplified welcome if there's an error or no collection
  if (error || !rootCollection) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">
              Welcome to DTS Viewer
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Successfully connected to {entryPoint?.['@id'] || 'DTS endpoint'}
            </p>
          </div>

          {error && (
            <Alert type="warning" title="Collection Information Unavailable">
              <p className="text-sm">
                Unable to load collection details, but you can still browse using the sidebar.
              </p>
            </Alert>
          )}

          <div className="rounded-lg bg-primary-50 p-6">
            <h3 className="text-lg font-semibold text-primary-900">Getting Started</h3>
            <p className="mt-2 text-sm text-primary-700">
              Use the sidebar to browse collections and texts. Click on any item to view its
              metadata, or select a text to read its contents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title = typeof rootCollection.title === 'string'
    ? rootCollection.title
    : rootCollection['@id'];

  const description = typeof rootCollection.description === 'string'
    ? rootCollection.description
    : Array.isArray(rootCollection.description)
    ? rootCollection.description[0]
    : null;

  const totalItems = rootCollection.totalChildren || rootCollection.member?.length || 0;

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-lg text-gray-600">{description}</p>
          )}
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-semibold text-gray-900">Ready</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">DTS Version</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {entryPoint?.dtsVersion || '1.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metadata */}
        {rootCollection.dublinCore && Object.keys(rootCollection.dublinCore).length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(rootCollection.dublinCore).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-600">
                    {key.replace(/^dc:/, '')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Getting Started */}
        <div className="rounded-lg bg-primary-50 p-6">
          <h3 className="text-lg font-semibold text-primary-900">Getting Started</h3>
          <p className="mt-2 text-sm text-primary-700">
            Use the sidebar to browse collections and texts. Click on any item to view its
            metadata, or select a text to read its contents.
          </p>
        </div>
      </div>
    </div>
  );
}
