import { Outlet } from 'react-router-dom';
import { useDTS } from '@/context/DTSContext';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '@/components/common/ToastContainer';

function Layout() {
  const { sidebarOpen, toggleSidebar, toasts, removeToast } = useDTS();

  return (
    <div className="flex h-screen flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default Layout;
