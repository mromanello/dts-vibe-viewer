/**
 * Empty State Component
 * Placeholder when no document is loaded
 */

export default function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        {/* Document icon */}
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No Document Loaded
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Select a citation from the navigation tree or click "View Document" to load content.
        </p>
      </div>
    </div>
  );
}
