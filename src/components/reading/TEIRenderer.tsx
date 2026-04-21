/**
 * TEI Renderer Component
 * Renders TEI XML using CETEIcean library
 */

import { useEffect, useRef } from 'react';
import CETEI from 'CETEIcean';
import '../../styles/CETEIcean.css';

interface TEIRendererProps {
  content: string;
}

export default function TEIRenderer({ content }: TEIRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Initialize CETEIcean
    const cetei = new CETEI();

    // Convert TEI XML to HTML5 custom elements
    cetei.makeHTML5(content, (data: DocumentFragment) => {
      // Clear previous content
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        // Append the CETEIcean-processed content
        containerRef.current.appendChild(data);
      }
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto p-6 bg-white"
    />
  );
}
