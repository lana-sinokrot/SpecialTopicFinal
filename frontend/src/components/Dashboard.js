// frontend/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null, type: '' });

  useEffect(() => {
    const fetchUserDataAndReports = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        // Fetch fresh user data from the server
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // After getting user data, fetch their reports
          fetchUserReports(userData.user_id);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load reports');
        setLoading(false);
      }
    };

    fetchUserDataAndReports();
  }, [navigate]);

  const fetchUserReports = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getCurrentUser().token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setReports(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    navigate('/report');
  };

  const handleEditReport = (reportId) => {
    navigate(`/report/edit/${reportId}`);
  };

  const handleViewReport = (reportId) => {
    navigate(`/report/view/${reportId}`);
  };

  const handleDeleteClick = (report) => {
    setDeleteModal({
      isOpen: true,
      reportId: report.report_id,
      type: report.incident_type.toLowerCase()
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, reportId: null, type: '' });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${deleteModal.reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getCurrentUser().token}`
        }
      });

      if (response.ok) {
        const updatedReports = reports.filter(report => report.report_id !== deleteModal.reportId);
        setReports(updatedReports);
        
        setDeleteModal({ isOpen: false, reportId: null, type: '' });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setError(error.message || 'An error occurred while deleting the report');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.first_name}!</h1>
          <p className="welcome-subtitle">Here's an overview of your reports</p>
        </div>
        <button onClick={handleNewReport} className="report-button">
          Report It, Now!
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reports.length > 0 ? (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report.report_id} className="report-card">
              <div className="report-content">
                <div className="report-info">
                  <h3>{report.incident_type} Incident</h3>
                  <p className="report-date">Submitted on {formatDate(report.submission_date)}</p>
                  <span className={`status ${report.status.toLowerCase()}`}>
                    {report.status}
                  </span>
                </div>
                <div className="report-actions">
                  <button
                    onClick={() => handleViewReport(report.report_id)}
                    className="view-button"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditReport(report.report_id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(report)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-reports">
          <p>You haven't submitted any reports yet.</p>
          <button onClick={handleNewReport} className="start-report-button">
            Submit your first report
          </button>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        reportType={deleteModal.type}
      />
    </div>
  );
};

export default Dashboard;