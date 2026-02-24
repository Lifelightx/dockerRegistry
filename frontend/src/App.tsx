import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RepositoryDetails from './pages/RepositoryDetails';
import TagDetails from './pages/TagDetails';
import UserManagement from './pages/UserManagement';
import GroupDetails from './pages/GroupDetails';
import RecentActivities from './pages/RecentActivities';
import SystemSettings from './pages/SystemSettings';

const ProtectedRoute = ({ children, roles }: { children: React.ReactElement, roles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Layout />}>
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/repository/:name" element={
                <ProtectedRoute>
                  <RepositoryDetails />
                </ProtectedRoute>
              } />
              <Route path="/repository/:name/tags/:tag" element={
                <ProtectedRoute>
                  <TagDetails />
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />

              <Route path="/admin/groups/:id" element={
                <ProtectedRoute roles={['admin']}>
                  <GroupDetails />
                </ProtectedRoute>
              } />

              <Route path="/recent-activities" element={
                <ProtectedRoute>
                  <RecentActivities />
                </ProtectedRoute>
              } />

              <Route path="/admin/settings" element={
                <ProtectedRoute>
                  <SystemSettings />
                </ProtectedRoute>
              } />

            </Route>



            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
