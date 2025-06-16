import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@htu.edu.jo';
const ADMIN_PASSWORD = 'Admin@123';

const register = async (firstName, lastName, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const login = async (email, password) => {
  try {
    console.log('Login attempt:', { email, isAdmin: email === ADMIN_EMAIL });
    
    // Check for admin credentials first
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin login successful');
      const adminData = {
        token: 'admin-token',
        user_id: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: ADMIN_EMAIL,
        isAdmin: true
      };
      localStorage.setItem('user', JSON.stringify(adminData));
      return adminData;
    }

    // If not admin, proceed with regular login
    console.log('Regular user login attempt');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.token) {
      const userData = {
        token: response.data.token,
        user_id: response.data.user_id,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        email: response.data.email,
        isAdmin: false
      };
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const logout = () => {
  console.log('Logging out user');
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    console.log('Current user from storage:', user);
    return user;
  }
  console.log('No user found in storage');
  return null;
};

const updateCurrentUser = (userData) => {
  const currentUser = getCurrentUser();
  const updatedUser = { ...currentUser, ...userData };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  updateCurrentUser
};

export default authService; 