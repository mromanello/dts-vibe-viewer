/**
 * useDocumentSearch Hook
 * Manages document search state and highlighting
 */

import { useState, useCallback, useRef } from 'react';

interface SearchMatch {
  index: number;
  start: number;
  end: number;
}

export interface HoveredMatch {
  text: string;
  element: HTMLElement;
  position: { top: number; left: number };
}

interface UseDocumentSearchResult {
  currentMatch: number;
  totalMatches: number;
  hoveredMatch: HoveredMatch | null;
  search: (query: string, direction: 'next' | 'prev', containerRef: HTMLElement | null) => void;
  clearSearch: () => void;
  setHoveredMatch: (match: HoveredMatch | null) => void;
}

export function useDocumentSearch(): UseDocumentSearchResult {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [hoveredMatch, setHoveredMatch] = useState<HoveredMatch | null>(null);
  const highlightedElements = useRef<HTMLElement[]>([]);
  const containerRefCache = useRef<HTMLElement | null>(null);

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    highlightedElements.current.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        const textNode = document.createTextNode(el.textContent || '');
        parent.replaceChild(textNode, el);
      }
    });
    highlightedElements.current = [];
  }, []);

  // Highlight all matches in the DOM
  const highlightMatches = useCallback((containerRef: HTMLElement, searchQuery: string, currentIndex: number) => {
    // Clear previous highlights
    clearHighlights();

    const normalizedQuery = searchQuery.toLowerCase();
    const walker = document.createTreeWalker(
      containerRef,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.toLowerCase().includes(normalizedQuery)) {
        textNodes.push(node as Text);
      }
    }

    // Highlight matches in text nodes
    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      const normalizedText = text.toLowerCase();
      const parent = textNode.parentNode;

      if (!parent) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let position = normalizedText.indexOf(normalizedQuery, 0);

      while (position !== -1) {
        // Add text before match
        if (position > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, position)));
        }

        // Create highlighted span for match
        const mark = document.createElement('mark');
        mark.textContent = text.substring(position, position + normalizedQuery.length);
        mark.className = 'bg-yellow-200 cursor-pointer';
        mark.setAttribute('data-search-match', 'true');

        // Add hover event listeners
        mark.addEventListener('mouseenter', () => {
          const rect = mark.getBoundingClientRect();
          setHoveredMatch({
            text: mark.textContent || '',
            element: mark,
            position: {
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX,
            },
          });
        });

        mark.addEventListener('mouseleave', () => {
          // Small delay to allow moving to tooltip
          setTimeout(() => {
            setHoveredMatch(null);
          }, 100);
        });

        fragment.appendChild(mark);
        highlightedElements.current.push(mark);

        lastIndex = position + normalizedQuery.length;
        position = normalizedText.indexOf(normalizedQuery, lastIndex);
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      parent.replaceChild(fragment, textNode);
    });

    // Highlight current match differently
    if (currentIndex >= 0 && currentIndex < highlightedElements.current.length) {
      const currentMark = highlightedElements.current[currentIndex];
      currentMark.className = 'bg-orange-400 text-white';
      currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clearHighlights]);

  // Search and navigate
  const search = useCallback((searchQuery: string, direction: 'next' | 'prev', containerRef: HTMLElement | null) => {
    if (!containerRef || !searchQuery.trim()) {
      clearHighlights();
      setMatches([]);
      setCurrentMatchIndex(0);
      setQuery('');
      return;
    }

    containerRefCache.current = containerRef;

    // If query changed, find all matches
    if (searchQuery !== query) {
      setQuery(searchQuery);

      // Count matches
      const textContent = containerRef.textContent || '';
      const normalizedQuery = searchQuery.toLowerCase();
      const normalizedContent = textContent.toLowerCase();

      const foundMatches: SearchMatch[] = [];
      let index = 0;
      let position = normalizedContent.indexOf(normalizedQuery, 0);

      while (position !== -1) {
        foundMatches.push({
          index,
          start: position,
          end: position + normalizedQuery.length,
        });
        index++;
        position = normalizedContent.indexOf(normalizedQuery, position + 1);
      }

      setMatches(foundMatches);

      if (foundMatches.length > 0) {
        setCurrentMatchIndex(0);
        highlightMatches(containerRef, searchQuery, 0);
      } else {
        setCurrentMatchIndex(-1);
        clearHighlights();
      }
    } else {
      // Same query, navigate
      if (matches.length === 0) return;

      let newIndex = currentMatchIndex;

      if (direction === 'next') {
        newIndex = (currentMatchIndex + 1) % matches.length;
      } else {
        newIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
      }

      setCurrentMatchIndex(newIndex);

      // Update highlights
      if (highlightedElements.current.length > 0) {
        // Remove previous current highlight
        if (currentMatchIndex >= 0 && currentMatchIndex < highlightedElements.current.length) {
          const prevMark = highlightedElements.current[currentMatchIndex];
          prevMark.className = 'bg-yellow-200';
        }

        // Highlight new current match
        if (newIndex >= 0 && newIndex < highlightedElements.current.length) {
          const currentMark = highlightedElements.current[newIndex];
          currentMark.className = 'bg-orange-400 text-white';
          currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [query, matches, currentMatchIndex, highlightMatches, clearHighlights]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setMatches([]);
    setCurrentMatchIndex(0);
    clearHighlights();
  }, [clearHighlights]);

  return {
    currentMatch: currentMatchIndex + 1,
    totalMatches: matches.length,
    hoveredMatch,
    search,
    clearSearch,
    setHoveredMatch,
  };
}
