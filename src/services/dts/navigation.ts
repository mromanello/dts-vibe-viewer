/**
 * DTS Navigation Endpoint Client
 * Handles fetching and navigating citation trees
 */

import type {
  Navigation,
  NavigationRequest,
  CitableUnit,
  Resource,
  ResourceInfo,
  CitationTree,
  LocalizedString,
} from '@/types/dts';
import { fetchJSON, expandURITemplate } from '@/services/utils/http';

/**
 * Fetch navigation data from the Navigation Endpoint
 * @param navigationTemplate - Navigation URI template from Entry Endpoint
 * @param params - Request parameters (resource, ref, start, end, down, tree, page)
 * @returns Navigation object with citation tree
 */
export async function fetchNavigation(
  navigationTemplate: string,
  params: NavigationRequest
): Promise<Navigation> {
  const url = expandURITemplate(navigationTemplate, {
    resource: params.resource,
    ref: params.ref,
    start: params.start,
    end: params.end,
    down: params.down,
    tree: params.tree,
    page: params.page,
  });

  const data = await fetchJSON<Navigation>(url);

  console.log('[fetchNavigation] Response:', {
    hasId: !!data['@id'],
    hasType: !!data['@type'],
    type: data['@type'],
    hasResource: !!data.resource,
    hasMember: data.member !== undefined,
    memberValue: data.member,
    memberIsArray: Array.isArray(data.member),
    memberCount: Array.isArray(data.member) ? data.member.length : 'N/A',
  });

  // Validate response has required fields
  const missingFields = [];
  if (!data['@id']) missingFields.push('@id');
  if (!data['@type']) missingFields.push('@type');
  if (data.member === undefined) missingFields.push('member');

  if (missingFields.length > 0) {
    console.error('[fetchNavigation] Missing fields:', missingFields, 'Response:', data);
    throw new Error(`Invalid Navigation response: missing required fields: ${missingFields.join(', ')}`);
  }

  if (data['@type'] !== 'Navigation') {
    throw new Error(`Invalid @type: Expected Navigation, got ${data['@type']}`);
  }

  // DraCor quirk: member can be null instead of empty array
  // Normalize null to empty array
  if (data.member === null) {
    data.member = [];
  }

  if (!Array.isArray(data.member)) {
    throw new Error('Invalid Navigation response: member must be an array or null');
  }

  return data;
}

/**
 * Fetch full citation tree for a resource
 * @param navigationTemplate - Navigation URI template
 * @param resourceId - Resource identifier
 * @param down - Maximum depth (-1 for full tree, 1 for top level only)
 * @param treeId - Optional citation tree identifier (if multiple trees)
 * @returns Navigation object with citation tree
 */
export async function fetchFullTree(
  navigationTemplate: string,
  resourceId: string,
  down: number = 1,
  treeId?: string
): Promise<Navigation> {
  return fetchNavigation(navigationTemplate, {
    resource: resourceId,
    down,
    tree: treeId,
  });
}

/**
 * Fetch children of a specific citation level
 * @param navigationTemplate - Navigation URI template
 * @param resourceId - Resource identifier
 * @param ref - Citation reference (parent identifier)
 * @param down - Depth to load (default 1 = immediate children)
 * @param treeId - Optional citation tree identifier
 * @returns Navigation object with children
 */
export async function fetchCitationLevel(
  navigationTemplate: string,
  resourceId: string,
  ref: string,
  down: number = 1,
  treeId?: string
): Promise<Navigation> {
  return fetchNavigation(navigationTemplate, {
    resource: resourceId,
    ref,
    down,
    tree: treeId,
  });
}

/**
 * Fetch citation range
 * @param navigationTemplate - Navigation URI template
 * @param resourceId - Resource identifier
 * @param start - Range start identifier
 * @param end - Range end identifier
 * @param treeId - Optional citation tree identifier
 * @returns Navigation object with range
 */
export async function fetchCitationRange(
  navigationTemplate: string,
  resourceId: string,
  start: string,
  end: string,
  treeId?: string
): Promise<Navigation> {
  return fetchNavigation(navigationTemplate, {
    resource: resourceId,
    start,
    end,
    tree: treeId,
  });
}

/**
 * Build hierarchical tree structure from flat member array
 * Organizes CitableUnits by parent relationship
 * @param members - Flat array of CitableUnits
 * @returns Map of parent identifier to children array (null key = root level)
 */
export function buildNavigationHierarchy(
  members: CitableUnit[]
): Map<string, CitableUnit[]> {
  const hierarchy = new Map<string, CitableUnit[]>();

  for (const unit of members) {
    // Use parent identifier as key, or 'root' for top-level units
    const parentKey = unit.parent || 'root';

    if (!hierarchy.has(parentKey)) {
      hierarchy.set(parentKey, []);
    }

    hierarchy.get(parentKey)!.push(unit);
  }

  // IMPORTANT: Do NOT sort - the order from the API response is intentional
  // The mix and sequence of stage directions, speeches, etc. matters for drama texts

  return hierarchy;
}

