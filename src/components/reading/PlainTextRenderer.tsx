/**
 * Plain Text Renderer Component
 * Displays plain text content with optional line numbers
 */

interface PlainTextRendererProps {
  content: string;
  showLineNumbers?: boolean;
}

export default function PlainTextRenderer({
  content,
  showLineNumbers = true,
}: PlainTextRendererProps) {
  const lines = content.split('\n');

  return (
    <div className="flex h-full bg-white font-mono text-sm">
      {showLineNumbers && (
        <div className="select-none border-r border-gray-300 bg-gray-50 px-4 py-2 text-right text-gray-500">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap leading-6">{content}</pre>
      </div>
    </div>
  );
}
