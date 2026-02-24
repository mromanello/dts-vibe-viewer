/**
 * Collection Metadata Component
 * Displays detailed metadata for a collection or resource
 */

import { useState } from 'react';
import type { Collection, Resource, MetadataValue, LocalizedString } from '@/types/dts';
import { isResource } from '@/types/dts';
import { getDisplayTitle, getDisplayDescription } from '@/services/dts/collections';

interface CollectionMetadataProps {
  item: Collection | Resource;
  onClose?: () => void;
}

/**
 * Format a metadata value for display
 */
function formatMetadataValue(value: MetadataValue): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object' && value !== null) {
    if ('@id' in value && typeof value['@id'] === 'string') {
      return value['@id'];
    }
    if ('lang' in value && 'value' in value) {
      const localized = value as LocalizedString;
      return `${localized.value} [${localized.lang}]`;
    }
  }
  return String(value);
}

/**
 * Render metadata object as key-value pairs
 */
function MetadataSection({ title, metadata }: { title: string; metadata: Record<string, MetadataValue | MetadataValue[]> }) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <dl className="space-y-2">
        {entries.map(([key, value]) => {
          const values = Array.isArray(value) ? value : [value];
          return (
            <div key={key} className="text-sm">
              <dt className="font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </dt>
              <dd className="mt-1 text-gray-900">
                {values.map((v, idx) => (
                  <div key={idx}>{formatMetadataValue(v)}</div>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export default function CollectionMetadata({ item, onClose }: CollectionMetadataProps) {
  const title = getDisplayTitle(item);
  const description = getDisplayDescription(item);
  const isResourceType = isResource(item);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(item['@id']);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isResourceType ? (
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {/* Resource ID with copy button */}
            <div className="mt-2 flex items-start gap-2">
              <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-900 break-all">
                {item['@id']}
              </code>
              <button
                onClick={handleCopyId}
                className="flex-shrink-0 rounded p-1 hover:bg-gray-100"
                title="Copy resource ID"
              >
                {copied ? (
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-gray-100"
              aria-label="Close metadata"
            >
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Type Badge */}
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isResourceType
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {item['@type']}
          </span>
        </div>

        {/* Description */}
        {description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Description</h4>
            <p className="mt-1 text-sm text-gray-700">{description}</p>
          </div>
        )}

        {/* Collection Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Children:</span>
            <span className="ml-2 text-gray-900">{item.totalChildren}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Parents:</span>
            <span className="ml-2 text-gray-900">{item.totalParents}</span>
          </div>
        </div>

        {/* Resource-specific fields */}
        {isResourceType && (
          <div className="space-y-2">
            {(() => {
              const resource = item as Resource;
              if (!resource.mediaTypes) return null;

              const mediaTypes = Array.isArray(resource.mediaTypes)
                ? resource.mediaTypes
                : [resource.mediaTypes];

              return (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Media Types</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mediaTypes.map((type: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const resource = item as Resource;
              if (!resource.download) return null;

              const downloads = Array.isArray(resource.download)
                ? resource.download
                : [resource.download];

              return (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Download Formats</h4>
                  <div className="mt-1 space-y-1">
                    {downloads.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-primary-600 hover:text-primary-700 truncate"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Dublin Core Metadata */}
        {item.dublinCore && (
          <MetadataSection title="Dublin Core" metadata={item.dublinCore} />
        )}

        {/* Extensions */}
        {item.extensions && (
          <MetadataSection title="Extensions" metadata={item.extensions} />
        )}

        {/* Endpoints */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900">Endpoints</h4>
          <div className="space-y-1 text-xs">
            <div>
              <span className="font-medium text-gray-700">Collection:</span>
              <code className="ml-2 rounded bg-gray-100 px-1 text-gray-800">
                {item.collection}
              </code>
            </div>
            {isResourceType && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Navigation:</span>
                  <code className="ml-2 rounded bg-gray-100 px-1 text-gray-800">
                    {(item as Resource).navigation}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Document:</span>
                  <code className="ml-2 rounded bg-gray-100 px-1 text-gray-800">
                    {(item as Resource).document}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
