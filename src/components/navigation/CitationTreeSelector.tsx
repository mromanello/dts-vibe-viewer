/**
 * Citation Tree Selector Component
 * Dropdown for selecting between multiple citation trees
 */

import type { CitationTree } from '@/types/dts';

interface CitationTreeSelectorProps {
  trees: CitationTree[];
  selectedTree?: string;
  onSelectTree: (treeId: string) => void;
}

export default function CitationTreeSelector({
  trees,
  selectedTree,
  onSelectTree,
}: CitationTreeSelectorProps) {
  // Only render if there are multiple trees
  if (trees.length <= 1) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectTree(e.target.value);
  };

  // Get the selected tree object
  const currentTree = trees.find((t) => t.identifier === selectedTree) || trees[0];

  return (
    <div className="border-b border-gray-200 bg-white p-3">
      <label htmlFor="citation-tree-select" className="block text-sm font-medium text-gray-700">
        Citation Structure
      </label>
      <select
        id="citation-tree-select"
        value={selectedTree || trees[0]?.identifier || ''}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
      >
        {trees.map((tree) => (
          <option
            key={tree.identifier || 'default'}
            value={tree.identifier || ''}
          >
            {tree.identifier || 'Default Citation Tree'}
            {tree.description && ` - ${tree.description}`}
          </option>
        ))}
      </select>

      {/* Show description of selected tree */}
      {currentTree?.description && (
        <p className="mt-1 text-xs text-gray-500">{currentTree.description}</p>
      )}
    </div>
  );
}
