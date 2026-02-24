/**
 * XML Renderer Component
 * Displays XML/TEI content with syntax highlighting
 */

interface XMLRendererProps {
  content: string;
  showLineNumbers?: boolean;
}

export default function XMLRenderer({
  content,
  showLineNumbers = true,
}: XMLRendererProps) {
  const lines = content.split('\n');

  return (
    <div className="flex h-full font-mono text-sm">
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
        <pre className="whitespace-pre-wrap">
          <code
            dangerouslySetInnerHTML={{ __html: highlightXML(escapeHTML(content)) }}
          />
        </pre>
      </div>
    </div>
  );
}

/**
 * Escape HTML for safe rendering
 * @param str - String to escape
 * @returns Escaped HTML string
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple regex-based XML syntax highlighting
 * @param xml - Escaped XML string
 * @returns HTML string with syntax highlighting
 */
function highlightXML(xml: string): string {
  return xml
    // Comments
    .replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="text-gray-400 italic">$1</span>'
    )
    // Opening/closing tags
    .replace(
      /(&lt;\/?[\w:]+)/g,
      '<span class="text-blue-600 font-semibold">$1</span>'
    )
    // Attributes
    .replace(/([\w:]+)=/g, '<span class="text-green-600">$1</span>=')
    // Attribute values
    .replace(/="([^"]*)"/g, '="<span class="text-orange-600">$1</span>"');
}
