/**
 * Conformance Indicator Badge
 * Displays DTS spec conformance level with color coding
 */

import type { ConformanceLevel } from '@/types/validation';

interface ConformanceIndicatorProps {
  level: ConformanceLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const conformanceConfig: Record<
  ConformanceLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  full: {
    label: 'Full Conformance',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '✓',
  },
  partial: {
    label: 'Partial Conformance',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: '⚠',
  },
  minimal: {
    label: 'Minimal Conformance',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: '!',
  },
  invalid: {
    label: 'Invalid',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '✕',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export default function ConformanceIndicator({
  level,
  size = 'md',
  showLabel = true,
}: ConformanceIndicatorProps) {
  const config = conformanceConfig[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Conformance level: ${config.label}`}
    >
      <span className="font-semibold">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
