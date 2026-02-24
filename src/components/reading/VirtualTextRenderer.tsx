/**
 * Virtual Text Renderer Component
 * Uses react-window for efficient rendering of large text documents
 * Only renders visible lines + buffer, dramatically improving performance for 10K+ line documents
 */

import { useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';

interface VirtualTextRendererProps {
  content: string;
  showLineNumbers?: boolean;
}

export default function VirtualTextRenderer({
  content,
  showLineNumbers = true,
}: VirtualTextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Split content once and memoize
  const lines = useMemo(() => content.split('\n'), [content]);
  const LINE_HEIGHT = 24; // 16px font × 1.5 leading

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
      <div className="flex-1 whitespace-pre-wrap break-all">{lines[index]}</div>
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
