/**
 * SearchBar Component
 * Provides search functionality for document content
 */

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (query: string, direction: 'next' | 'prev', containerRef: HTMLElement | null) => void;
  onClose: () => void;
  currentMatch: number;
  totalMatches: number;
  isVisible: boolean;
  containerRef: HTMLElement | null;
}

export default function SearchBar({
  onSearch,
  onClose,
  currentMatch,
  totalMatches,
  isVisible,
  containerRef,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search bar becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Trigger search when query changes
  useEffect(() => {
    if (query.trim()) {
      onSearch(query, 'next', containerRef);
    }
  }, [query, containerRef]);

  const handleNext = () => {
    if (query.trim()) {
      onSearch(query, 'next', containerRef);
    }
  };

  const handlePrev = () => {
    if (query.trim()) {
      onSearch(query, 'prev', containerRef);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
      {/* Search Icon */}
      <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search in document..."
        className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Match Counter */}
      {query.trim() && (
        <div className="flex-shrink-0 text-sm text-gray-600">
          {totalMatches > 0 ? (
            <>
              {currentMatch} of {totalMatches}
            </>
          ) : (
            <span className="text-gray-400">No matches</span>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-1">
        <button
          onClick={handlePrev}
          disabled={!query.trim() || totalMatches === 0}
          className="rounded p-1 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={!query.trim() || totalMatches === 0}
          className="rounded p-1 text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          title="Next match (Enter)"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded p-1 text-gray-600 hover:bg-gray-200"
        title="Close search (Esc)"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
