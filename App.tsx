import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import { Role } from './types';
import GlobalNotification from './components/GlobalNotification';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Main />
      </HashRouter>
    </DataProvider>
  );
};

const Main: React.FC = () => {
  const { currentUser, systemSettings } = useData();

  if (currentUser && currentUser.forcePasswordChange) {
    return (
      <Routes>
        <Route path="/force-change-password" element={<ForceChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/force-change-password" />} />
      </Routes>
    );
  }

  const getHomeRoute = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === Role.ADMIN) return '/admin';
    if (currentUser.role === Role.COORDINATOR) return '/coordinator';
    return '/student';
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <GlobalNotification />
      <Routes>
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to={getHomeRoute()} />} />
        <Route path="/admin-login" element={!currentUser ? <AdminLoginPage /> : <Navigate to="/admin" />} />
        
        <Route 
          path="/register" 
          element={
            !currentUser && systemSettings.allowStudentRegistration 
              ? <RegisterPage /> 
              : <Navigate to={getHomeRoute()} />
          } 
        />
        
        <Route path="/forgot-password" element={!currentUser ? <ForgotPasswordPage /> : <Navigate to={getHomeRoute()} />} />
        <Route path="/reset-password" element={!currentUser ? <ResetPasswordPage /> : <Navigate to={getHomeRoute()} />} />

        <Route path="/admin/*" element={
          currentUser?.role === Role.ADMIN ? <AdminDashboard /> : <Navigate to="/admin-login" />
        } />
        <Route path="/coordinator/*" element={
          currentUser?.role === Role.COORDINATOR ? <CoordinatorDashboard /> : <Navigate to="/login" />
        } />
        <Route path="/student/*" element={
          currentUser?.role === Role.STUDENT ? <StudentDashboard /> : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to={getHomeRoute()} />} />
      </Routes>
    </div>
  );
};

export default App;