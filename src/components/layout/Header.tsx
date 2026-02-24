import { Link, useNavigate } from 'react-router-dom';
import { useDTS } from '@/context/DTSContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { entryPoint, resetState } = useDTS();

  const handleDisconnect = () => {
    resetState();
    navigate('/', { replace: true });
  };
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">DTS Viewer</h1>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          {entryPoint ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-900">Connected to</span>
                <span className="font-mono text-green-700">{entryPoint['@id']}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Disconnect
              </button>
            </>
          ) : (
            <a
              href="https://github.com/distributed-text-services/specifications"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              DTS Specification
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
