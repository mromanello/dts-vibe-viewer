/**
 * Virtual XML Renderer Component
 * Uses react-window for efficient rendering of large XML documents
 * with lazy syntax highlighting - only highlights visible lines
 */

import { useMemo, useRef, useCallback } from 'react';
import { FixedSizeList } from 'react-window';

interface VirtualXMLRendererProps {
  content: string;
  showLineNumbers?: boolean;
}

export default function VirtualXMLRenderer({
  content,
  showLineNumbers = true,
}: VirtualXMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => content.split('\n'), [content]);
  const highlightCache = useRef<Map<number, string>>(new Map());

  const LINE_HEIGHT = 24; // 16px font × 1.5 leading

  // Lazy highlight: only highlight when line becomes visible
  const getHighlightedLine = useCallback(
    (index: number): string => {
      // Check cache first
      if (highlightCache.current.has(index)) {
        return highlightCache.current.get(index)!;
      }

      // Highlight and cache
      const line = lines[index];
      const escaped = escapeHTML(line);
      const highlighted = highlightXML(escaped);
      highlightCache.current.set(index, highlighted);

      return highlighted;
    },
    [lines]
  );

  // Calculate container dimensions
  const height = containerRef.current?.clientHeight || 600;

  // Row renderer
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => (
    <div style={style} className="flex font-mono text-sm">
      {showLineNumbers && (
        <div className="w-12 flex-shrink-0 pr-4 text-right text-gray-400 select-none">
          {index + 1}
        </div>
      )}
      <div
        className="flex-1 whitespace-pre-wrap break-all"
        dangerouslySetInnerHTML={{ __html: getHighlightedLine(index) }}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="h-full bg-white">
      <FixedSizeList
        height={height}
        itemCount={lines.length}
        itemSize={LINE_HEIGHT}
        width="100%"
        overscanCount={50}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

/**
 * Escape HTML for safe rendering
 * @param str - String to escape
 * @returns Escaped HTML string
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple regex-based XML syntax highlighting
 * @param xml - Escaped XML string
 * @returns HTML string with syntax highlighting
 */
function highlightXML(xml: string): string {
  return xml
    // Comments
    .replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="text-gray-400 italic">$1</span>'
    )
    // Opening/closing tags
    .replace(
      /(&lt;\/?[\w:]+)/g,
      '<span class="text-blue-600 font-semibold">$1</span>'
    )
    // Attributes
    .replace(/([\w:]+)=/g, '<span class="text-green-600">$1</span>=')
    // Attribute values
    .replace(/="([^"]*)"/g, '="<span class="text-orange-600">$1</span>"');
}
