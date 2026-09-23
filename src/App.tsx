import { Routes, Route, Navigate } from 'react-router';
import Home from './pages/Home';
import AdminPage from './pages/Admin';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* /dash was the old admin shortcut path — kept working so nothing bookmarked breaks. */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dash" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111112',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
          },
        }}
      />
    </>
  );
}
