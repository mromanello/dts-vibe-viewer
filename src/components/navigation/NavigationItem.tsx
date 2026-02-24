/**
 * Navigation Item Component
 * Displays a single citable unit in the navigation tree with expand/collapse
 */

import type { CitableUnit } from '@/types/dts';
import { formatCitableUnit } from '@/services/dts/navigation';

export interface NavigationItemProps {
  unit: CitableUnit;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (unit: CitableUnit) => void;
  onSelect: (unit: CitableUnit) => void;
  children?: React.ReactNode;
  hasChildren?: boolean;
}

export default function NavigationItem({
  unit,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  children,
  hasChildren = false,
}: NavigationItemProps) {
  const indentStyle = { paddingLeft: `${level * 16}px` };

  // Citation level badge colors based on level
  const badgeColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
  ];
  const badgeColor = badgeColors[level % badgeColors.length];

  return (
    <div>
      <div
        className={`flex items-center gap-2 border-b border-gray-100 px-3 py-2 hover:bg-gray-50 ${
          isSelected ? 'bg-primary-50' : ''
        }`}
        style={indentStyle}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(unit);
            }}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
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
          </button>
        )}

        {/* Placeholder for alignment when no children */}
        {!hasChildren && <div className="w-4 flex-shrink-0" />}

        {/* Citation Type Badge */}
        {unit.citeType && (
          <span
            className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${badgeColor}`}
          >
            {unit.citeType}
          </span>
        )}

        {/* Citation Identifier - Clickable */}
        <button
          onClick={() => onSelect(unit)}
          className={`min-w-0 flex-1 truncate text-left text-sm ${
            isSelected
              ? 'font-semibold text-primary-700'
              : 'font-medium text-gray-700'
          }`}
          title={formatCitableUnit(unit)}
        >
          {unit.identifier}
        </button>

        {/* Level indicator */}
        <span className="flex-shrink-0 text-xs text-gray-400">
          L{unit.level}
        </span>
      </div>

      {/* Nested Children */}
      {isExpanded && children && <div>{children}</div>}
    </div>
  );
}
