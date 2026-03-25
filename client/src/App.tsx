import { Navigate, Route, Routes } from 'react-router-dom';
import { AppFrame } from './components/AppFrame';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdDetailsPage } from './pages/AdDetailsPage';
import { AdEditPage } from './pages/AdEditPage';
import { AdsListPage } from './pages/AdsListPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <AppFrame>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/ads" replace />} />
          <Route path="/ads" element={<AdsListPage />} />
          <Route path="/ads/:id" element={<AdDetailsPage />} />
          <Route path="/ads/:id/edit" element={<AdEditPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </AppFrame>
  );
}

export default App;
