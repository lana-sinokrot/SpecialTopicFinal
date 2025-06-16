import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null, type: '' });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalReports, setTotalReports] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    'in-progress': 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.email !== 'admin@htu.edu.jo') {
          navigate('/dashboard');
          return;
        }

        const response = await fetch('http://localhost:5000/api/admin/reports', {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data);
        setTotalReports(data.length);
        
        // Calculate status counts
        const counts = data.reduce((acc, report) => {
          const status = report.status.toLowerCase();
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        setStatusCounts(counts);
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load reports');
        setLoading(false);
      }
    };

    fetchAllReports();
  }, [navigate]);

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
        setReports(reports.filter(report => report.report_id !== deleteModal.reportId));
        setTotalReports(prev => prev - 1);
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

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getCurrentUser().token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedReports = reports.map(report =>
          report.report_id === reportId ? { ...report, status: newStatus } : report
        );
        setReports(updatedReports);
        
        // Update status counts
        const counts = updatedReports.reduce((acc, report) => {
          const status = report.status.toLowerCase();
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        setStatusCounts(counts);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || 'An error occurred while updating the status');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredReports = reports
    .filter(report => {
      if (filter === 'all') return true;
      return report.status.toLowerCase() === filter;
    })
    .filter(report =>
      searchTerm === '' ||
      report.incident_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${report.user_first_name} ${report.user_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="admin-title">
          <h1>Admin Dashboard</h1>
          <p className="admin-stats">
            Total Reports: {totalReports} | 
            Pending: {statusCounts.pending || 0} | 
            In Progress: {statusCounts['in-progress'] || 0} | 
            Resolved: {statusCounts.resolved || 0}
          </p>
        </div>
        <div className="admin-controls">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-reports-grid">
        {filteredReports.map(report => (
          <div key={report.report_id} className="admin-report-card">
            <div className="report-header">
              <h3>{report.incident_type} Incident</h3>
              <select
                value={report.status}
                onChange={(e) => handleStatusChange(report.report_id, e.target.value)}
                className={`status-select ${report.status.toLowerCase()}`}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="report-details">
              <p className="reporter-info">
                Reported by: {report.user_first_name} {report.user_last_name}
              </p>
              <p className="report-date">Submitted on {formatDate(report.submission_date)}</p>
            </div>
            <div className="report-actions">
              <button
                onClick={() => navigate(`/admin/report/${report.report_id}`)}
                className="view-button"
              >
                View Details
              </button>
              <button
                onClick={() => handleDeleteClick(report)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="no-reports">
          <p>No reports found matching your criteria.</p>
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

export default AdminDashboard; 