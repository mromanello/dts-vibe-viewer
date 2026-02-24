/**
 * Collection Browser Component
 * Combines CollectionTree with CollectionMetadata detail panel and search
 */

import { useState } from 'react';
import { useDTS } from '@/context/DTSContext';
import CollectionTree from './CollectionTree';
import CollectionMetadata from './CollectionMetadata';

export default function CollectionBrowser() {
  const { currentCollection, setCurrentCollection } = useDTS();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex h-full flex-col">
      {/* Search Box */}
      <div className="border-b border-gray-200 bg-white p-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search collections and texts..."
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className={currentCollection ? 'flex-1 overflow-auto border-b border-gray-200' : 'flex-1 overflow-auto'}>
        <CollectionTree searchTerm={searchTerm} />
      </div>

      {/* Metadata Panel - shows when item selected */}
      {currentCollection && (
        <div className="h-96 overflow-auto border-t border-gray-200 bg-gray-50">
          <CollectionMetadata
            item={currentCollection}
            onClose={() => setCurrentCollection(null)}
          />
        </div>
      )}
    </div>
  );
}
