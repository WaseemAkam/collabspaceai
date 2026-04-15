import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontFamily: 'Geist, sans-serif',
            boxShadow: 'var(--shadow-lg)',
          },
          success: { iconTheme: { primary: '#34d399', secondary: 'var(--bg3)' }, style: { borderColor: 'rgba(52,211,153,0.2)' } },
          error:   { iconTheme: { primary: '#f87171', secondary: 'var(--bg3)' }, style: { borderColor: 'rgba(248,113,113,0.2)' } },
        }}
      />
      <Routes>
        <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/"            element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/project/:id" element={<PrivateRoute><ProjectBoard /></PrivateRoute>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}