/**
 * Citable Unit Metadata Component
 * Displays detailed metadata for a selected citable unit
 */

import { useState } from 'react';
import type {
  CitableUnit,
  Resource,
  CitationTree,
  MetadataValue,
  LocalizedString,
} from '@/types/dts';
import {
  getUnitDisplayTitle,
  getUnitDescription,
} from '@/services/dts/navigation';
import { useDTS } from '@/context/DTSContext';
import { expandURITemplate } from '@/services/utils/http';

interface CitableUnitMetadataProps {
  unit: CitableUnit;
  resource: Resource;
  citationTree?: CitationTree;
  onClose?: () => void;
  onViewDocument?: (unit: CitableUnit) => void;
}

/**
 * Format a metadata value for display
 */
function formatMetadataValue(value: MetadataValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object' && 'lang' in value && 'value' in value) {
    const localized = value as LocalizedString;
    return `${localized.value} [${localized.lang}]`;
  }
  return String(value);
}

export default function CitableUnitMetadata({
  unit,
  resource,
  citationTree,
  onClose,
  onViewDocument,
}: CitableUnitMetadataProps) {
  const { endpoints } = useDTS();
  const [copied, setCopied] = useState(false);

  const title = getUnitDisplayTitle(unit);
  const description = getUnitDescription(unit);

  // Generate citation link
  const citationLink = endpoints.navigation
    ? expandURITemplate(endpoints.navigation, {
        resource: resource['@id'],
        ref: unit.identifier,
      })
    : null;

  // Copy citation link to clipboard
  const handleCopyLink = async () => {
    if (!citationLink) return;

    try {
      await navigator.clipboard.writeText(citationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy citation link:', err);
    }
  };

  // Citation level badge color
  const levelColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
  ];
  const levelColor = levelColors[unit.level % levelColors.length];

  return (
    <div className="bg-gray-50 p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* Type Badge */}
              {unit.citeType && (
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${levelColor}`}>
                  {unit.citeType}
                </span>
              )}
              {/* Level Badge */}
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                Level {unit.level}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Identifier */}
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Identifier:</span>
            <code className="ml-2 rounded bg-gray-100 px-1 text-gray-800">
              {unit.identifier}
            </code>
          </div>
          {unit['@id'] && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">@id:</span>
              <code className="ml-2 rounded bg-gray-100 px-1 text-xs text-gray-800">
                {unit['@id']}
              </code>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Description</h4>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        )}

        {/* Parent Reference */}
        {unit.parent && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Parent:</span>
            <code className="ml-2 rounded bg-gray-100 px-1 text-gray-800">
              {unit.parent}
            </code>
          </div>
        )}

        {/* Citation Tree Info */}
        {citationTree && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Citation Tree</h4>
            <div className="mt-1 space-y-1 text-sm text-gray-600">
              {citationTree.identifier && (
                <div>
                  <span className="font-medium">ID:</span> {citationTree.identifier}
                </div>
              )}
              {citationTree.description && (
                <div>
                  <span className="font-medium">Description:</span> {citationTree.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dublin Core Metadata */}
        {unit.dublinCore && Object.keys(unit.dublinCore).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Dublin Core Metadata</h4>
            <div className="mt-1 space-y-1">
              {Object.entries(unit.dublinCore).map(([key, value]) => {
                if (!value) return null;
                const values = Array.isArray(value) ? value : [value];
                return (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="ml-2 text-gray-600">
                      {values.map(formatMetadataValue).join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extensions Metadata */}
        {unit.extensions && Object.keys(unit.extensions).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Extensions</h4>
            <div className="mt-1 space-y-1">
              {Object.entries(unit.extensions).map(([key, value]) => {
                if (!value) return null;
                const values = Array.isArray(value) ? value : [value];
                return (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="ml-2 text-gray-600">
                      {values.map(formatMetadataValue).join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resource Reference */}
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-semibold text-gray-900">Resource</h4>
          <div className="mt-1 text-sm text-gray-600">
            {typeof resource.title === 'string' ? resource.title : resource['@id']}
          </div>
        </div>

        {/* Citation Link */}
        {citationLink && (
          <div className="border-t border-gray-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-900">Citation Link</h4>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={citationLink}
                  readOnly
                  className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-mono text-gray-700"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    'Copy'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                This link points to the Navigation endpoint with resource and ref parameters.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewDocument && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => onViewDocument(unit)}
              className="w-full rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              View Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
