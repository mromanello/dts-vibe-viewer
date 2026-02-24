/**
 * Document Viewer Component
 * Main viewer that routes to appropriate renderer based on media type
 */

import type { DTSError } from '@/types/dts';
import type { DocumentResponse } from '@/services/dts/document';
import { isXMLContent, isHTMLContent, isTEIContent } from '@/services/dts/document';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import EmptyState from './EmptyState';
import XMLRenderer from './XMLRenderer';
import HTMLRenderer from './HTMLRenderer';
import PlainTextRenderer from './PlainTextRenderer';
import TEIRenderer from './TEIRenderer';
import VirtualTextRenderer from './VirtualTextRenderer';
import VirtualXMLRenderer from './VirtualXMLRenderer';

interface DocumentViewerProps {
  document: DocumentResponse | null;
  isLoading: boolean;
  error: DTSError | null;
  onCitationClick?: (ref: string) => void; // Future use
}

export default function DocumentViewer({
  document,
  isLoading,
  error,
}: DocumentViewerProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Alert type="error">{error.message}</Alert>
      </div>
    );
  }

  // Empty state
  if (!document) {
    return <EmptyState />;
  }

  // Detect renderer type
  const rendererType = detectRendererType(document.content, document.mediaType);

  // Route to appropriate renderer
  switch (rendererType) {
    case 'tei':
      return <TEIRenderer content={document.content} />;
    case 'virtual-xml':
      return <VirtualXMLRenderer content={document.content} />;
    case 'xml':
      return <XMLRenderer content={document.content} />;
    case 'html':
      return <HTMLRenderer content={document.content} />;
    case 'virtual-text':
      return <VirtualTextRenderer content={document.content} />;
    case 'text':
      return <PlainTextRenderer content={document.content} />;
    default:
      return <PlainTextRenderer content={document.content} />;
  }
}

/**
 * Detect which renderer to use based on content and media type
 * Uses virtual scrolling for large documents (>500 lines)
 * @param content - Document content
 * @param mediaType - Media type from response
 * @returns Renderer type identifier
 */
function detectRendererType(
  content: string,
  mediaType: string
): 'tei' | 'virtual-xml' | 'xml' | 'html' | 'virtual-text' | 'text' {
  const LINE_THRESHOLD = 500; // Use virtual rendering above 500 lines
  const lineCount = content.split('\n').length;

  // Check for TEI content first (no virtual scrolling for TEI yet)
  if (mediaType.includes('tei+xml') || isTEIContent(content)) return 'tei';

  // Check media type for other XML - use virtual if large
  if (mediaType.includes('xml')) {
    return lineCount > LINE_THRESHOLD ? 'virtual-xml' : 'xml';
  }

  if (mediaType.includes('html')) return 'html';

  // Fallback to content detection
  if (isXMLContent(content)) {
    return lineCount > LINE_THRESHOLD ? 'virtual-xml' : 'xml';
  }

  if (isHTMLContent(content)) return 'html';

  // Text - use virtual if large
  return lineCount > LINE_THRESHOLD ? 'virtual-text' : 'text';
}