/**
 * Get children for a specific parent from hierarchy
 * @param hierarchy - Built hierarchy map
 * @param parentId - Parent identifier (null or 'root' for top level)
 * @returns Array of child CitableUnits
 */
export function getChildren(
  hierarchy: Map<string, CitableUnit[]>,
  parentId: string | null
): CitableUnit[] {
  const key = parentId || 'root';
  return hierarchy.get(key) || [];
}

/**
 * Format citable unit identifier for display
 * Handles nested identifiers and provides readable output
 * @param unit - CitableUnit
 * @returns Formatted identifier string
 */
export function formatCitableUnit(unit: CitableUnit): string {
  // If there's a citeType, include it
  if (unit.citeType) {
    return `${unit.citeType} ${unit.identifier}`;
  }
  return unit.identifier;
}

/**
 * Get citation tree by identifier from resource
 * @param resource - Resource or ResourceInfo object
 * @param treeId - Optional tree identifier (returns first if not specified)
 * @returns CitationTree or undefined
 */
export function getCitationTree(
  resource: ResourceInfo | Resource,
  treeId?: string
): CitationTree | undefined {
  const trees = 'citationTrees' in resource ? resource.citationTrees : undefined;

  if (!trees || trees.length === 0) {
    return undefined;
  }

  if (!treeId) {
    return trees[0];
  }

  return trees.find((tree) => tree.identifier === treeId);
}

/**
 * Get citation structure label for a specific level
 * @param tree - CitationTree
 * @param level - Level index (0-based)
 * @returns Citation type label (e.g., "book", "chapter", "verse")
 */
export function getCitationStructureLabel(
  tree: CitationTree,
  level: number
): string {
  let currentStructure = tree.citeStructure;
  let depth = 0;

  while (depth < level && currentStructure && currentStructure.length > 0) {
    // Navigate down the nested structure
    if (currentStructure[0].citeStructure) {
      currentStructure = currentStructure[0].citeStructure;
      depth++;
    } else {
      break;
    }
  }

  return currentStructure && currentStructure.length > 0
    ? currentStructure[0].citeType
    : 'unknown';
}

/**
 * Check if a citable unit has children in the hierarchy
 * @param unit - CitableUnit to check
 * @param hierarchy - Built hierarchy map
 * @returns true if unit has children
 */
export function hasChildrenUnits(
  unit: CitableUnit,
  hierarchy: Map<string, CitableUnit[]>
): boolean {
  const children = hierarchy.get(unit.identifier);
  return children !== undefined && children.length > 0;
}

/**
 * Type guard to check if data is a Navigation response
 * @param data - Unknown data
 * @returns true if data is Navigation
 */
export function isNavigation(data: unknown): data is Navigation {
  if (!data || typeof data !== 'object') return false;

  const nav = data as Partial<Navigation>;
  return (
    typeof nav['@id'] === 'string' &&
    nav['@type'] === 'Navigation' &&
    nav.resource !== undefined &&
    Array.isArray(nav.member)
  );
}

/**
 * Get display title from CitableUnit metadata
 * Extracts title from dublinCore or uses identifier as fallback
 * @param unit - CitableUnit
 * @returns Display title
 */
export function getUnitDisplayTitle(unit: CitableUnit): string {
  // Check Dublin Core title
  if (unit.dublinCore?.title) {
    const title = unit.dublinCore.title;
    if (typeof title === 'string') {
      return title;
    }
    if (Array.isArray(title) && title.length > 0) {
      const first = title[0];
      if (typeof first === 'string') return first;
      if (typeof first === 'object' && 'value' in first) {
        return (first as LocalizedString).value;
      }
    }
  }

  // Fallback to formatted identifier
  return formatCitableUnit(unit);
}

/**
 * Get description from CitableUnit metadata
 * @param unit - CitableUnit
 * @returns Description string or undefined
 */
export function getUnitDescription(unit: CitableUnit): string | undefined {
  if (!unit.dublinCore?.description) return undefined;

  const desc = unit.dublinCore.description;
  if (typeof desc === 'string') {
    return desc;
  }

  if (Array.isArray(desc) && desc.length > 0) {
    const first = desc[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && 'value' in first) {
      return (first as LocalizedString).value;
    }
  }

  return undefined;
}

/**
 * Check if navigation has more pages
 * @param navigation - Navigation response
 * @returns true if pagination has next page
 */
export function hasNextPage(navigation: Navigation): boolean {
  return navigation.view?.next !== null && navigation.view?.next !== undefined;
}

/**
 * Check if navigation has previous pages
 * @param navigation - Navigation response
 * @returns true if pagination has previous page
 */
export function hasPreviousPage(navigation: Navigation): boolean {
  return (
    navigation.view?.previous !== null && navigation.view?.previous !== undefined
  );
}
