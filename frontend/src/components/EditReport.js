import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/auth.service';
import FileUpload from './FileUpload';
import '../styles/Report.css';

const EditReport = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [formData, setFormData] = useState({
    incident_date: '',
    incident_time: '',
    location: '',
    submission_date: '',
    incident_type: '',
    description: '',
    witnesses: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingAttachments, setExistingAttachments] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        let response;
        try {
          response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`
            }
          });
        } catch (networkError) {
          throw new Error('Unable to connect to the server. Please check if the server is running.');
        }

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Server is not responding properly. Please check if the backend server is running.');
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch report');
        }

        // Format dates and time for input fields
        const formattedData = {
          ...data,
          incident_date: data.incident_date ? new Date(data.incident_date).toISOString().split('T')[0] : '',
          submission_date: data.submission_date ? new Date(data.submission_date).toISOString().split('T')[0] : '',
          incident_time: data.incident_time ? data.incident_time.slice(0, 5) : '' // Format time to HH:mm
        };

        setFormData(formattedData);
        setExistingAttachments(data.attachments || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching report:', error);
        setError(error.message || 'Failed to load report');
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const uploadFiles = async (token) => {
    const totalFiles = files.length;
    let completedFiles = 0;

    await Promise.all(files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_id', reportId);

      const response = await fetch('http://localhost:5000/api/reports/attachment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      completedFiles++;
      setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      let response;
      try {
        response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(formData)
        });
      } catch (networkError) {
        throw new Error('Unable to connect to the server. Please check if the server is running.');
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Server is not responding properly. Please check if the backend server is running.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update report');
      }

      // Upload new files if any
      if (files.length > 0) {
        await uploadFiles(currentUser.token);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating report:', error);
      setError(error.message || 'An error occurred while updating the report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/reports/attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Accept': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete attachment');
      }

      // Remove the deleted attachment from the state
      setExistingAttachments(prev => prev.filter(attachment => attachment.attachment_id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setError(error.message || 'Failed to delete attachment');
    }
  };


  if (isLoading) {
    return (
      <div className="report-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-form">
        <h2>Edit Report</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Incident</label>
              <input
                type="date"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Time of Incident</label>
              <input
                type="time"
                name="incident_time"
                value={formData.incident_time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Office Building, 3rd Floor"
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Submission</label>
              <input
                type="date"
                name="submission_date"
                value={formData.submission_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type of Incident</label>
            <select
              name="incident_type"
              value={formData.incident_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select</option>
              <option value="verbal">Verbal</option>
              <option value="physical">Physical</option>
              <option value="sexual">Sexual</option>
              <option value="cyber">Cyber</option>
              <option value="bullying">Bullying</option>
              <option value="stalking">Stalking</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
              placeholder="Please provide a detailed description of the incident"
            />
          </div>

          <div className="form-group">
            <label>Witnesses</label>
            <input
              type="text"
              name="witnesses"
              value={formData.witnesses}
              onChange={handleInputChange}
              placeholder="Names of any witnesses (optional)"
            />
          </div>

          {existingAttachments.length > 0 && (
            <div className="form-group">
              <label>Existing Attachments</label>
              <div className="attachments-list">
                {existingAttachments.map((attachment) => (
                  <div key={attachment.attachment_id} className="attachment-item">
                    <span className="attachment-name">
                      {attachment.file_path.split(/[/\\]/).pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Add New Attachments</label>
            <FileUpload onFilesChange={handleFilesChange} maxFileSize={5} />
          </div>

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div
                className="progress-bar"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
              <div className="progress-text">{uploadProgress}% uploaded</div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/dashboard')} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="submit-button">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReport; 