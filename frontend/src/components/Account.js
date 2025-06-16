import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import '../styles/Account.css';

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        // Fetch fresh user data from the server
        const response = await fetch(
          `http://localhost:5000/api/users/${currentUser.user_id}`,
          {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`
            }
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setUser({ ...currentUser, ...userData });
          setFormData({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({ text: 'Error loading user data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      // Validate passwords if being changed
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          setMessage({ text: 'New passwords do not match', type: 'error' });
          return;
        }
        if (!formData.current_password) {
          setMessage({ text: 'Current password is required', type: 'error' });
          return;
        }
      }

      const response = await fetch(`http://localhost:5000/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          current_password: formData.current_password || undefined,
          new_password: formData.new_password || undefined
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update local storage and state
        const updatedUserData = {
          ...user,
          ...updatedUser
        };
        authService.updateCurrentUser(updatedUserData);
        setUser(updatedUserData);
        setMessage({ text: 'Profile updated successfully', type: 'success' });
        setIsEditing(false);
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
      } else {
        const error = await response.json();
        setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ text: 'An error occurred while updating profile', type: 'error' });
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="account-loading">Loading...</div>;
  }

  if (!user) {
    return <div className="account-loading">Please log in to view your account.</div>;
  }

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>Account Settings</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="account-content">
        <div className="profile-section">
          <div className="section-header">
            <h2>Profile Information</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="edit-button"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <>
                <div className="password-section">
                  <h3>Change Password</h3>
                  <div className="form-group">
                    <label htmlFor="current_password">Current Password</label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account; 