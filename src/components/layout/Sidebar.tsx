import { useState } from 'react';
import { useDTS } from '@/context/DTSContext';
import CollectionBrowser from '@/components/collections/CollectionBrowser';
import NavigationBrowser from '@/components/navigation/NavigationBrowser';

interface SidebarProps {
  isOpen: boolean;
}

type TabType = 'collections' | 'navigation';

function Sidebar({ isOpen }: SidebarProps) {
  const { currentResource } = useDTS();
  const [activeTab, setActiveTab] = useState<TabType>('collections');

  // Determine which tabs to show
  const showNavigationTab = currentResource !== null;

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 top-16 z-30 w-80 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`}
    >
      <div className="flex h-full flex-col">
        {/* Tab Header */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('collections')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'collections'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Collections
            </button>
            {showNavigationTab && (
              <button
                onClick={() => setActiveTab('navigation')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'navigation'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Navigation
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <div className={activeTab === 'collections' ? 'h-full' : 'hidden'}>
            <CollectionBrowser />
          </div>
          {currentResource && (
            <div className={activeTab === 'navigation' ? 'h-full' : 'hidden'}>
              <NavigationBrowser resource={currentResource} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
