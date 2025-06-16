import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Report from './components/Report';
import EditReport from './components/EditReport';
import ViewReport from './components/ViewReport';
import AdminReportView from './components/AdminReportView';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Wrapper component to handle header visibility logic
const AppContent = () => {
  const location = useLocation();
  
  // Array of paths where header should be hidden
  const noHeaderPaths = ['/login', '/register'];
  const shouldShowHeader = !noHeaderPaths.includes(location.pathname);
  const isAuthPath = noHeaderPaths.includes(location.pathname);

  return (
    <div className="app">
      {shouldShowHeader && <Header />}
      <main className={`main-content ${!shouldShowHeader ? 'no-header' : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/report/:reportId" 
            element={
              <AdminRoute>
                <AdminReportView />
              </AdminRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/edit/:reportId" 
            element={
              <ProtectedRoute>
                <EditReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/view/:reportId" 
            element={
              <ProtectedRoute>
                <ViewReport />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
