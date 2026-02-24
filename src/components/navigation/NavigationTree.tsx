/**
 * Navigation Tree Component
 * Displays hierarchical citation structure with lazy loading
 */

import { useState, useEffect } from 'react';
import type { CitableUnit, Resource } from '@/types/dts';
import { useDTS } from '@/context/DTSContext';
import {
  fetchCitationLevel,
  getChildren,
  buildNavigationHierarchy,
  hasChildrenUnits,
  getCitationTree,
} from '@/services/dts/navigation';
import { toDTSError } from '@/services/utils/http';
import NavigationItem from './NavigationItem';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';

interface TreeNodeState {
  identifier: string;
  isExpanded: boolean;
  children: CitableUnit[] | null; // null = not loaded, [] = loaded but empty
  isLoading: boolean;
}

interface NavigationTreeProps {
  resource: Resource;
  selectedTreeId?: string;
}

export default function NavigationTree({
  resource,
  selectedTreeId,
}: NavigationTreeProps) {
  const { endpoints, currentNavigation, navigationHierarchy, setError, setCurrentCitation } = useDTS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [treeState, setTreeState] = useState<Map<string, TreeNodeState>>(new Map());

  // IMPORTANT: Use full @id URL for API calls (DraCor DTS requirement)
  const resourceId = resource['@id'];

  // Get citation tree for maxCiteDepth info
  const citationTree = getCitationTree(currentNavigation?.resource || resource, selectedTreeId);

  // When navigation changes, reset tree state
  useEffect(() => {
    setTreeState(new Map());
    setSelectedId(null);
  }, [currentNavigation]);

  const handleToggle = async (unit: CitableUnit) => {
    const nodeState = treeState.get(unit.identifier);

    if (!nodeState) return;

    // If already expanded, just collapse
    if (nodeState.isExpanded) {
      setTreeState((prev) => {
        const next = new Map(prev);
        next.set(unit.identifier, { ...nodeState, isExpanded: false });
        return next;
      });
      return;
    }

    // If not loaded yet, fetch children
    if (nodeState.children === null && !nodeState.isLoading && endpoints.navigation) {
      // Set loading state
      setTreeState((prev) => {
        const next = new Map(prev);
        next.set(unit.identifier, {
          ...nodeState,
          isLoading: true,
          isExpanded: true,
        });
        return next;
      });

      try {
        // Fetch children for this citation level
        const navigation = await fetchCitationLevel(
          endpoints.navigation,
          resourceId,
          unit.identifier,
          1, // down=1 for immediate children only
          selectedTreeId
        );

        // Build hierarchy from response
        const hierarchy = buildNavigationHierarchy(navigation.member);
        const children = getChildren(hierarchy, unit.identifier);

        // Update state with loaded children
        setTreeState((prev) => {
          const next = new Map(prev);

          // Update parent node
          next.set(unit.identifier, {
            ...nodeState,
            children,
            isLoading: false,
            isExpanded: true,
          });

          // Initialize state for all loaded children
          for (const child of children) {
            if (!next.has(child.identifier)) {
              // Check if child might have children
              const childMightHaveChildren =
                hasChildrenUnits(child, hierarchy) ||
                (citationTree?.maxCiteDepth && child.level < citationTree.maxCiteDepth) ||
                false;

              next.set(child.identifier, {
                identifier: child.identifier,
                isExpanded: false,
                children: childMightHaveChildren ? null : [], // null if might have children, [] if definitely no children
                isLoading: false,
              });
            }
          }

          return next;
        });
      } catch (err) {
        setError(toDTSError(err));
        // Reset loading state on error
        setTreeState((prev) => {
          const next = new Map(prev);
          next.set(unit.identifier, {
            ...nodeState,
            isLoading: false,
            isExpanded: false,
          });
          return next;
        });
      }
    } else {
      // Already loaded, just expand
      setTreeState((prev) => {
        const next = new Map(prev);
        next.set(unit.identifier, { ...nodeState, isExpanded: true });
        return next;
      });
    }
  };

  const handleSelect = (unit: CitableUnit) => {
    setSelectedId(unit.identifier);
    setCurrentCitation(unit);
  };

  const renderTree = (
    units: CitableUnit[],
    level: number = 0
  ): React.ReactNode => {
    return units.map((unit) => {
      const nodeState = treeState.get(unit.identifier);
      const isExpanded = nodeState?.isExpanded || false;
      const isSelected = selectedId === unit.identifier;
      const isLoading = nodeState?.isLoading || false;
      const children = nodeState?.children;

      // Determine if unit has children
      // Strategy: Check multiple sources to determine if children exist or might exist
      const hasChildren =
        // 1. Already loaded children
        (children && children.length > 0) ||
        // 2. Children exist in current hierarchy
        (navigationHierarchy && hasChildrenUnits(unit, navigationHierarchy)) ||
        // 3. Not yet loaded but might have children based on level
        // If unit level < maxCiteDepth, it likely has children
        (citationTree?.maxCiteDepth && unit.level < citationTree.maxCiteDepth) ||
        // 4. Node state indicates children not yet loaded (null means unknown)
        (nodeState?.children === null) ||
        false;

      return (
        <NavigationItem
          key={unit.identifier}
          unit={unit}
          level={level}
          isExpanded={isExpanded}
          isSelected={isSelected}
          onToggle={handleToggle}
          onSelect={handleSelect}
          hasChildren={hasChildren}
        >
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
              <Spinner size="sm" />
              <span>Loading...</span>
            </div>
          )}

          {!isLoading && children && children.length > 0 && (
            <>{renderTree(children, level + 1)}</>
          )}
        </NavigationItem>
      );
    });
  };

  // Show loading state if no navigation loaded
  if (!currentNavigation || !navigationHierarchy) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  // Get root level units
  const rootUnits = getChildren(navigationHierarchy, null);

  if (rootUnits.length === 0) {
    return (
      <div className="p-4">
        <Alert type="info">
          No citations available for this resource.
        </Alert>
      </div>
    );
  }

  // Initialize tree state for root units if not already done
  if (treeState.size === 0 && rootUnits.length > 0) {
    const initialState = new Map<string, TreeNodeState>();

    for (const unit of rootUnits) {
      // Determine if unit might have children
      const mightHaveChildren =
        hasChildrenUnits(unit, navigationHierarchy) ||
        (citationTree?.maxCiteDepth && unit.level < citationTree.maxCiteDepth) ||
        false;

      initialState.set(unit.identifier, {
        identifier: unit.identifier,
        isExpanded: false,
        children: mightHaveChildren ? null : [], // null = might have children, [] = definitely no children
        isLoading: false,
      });
    }

    setTreeState(initialState);
  }

  return (
    <div className="overflow-auto">
      {renderTree(rootUnits)}
    </div>
  );
}
