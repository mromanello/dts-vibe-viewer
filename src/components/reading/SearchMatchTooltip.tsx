/**
 * SearchMatchTooltip Component
 * Tooltip shown when hovering over a search match
 * Provides option to view citation details in navigation
 */

import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface SearchMatchTooltipProps {
  matchText: string;
  citationRef?: string;
  onViewCitation: () => void;
  position: { top: number; left: number };
}

export default function SearchMatchTooltip({
  matchText,
  citationRef,
  onViewCitation,
  position,
}: SearchMatchTooltipProps) {
  return (
    <div
      className="fixed z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '300px',
      }}
    >
      <div className="space-y-2">
        {/* Match preview */}
        <div className="text-xs text-gray-600">
          <span className="font-medium">Match:</span>{' '}
          <span className="italic">&quot;{matchText}&quot;</span>
        </div>

        {/* Citation info */}
        {citationRef && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Citation:</span> {citationRef}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={onViewCitation}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          <DocumentTextIcon className="h-4 w-4" />
          {citationRef ? 'View Citation Details' : 'View in Navigation'}
        </button>
      </div>
    </div>
  );
}
