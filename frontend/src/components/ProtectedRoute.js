import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

const ProtectedRoute = ({ children }) => {
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 