import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/auth.service';
import '../styles/ViewReport.css';

const ViewReport = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
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
        throw new Error('Failed to download file');
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
      setError('Failed to download file');
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
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="view-report-container">
      <div className="view-report-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
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

        {report.admin_comment && (
          <div className="detail-section full-width">
            <h3>Admin Response</h3>
            <div className="admin-comment-box">
              <p>{report.admin_comment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReport; 