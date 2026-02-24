/**
 * DTS Document Endpoint Client
 * Handles fetching document content (TEI-XML, HTML, plain text)
 */

import type { DocumentRequest } from '@/types/dts';
import { fetchText, expandURITemplate } from '@/services/utils/http';

/**
 * Document response with content and metadata
 */
export interface DocumentResponse {
  content: string;
  mediaType: string;
  resource: string;
  ref?: string;
  start?: string;
  end?: string;
}

/**
 * Fetch document content from the Document Endpoint
 * @param template - Document URI template from Entry Endpoint
 * @param params - Request parameters (resource, ref, start, end, tree, mediaType)
 * @returns Document content with metadata
 */
export async function fetchDocument(
  template: string,
  params: DocumentRequest
): Promise<DocumentResponse> {
  console.log('[fetchDocument] Called with:', { template, params });

  // Validate required parameters
  if (!params.resource) {
    throw new Error('Parameter "resource" is required');
  }

  // Validate mutually exclusive parameters
  if (params.ref && (params.start || params.end)) {
    throw new Error('Parameters ref and start/end are mutually exclusive');
  }

  // Validate paired parameters
  if ((params.start && !params.end) || (!params.start && params.end)) {
    throw new Error('Parameters start and end must be used together');
  }

  // Build URL from template
  const url = expandURITemplate(template, {
    resource: params.resource,
    ref: params.ref,
    start: params.start,
    end: params.end,
    tree: params.tree,
    mediaType: params.mediaType,
  });

  console.log('[fetchDocument] Requesting:', url);

  // Fetch document content as text
  // Note: mediaType is passed as URL parameter, not Accept header to avoid CORS preflight
  const content = await fetchText(url, {
    timeout: 60000, // 60 second timeout for large documents
  });

  // Detect media type from content (no access to response headers in fetchText)
  const mediaType = params.mediaType || detectMediaType(content);

  console.log('[fetchDocument] Response:', {
    contentLength: content.length,
    mediaType,
  });

  // Build response object
  const documentResponse: DocumentResponse = {
    content,
    mediaType,
    resource: params.resource,
    ref: params.ref,
    start: params.start,
    end: params.end,
  };

  return documentResponse;
}

/**
 * Fetch full document content (no citation filtering)
 * @param template - Document URI template
 * @param resourceId - Resource identifier (full @id URL)
 * @param treeId - Optional citation tree identifier
 * @param mediaType - Optional media type preference
 * @returns Document content
 */
export async function fetchFullDocument(
  template: string,
  resourceId: string,
  treeId?: string,
  mediaType?: string
): Promise<DocumentResponse> {
  console.log('[fetchFullDocument] Called with:', { resourceId, treeId, mediaType });

  return fetchDocument(template, {
    resource: resourceId,
    tree: treeId,
    mediaType,
  });
}

/**
 * Fetch specific citation from document
 * @param template - Document URI template
 * @param resourceId - Resource identifier (full @id URL)
 * @param ref - Citation reference
 * @param treeId - Optional citation tree identifier
 * @param mediaType - Optional media type preference
 * @returns Document content for citation
 */
export async function fetchCitationRef(
  template: string,
  resourceId: string,
  ref: string,
  treeId?: string,
  mediaType?: string
): Promise<DocumentResponse> {
  console.log('[fetchCitationRef] Called with:', { resourceId, ref, treeId, mediaType });

  return fetchDocument(template, {
    resource: resourceId,
    ref,
    tree: treeId,
    mediaType,
  });
}

/**
 * Fetch citation range from document
 * @param template - Document URI template
 * @param resourceId - Resource identifier (full @id URL)
 * @param start - Range start citation
 * @param end - Range end citation
 * @param treeId - Optional citation tree identifier
 * @param mediaType - Optional media type preference
 * @returns Document content for range
 */
export async function fetchCitationRange(
  template: string,
  resourceId: string,
  start: string,
  end: string,
  treeId?: string,
  mediaType?: string
): Promise<DocumentResponse> {
  console.log('[fetchCitationRange] Called with:', { resourceId, start, end, treeId, mediaType });

  return fetchDocument(template, {
    resource: resourceId,
    start,
    end,
    tree: treeId,
    mediaType,
  });
}

/**
 * Parse Content-Type header to extract media type
 * @param contentType - Content-Type header value
 * @returns Parsed media type and charset
 */
export function parseContentType(contentType: string): { type: string; charset?: string } {
  const parts = contentType.split(';').map((p) => p.trim());
  const type = parts[0];
  const charsetPart = parts.find((p) => p.startsWith('charset='));
  const charset = charsetPart ? charsetPart.split('=')[1] : undefined;

  return { type, charset };
}

/**
 * Detect media type from content
 * @param content - Document content
 * @param contentTypeHeader - Optional Content-Type header
 * @returns Detected media type
 */
export function detectMediaType(content: string, contentTypeHeader?: string): string {
  // If header provided, use it
  if (contentTypeHeader) {
    return parseContentType(contentTypeHeader).type;
  }

  // Otherwise detect from content
  if (isXMLContent(content)) {
    if (isTEIContent(content)) {
      return 'application/tei+xml';
    }
    return 'application/xml';
  }

  if (isHTMLContent(content)) {
    return 'text/html';
  }

  return 'text/plain';
}

/**
 * Check if content is XML
 * @param content - Document content
 * @returns true if XML
 */
export function isXMLContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<');
}

/**
 * Check if content is HTML
 * @param content - Document content
 * @returns true if HTML
 */
export function isHTMLContent(content: string): boolean {
  const trimmed = content.toLowerCase().trim();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<html>')
  );
}

/**
 * Check if content is TEI XML
 * @param content - Document content
 * @returns true if TEI
 */
export function isTEIContent(content: string): boolean {
  return content.includes('<TEI') || content.includes('http://www.tei-c.org/ns/1.0');
}
