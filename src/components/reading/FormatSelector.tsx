/**
 * Format Selector Component
 * Dropdown for selecting media type when multiple formats are available
 */

const FORMAT_LABELS: Record<string, string> = {
  'application/tei+xml': 'TEI-XML',
  'application/xml': 'XML',
  'text/html': 'HTML',
  'text/plain': 'Plain Text',
  'application/json': 'JSON',
};

interface FormatSelectorProps {
  availableFormats: string[];
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
}

export default function FormatSelector({
  availableFormats,
  selectedFormat,
  onSelectFormat,
}: FormatSelectorProps) {
  // Don't render if only one format
  if (availableFormats.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="format-select" className="text-sm font-medium text-gray-700">
        Format:
      </label>
      <select
        id="format-select"
        value={selectedFormat}
        onChange={(e) => onSelectFormat(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {availableFormats.map((format) => (
          <option key={format} value={format}>
            {FORMAT_LABELS[format] || format}
          </option>
        ))}
      </select>
    </div>
  );
}
