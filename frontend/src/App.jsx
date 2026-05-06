import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppLayout from './components/shared/AppLayout';
import AlertNotification from './components/shared/AlertNotification';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import TaskBoard from './components/tasks/TaskBoard';
import Landing from './components/landing/Landing';
import ProfilePage from './components/profile/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AlertNotification />
          <Routes>
            {/* ALL routes share one AppLayout (GlobalNavbar + optional footer) */}
            <Route element={<AppLayout />}>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/projects/:id/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
