/**
 * Collection Tree Component
 * Displays hierarchical collection structure with lazy loading and search filtering
 */

import { useState, useEffect, useMemo } from 'react';
import type { Collection, Resource } from '@/types/dts';
import { isResource } from '@/types/dts';
import { useDTS } from '@/context/DTSContext';
import { fetchRootCollection, fetchChildren, extractIdFromUrl } from '@/services/dts/collections';
import { toDTSError } from '@/services/utils/http';
import CollectionItem from './CollectionItem';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';

interface TreeNodeState {
  id: string;
  isExpanded: boolean;
  children: (Collection | Resource)[] | null; // null = not loaded, [] = loaded but empty
  isLoading: boolean;
}

interface CollectionTreeProps {
  searchTerm?: string;
}

export default function CollectionTree({ searchTerm = '' }: CollectionTreeProps) {
  const {
    endpoints,
    setCurrentCollection,
    setCurrentResource,
    currentResource,
    currentCollection,
  } = useDTS();
  const [rootCollection, setRootCollection] = useState<Collection | Resource | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingRoot, setIsLoadingRoot] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [treeState, setTreeState] = useState<Map<string, TreeNodeState>>(new Map());

  // Sync selection with context (when switching tabs or navigating)
  useEffect(() => {
    if (currentResource) {
      const resourceId = extractIdFromUrl(currentResource['@id']);
      setSelectedId(resourceId);
    } else if (currentCollection) {
      const collectionId = extractIdFromUrl(currentCollection['@id']);
      setSelectedId(collectionId);
    }
  }, [currentResource, currentCollection]);

  // Load root collection when endpoints change
  useEffect(() => {
    if (!endpoints.collection) {
      // Clear state when no endpoint available
      setRootCollection(null);
      setTreeState(new Map());
      setLocalError(null);
      return;
    }

    // Load new root collection whenever endpoint changes
    loadRootCollection();
  }, [endpoints.collection]);

  const loadRootCollection = async () => {
    if (!endpoints.collection) return;

    setIsLoadingRoot(true);
    setLocalError(null);

    try {
      const root = await fetchRootCollection(endpoints.collection);
      setRootCollection(root);

      // Initialize tree state for root
      // Note: Don't pre-populate children, let them load on expand
      const rootId = extractIdFromUrl(root['@id']);
      setTreeState(
        new Map([
          [
            rootId,
            {
              id: rootId,
              isExpanded: false,
              children: null,
              isLoading: false,
            },
          ],
        ])
      );
    } catch (err) {
      const dtsError = toDTSError(err);
      setLocalError(dtsError.message || 'Failed to load collection');
    } finally {
      setIsLoadingRoot(false);
    }
  };

  const loadChildren = async (item: Collection | Resource) => {
    const itemId = extractIdFromUrl(item['@id']);

    console.log('[CollectionTree] loadChildren called:', {
      'item[@id]': item['@id'],
      itemId,
      'item.totalChildren': item.totalChildren,
      'item.member': item.member,
    });

    // Check if already loaded (children array exists and is not empty)
    const nodeState = treeState.get(itemId);
    if (nodeState?.children && nodeState.children.length > 0) {
      console.log('[CollectionTree] Children already loaded, skipping');
      return; // Already loaded
    }

    if (!endpoints.collection) {
      console.log('[CollectionTree] No collection endpoint, skipping');
      return;
    }

    // Set loading state
    setTreeState((prev) => {
      const next = new Map(prev);
      next.set(itemId, {
        ...(prev.get(itemId) || { id: itemId, isExpanded: false, children: null }),
        isLoading: true,
      });
      return next;
    });

    try {
      console.log('[CollectionTree] Fetching children for:', item['@id']);
      // IMPORTANT: Use the full @id URL, not the extracted ID
      const collectionData = await fetchChildren(endpoints.collection, item['@id']);
      console.log('[CollectionTree] Fetched children:', {
        'collectionData.member': collectionData.member,
        'member.length': collectionData.member?.length,
      });

      setTreeState((prev) => {
        const next = new Map(prev);
        next.set(itemId, {
          id: itemId,
          isExpanded: true,
          children: collectionData.member || [],
          isLoading: false,
        });
        return next;
      });
    } catch (err) {
      console.error('[CollectionTree] Error loading children:', err);
      const dtsError = toDTSError(err);
      setLocalError(dtsError.message || 'Failed to load children');

      // Set error state - keep children as null
      setTreeState((prev) => {
        const next = new Map(prev);
        next.set(itemId, {
          ...(prev.get(itemId) || { id: itemId, isExpanded: false, children: null }),
          isLoading: false,
        });
        return next;
      });
    }
  };

  const handleToggle = async (item: Collection | Resource) => {
    const itemId = extractIdFromUrl(item['@id']);
    const nodeState = treeState.get(itemId);

    console.log('[CollectionTree] handleToggle called:', {
      'item[@id]': item['@id'],
      itemId,
      'item.member': item.member,
      'item.totalChildren': item.totalChildren,
      hasNodeState: !!nodeState,
      nodeState,
    });

    if (!nodeState) {
      console.log('[CollectionTree] No node state, initializing...');

      // Always fetch children on expand (don't pre-populate from item.member)
      if (item.totalChildren > 0) {
        console.log('[CollectionTree] Will load children');
        await loadChildren(item);
      } else {
        // No children to load, just mark as expanded with empty array
        setTreeState((prev) => {
          const next = new Map(prev);
          next.set(itemId, {
            id: itemId,
            isExpanded: true,
            children: [],
            isLoading: false,
          });
          return next;
        });
      }
    } else {
      console.log('[CollectionTree] Node state exists, toggling...');

      // If expanding and children not loaded yet, fetch them
      if (!nodeState.isExpanded && (!nodeState.children || nodeState.children.length === 0) && item.totalChildren > 0) {
        console.log('[CollectionTree] Expanding - need to load children');
        await loadChildren(item);
      } else {
        // Just toggle the expanded state
        console.log('[CollectionTree] Just toggling expanded state');
        setTreeState((prev) => {
          const next = new Map(prev);
          next.set(itemId, {
            ...nodeState,
            isExpanded: !nodeState.isExpanded,
          });
          return next;
        });
      }
    }
  };

  const handleSelect = (item: Collection | Resource) => {
    const itemId = extractIdFromUrl(item['@id']);
    setSelectedId(itemId);

    // Update context with selected item
    setCurrentCollection(item);
    if (isResource(item)) {
      setCurrentResource(item);
    } else {
      setCurrentResource(null);
    }
  };

  // Filter items based on search term
  const matchesSearch = (item: Collection | Resource, search: string): boolean => {
    if (!search.trim()) return true;

    const searchLower = search.toLowerCase();
    const title = typeof item.title === 'string' ? item.title : item['@id'];
    const titleLower = title.toLowerCase();
    const idLower = item['@id'].toLowerCase();
    const description = item.description;
    const descLower = description ? (typeof description === 'string' ? description : '').toLowerCase() : '';

    return titleLower.includes(searchLower) ||
           idLower.includes(searchLower) ||
           descLower.includes(searchLower);
  };

  const filterItems = (
    items: (Collection | Resource)[] | null,
    search: string
  ): (Collection | Resource)[] | null => {
    if (!search.trim() || !items) return items;

    const filtered: (Collection | Resource)[] = [];

    for (const item of items) {
      const itemId = extractIdFromUrl(item['@id']);
      const nodeState = treeState.get(itemId);
      const children = nodeState?.children || item.member || null;

      // Check if item matches
      const itemMatches = matchesSearch(item, search);

      // Check if any children match (recursively)
      const filteredChildren = filterItems(children, search);
      const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

      // Include if item matches OR has matching children
      if (itemMatches || hasMatchingChildren) {
        filtered.push(item);
      }
    }

    return filtered.length > 0 ? filtered : null;
  };

  // Apply search filter
  const filteredRootItems = useMemo(() => {
    if (!rootCollection) return null;
    const items = filterItems([rootCollection], searchTerm);
    return items;
  }, [rootCollection, searchTerm, treeState]);

  const renderTree = (
    items: (Collection | Resource)[],
    level: number = 0
  ): React.ReactNode => {
    return items.map((item) => {
      const itemId = extractIdFromUrl(item['@id']);
      const nodeState = treeState.get(itemId);
      const isLoading = nodeState?.isLoading || false;
      const children = nodeState?.children || item.member || null;

      // Apply search filter to children
      const filteredChildren = filterItems(children, searchTerm);

      // Auto-expand if searching and has matching children
      const isExpanded = !!(nodeState?.isExpanded || (searchTerm && filteredChildren && filteredChildren.length > 0));

      return (
        <CollectionItem
          key={item['@id']}
          item={item}
          level={level}
          isExpanded={isExpanded}
          isSelected={selectedId === itemId}
          onToggle={handleToggle}
          onSelect={handleSelect}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 px-3" style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}>
              <Spinner size="sm" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : (
            filteredChildren && filteredChildren.length > 0 && renderTree(filteredChildren, level + 1)
          )}
        </CollectionItem>
      );
    });
  };

  // Loading state
  if (isLoadingRoot) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  // No endpoints configured
  if (!endpoints.collection) {
    return (
      <div className="p-4">
        <Alert type="info" title="No Collection Endpoint">
          <p className="text-sm">Connect to a DTS endpoint to browse collections.</p>
        </Alert>
      </div>
    );
  }

  // No root collection loaded
  if (!rootCollection) {
    return (
      <div className="p-4">
        <Alert type="warning" title="No Collections">
          <p className="text-sm">
            {localError || 'Failed to load collections from the endpoint.'}
          </p>
        </Alert>
      </div>
    );
  }

  // No results from search
  if (searchTerm && (!filteredRootItems || filteredRootItems.length === 0)) {
    return (
      <div className="p-4">
        <Alert type="info" title="No matches">
          <p className="text-sm">No collections or texts match "{searchTerm}"</p>
        </Alert>
      </div>
    );
  }

  // Render tree
  return (
    <div className="overflow-y-auto">
      {filteredRootItems && renderTree(filteredRootItems)}
    </div>
  );
}
