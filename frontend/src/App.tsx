import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SharePage from './pages/SharePage';

// Layout & App Pages
import MainLayout from './components/layout/MainLayout';
import WorkspacePage from './pages/WorkspacePage';
import MaterialsPage from './pages/MaterialsPage';
import ProjectsPage from './pages/ProjectsPage';

// Захист для внутрішніх сторінок (пускає тільки авторизованих)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem' }}>Завантаження...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// НОВЕ: Захист для публічних сторінок (не пускає авторизованих)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem' }}>Завантаження...</div>;
  // Якщо юзер вже є, одразу кидаємо його в робочу область
  if (user) return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публічні роути (обгорнуті в PublicRoute) */}
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/update-password" element={<PublicRoute><UpdatePasswordPage /></PublicRoute>} />
        
        {/* Ці роути залишаємо без обгорток, бо вони технічні або шарінг */}
        <Route path="/auth/callback"   element={<AuthCallbackPage />} />
        <Route path="/share/:shareId"  element={<SharePage />} />
        
        {/* Захищені роути з Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/workspace" replace />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="projects"  element={<ProjectsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}