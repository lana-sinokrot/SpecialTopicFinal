import React, { useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Weather from './Weather';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Header.css';
import authService from '../services/auth.service';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  // Debug logs
  useEffect(() => {
    console.log('Header - Current user:', currentUser);
    console.log('Header - Is admin?:', currentUser?.email === 'admin@htu.edu.jo');
    console.log('Header - Current location:', location.pathname);
  }, [currentUser, location]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Function to check if user is admin
  const isAdmin = currentUser?.email === 'admin@htu.edu.jo';

  // Function to handle dashboard click
  const handleDashboardClick = (e) => {
    e.preventDefault();
    const dashboardPath = isAdmin ? '/admin' : '/dashboard';
    console.log('Navigating to:', dashboardPath);
    navigate(dashboardPath);
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="py-3">
      <Container>
        <div className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-4">
            <span className="h4 mb-0">HTUharassment</span>
          </Navbar.Brand>
          <Weather />
        </div>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {currentUser ? (
              // Navigation items for logged-in users
              <>
                {/* Dashboard link based on user role */}
                <Nav.Link 
                  onClick={handleDashboardClick}
                  className={location.pathname === (isAdmin ? '/admin' : '/dashboard') ? 'active' : ''}
                >
                  Dashboard
                </Nav.Link>
                {/* User info display */}
                <Nav.Link className="user-info">
                  Welcome, {currentUser.firstName || 'User'}
                </Nav.Link>
                
                {/* Logout button */}
                <Nav.Link 
                  onClick={handleLogout}
                  className="btn btn-outline-light ms-2"
                >
                  Logout
                </Nav.Link>
              </>
            ) : (
              // Navigation items for non-logged-in users
              <>
                <Nav.Link as={Link} to="/login" className="me-3">Login</Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register" 
                  className="btn btn-primary"
                >
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 