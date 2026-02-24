/**
 * DTS (Distributed Text Services) TypeScript Type Definitions
 * Based on DTS 1.0 Release Candidate specification
 */

// ============================================================================
// Entry Endpoint Types
// ============================================================================

export interface EntryPoint {
  '@context': string;
  '@id': string;
  '@type': 'EntryPoint';
  dtsVersion: string;
  collection: string; // URI template
  navigation: string; // URI template
  document: string; // URI template
}

// ============================================================================
// Collection Endpoint Types
// ============================================================================

export interface Collection {
  '@context'?: string;
  '@id': string;
  '@type': 'Collection';
  dtsVersion?: string;
  title: string;
  totalParents: number;
  totalChildren: number;
  description?: string;
  member?: Array<Collection | Resource>;
  dublinCore?: MetadataObject;
  extensions?: MetadataObject;
  collection: string; // URI template
  view?: PaginationObject;
}

export interface Resource extends Omit<Collection, '@type'> {
  '@type': 'Resource';
  navigation: string; // URI template
  document: string; // URI template
  download?: string[];
  citationTrees?: CitationTree[];
  mediaTypes?: string[];
}

export interface PaginationObject {
  '@id': string;
  '@type': 'Pagination';
  first?: string;
  previous?: string | null;
  next?: string | null;
  last?: string;
}

export interface MetadataObject {
  [key: string]: MetadataValue | MetadataValue[];
}

export type MetadataValue =
  | string
  | number
  | LocalizedString
  | { '@id': string };

export interface LocalizedString {
  lang: string; // BCP 47 language tag
  value: string;
}

// ============================================================================
// Navigation Endpoint Types
// ============================================================================

export interface Navigation {
  '@context'?: string;
  '@id': string;
  '@type': 'Navigation';
  dtsVersion?: string;
  resource: ResourceInfo;
  ref?: CitableUnit;
  start?: CitableUnit;
  end?: CitableUnit;
  member: CitableUnit[];
  view?: PaginationObject;
}

export interface ResourceInfo {
  '@id': string;
  '@type': 'Resource';
  collection: string; // URI template
  navigation: string; // URI template
  document: string; // URI template
  citationTrees?: CitationTree[];
  mediaTypes?: string[]; // Available media types for document endpoint
}

export interface CitationTree {
  identifier?: string; // Required if multiple trees
  '@type': 'CitationTree';
  citeStructure: CiteStructure[];
  maxCiteDepth?: number; // Maximum depth of citation hierarchy
  description?: string;
}

export interface CiteStructure {
  citeType: string; // e.g., "book", "chapter", "verse"
  citeStructure?: CiteStructure[];
}

export interface CitableUnit {
  identifier: string;
  '@type': 'CitableUnit';
  level: number;
  parent: string | null;
  citeType?: string;
  '@id'?: string;
  dublinCore?: MetadataObject;
  extensions?: MetadataObject;
}

// ============================================================================
// Document Endpoint Types
// ============================================================================

export interface DocumentRequest {
  resource: string; // Resource URI (required)
  ref?: string; // Single citation (exclusive with start/end)
  start?: string; // Range start (requires end)
  end?: string; // Range end (requires start)
  tree?: string; // Citation tree identifier
  mediaType?: string; // Format preference
}

export type DocumentContent = string; // TEI-XML, HTML, or plain text

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CollectionRequest {
  id?: string; // Collection or Resource identifier
  page?: number; // Pagination
  nav?: 'children' | 'parents'; // Navigation direction
}

export interface NavigationRequest {
  resource: string; // Resource identifier (required)
  ref?: string; // Single citation node
  start?: string; // Range start
  end?: string; // Range end
  down?: number; // Maximum depth (-1 = full depth)
  tree?: string; // CitationTree identifier
  page?: number; // Pagination
}

// ============================================================================
// Error Types
// ============================================================================

export interface DTSError {
  error: string;
  message: string;
  status: number;
  details?: unknown;
}

// ============================================================================
// Endpoint Configuration
// ============================================================================

export interface EndpointTemplates {
  entry: string;
  collection: string | null;
  navigation: string | null;
  document: string | null;
}

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isCollection(
  item: Collection | Resource
): item is Collection {
  return item['@type'] === 'Collection';
}

export function isResource(item: Collection | Resource): item is Resource {
  return item['@type'] === 'Resource';
}

export function isEntryPoint(data: unknown): data is EntryPoint {
  return (
    typeof data === 'object' &&
    data !== null &&
    '@type' in data &&
    (data as EntryPoint)['@type'] === 'EntryPoint'
  );
}
