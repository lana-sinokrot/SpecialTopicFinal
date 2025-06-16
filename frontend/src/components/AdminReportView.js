import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/auth.service';
import '../styles/ViewReport.css';

const AdminReportView = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.email !== 'admin@htu.edu.jo') {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report details');
        }

        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async (filePath) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const filename = filePath.split(/[/\\]/).pop();
      const response = await fetch(`http://localhost:5000/api/reports/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError(error.message || 'Failed to download file');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || currentUser.email !== 'admin@htu.edu.jo') {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ admin_comment: comment })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // If response is not JSON, get the text for better error reporting
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to add comment');
      }

      setReport(prev => ({ ...prev, admin_comment: comment }));
      setComment('');
      setCommentStatus({ message: 'Comment added successfully', type: 'success' });
      setTimeout(() => setCommentStatus({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentStatus({ 
        message: `Failed to add comment: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div className="view-report-loading">
        <div className="spinner"></div>
        <p>Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="view-report-error">
        <h2>Report Not Found</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin')} className="back-button">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="view-report-container">
      <div className="view-report-header">
        <button onClick={() => navigate('/admin')} className="back-button">
          ← Back to Admin Dashboard
        </button>
        <span className={`status-badge ${report.status.toLowerCase()}`}>
          {report.status}
        </span>
      </div>

      <div className="report-content">
        <div className="report-title">
          <h1>{report.incident_type} Incident Report</h1>
          <p className="report-subtitle">Report #{report.report_id}</p>
        </div>

        <div className="detail-section">
          <h3>Reporter Information</h3>
          <div className="detail-item">
            <label>Name:</label>
            <span>{report.user_first_name} {report.user_last_name}</span>
          </div>
          <div className="detail-item">
            <label>Email:</label>
            <span>{report.user_email}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3>Incident Details</h3>
          <div className="detail-item">
            <label>Date:</label>
            <span>{formatDate(report.incident_date)}</span>
          </div>
          <div className="detail-item">
            <label>Time:</label>
            <span>{report.incident_time}</span>
          </div>
          <div className="detail-item">
            <label>Location:</label>
            <span>{report.location}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3>Report Information</h3>
          <div className="detail-item">
            <label>Submitted:</label>
            <span>{formatDate(report.submission_date)}</span>
          </div>
          <div className="detail-item">
            <label>Status:</label>
            <span>{report.status}</span>
          </div>
        </div>

        <div className="detail-section full-width">
          <h3>Description</h3>
          <div className="description-box">
            {report.description}
          </div>
        </div>

        {report.witnesses && (
          <div className="detail-section full-width">
            <h3>Witnesses</h3>
            <div className="witnesses-box">
              {report.witnesses}
            </div>
          </div>
        )}

        {report.attachments && report.attachments.length > 0 && (
          <div className="detail-section full-width">
            <h3>Attachments</h3>
            <div className="attachments-list">
              {report.attachments.map((attachment) => (
                <div key={attachment.attachment_id} className="attachment-item">
                  <span className="attachment-name">
                    {attachment.file_path.split('/').pop()}
                  </span>
                  <button
                    onClick={() => handleDownload(attachment.file_path)}
                    className="download-button"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section full-width">
          <h3>Admin Comment</h3>
          <form onSubmit={handleCommentSubmit} className="admin-comment-form">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={report.admin_comment ? "Update admin comment..." : "Add admin comment..."}
              className="admin-comment-textarea"
              rows="4"
            />
            <button type="submit" className="submit-comment-button">
              {report.admin_comment ? "Update Comment" : "Add Comment"}
            </button>
          </form>
          {commentStatus.message && (
            <div className={`comment-status ${commentStatus.type}`}>
              {commentStatus.message}
            </div>
          )}
          {report.admin_comment && (
            <div className="current-comment-box">
              <h4>Current Comment:</h4>
              <p>{report.admin_comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportView; 