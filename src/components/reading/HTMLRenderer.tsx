/**
 * HTML Renderer Component
 * Displays HTML content in a sandboxed iframe for security
 */

interface HTMLRendererProps {
  content: string;
}

export default function HTMLRenderer({ content }: HTMLRendererProps) {
  return (
    <div className="h-full w-full bg-white">
      <iframe
        srcDoc={content}
        sandbox="allow-same-origin"
        className="h-full w-full border-0"
        title="Document content"
      />
    </div>
  );
}
