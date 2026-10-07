import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  return (
    // reducedMotion="user" disables transform and layout animations when the OS asks for less motion.
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MotionConfig>
  );
}
