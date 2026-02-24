/**
 * Collection Item Component
 * Displays a single collection or resource in the tree with expand/collapse
 */

import { useState } from 'react';
import type { Collection, Resource } from '@/types/dts';
import { isResource } from '@/types/dts';
import { hasChildren, getDisplayTitle } from '@/services/dts/collections';

export interface CollectionItemProps {
  item: Collection | Resource;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (item: Collection | Resource) => void;
  onSelect: (item: Collection | Resource) => void;
  children?: React.ReactNode;
}

export default function CollectionItem({
  item,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  children,
}: CollectionItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isResourceType = isResource(item);
  const canExpand = hasChildren(item);
  const title = getDisplayTitle(item);

  // Indentation based on nesting level
  const indent = level * 16;

  // Icon selection based on type and state
  const getIcon = () => {
    if (isResourceType) {
      // Resource icon (document/file)
      return (
        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      // Collection icon (folder)
      if (isExpanded) {
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        );
      } else {
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
              clipRule="evenodd"
            />
            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
          </svg>
        );
      }
    }
  };

  // Expand/collapse arrow
  const getExpandIcon = () => {
    if (!canExpand) return null;

    return (
      <svg
        className={`h-4 w-4 text-gray-500 transition-transform ${
          isExpanded ? 'rotate-90' : ''
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors ${
          isSelected
            ? 'bg-primary-100 text-primary-900'
            : isHovered
              ? 'bg-gray-100'
              : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${indent + 12}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(item)}
      >
        {/* Expand/collapse button */}
        {canExpand ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item);
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-200"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {getExpandIcon()}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Icon */}
        <span className="flex-shrink-0">{getIcon()}</span>

        {/* Title */}
        <span
          className={`flex-1 text-sm truncate ${
            isSelected ? 'font-semibold' : 'font-medium'
          }`}
          title={title}
        >
          {title}
        </span>

        {/* Child count badge */}
        {canExpand && (
          <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {item.totalChildren}
          </span>
        )}
      </div>

      {/* Nested children */}
      {isExpanded && children && <div>{children}</div>}
    </div>
  );
}
