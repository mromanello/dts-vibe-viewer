import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DTSProvider } from './context/DTSContext';
import Layout from './components/layout/Layout';
import EntryPage from './pages/EntryPage';
import DocumentPage from './pages/DocumentPage';

function App() {
  return (
    <DTSProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<EntryPage />} />
            <Route path="document/:resourceId" element={<DocumentPage />} />
            <Route path="document/:resourceId/:citation" element={<DocumentPage />} />
          </Route>
        </Routes>
      </Router>
    </DTSProvider>
  );
}

export default App;
