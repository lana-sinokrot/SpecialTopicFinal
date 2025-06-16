import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

const AdminRoute = ({ children }) => {
  const currentUser = authService.getCurrentUser();
  
  // Debug logs
  console.log('Current user:', currentUser);
  console.log('Is admin?:', currentUser?.email === 'admin@htu.edu.jo');

  if (!currentUser) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (currentUser.email !== 'admin@htu.edu.jo') {
    console.log('User is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('User is admin, allowing access');
  return children;
};

export default AdminRoute; 