import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import FileUpload from './FileUpload';
import '../styles/Report.css';

const Report = () => {
  const navigate = useNavigate();
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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auto-fill submission_date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, submission_date: today }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const uploadFiles = async (reportId, token) => {
    const totalFiles = files.length;
    let completedFiles = 0;

    await Promise.all(files.map(async (file) => {
      const singleForm = new FormData();
      singleForm.append('file', file);
      singleForm.append('report_id', reportId);

      const res = await fetch('http://localhost:5000/api/reports/attachment', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: singleForm
      });

      if (!res.ok) throw new Error(`Failed to upload file: ${file.name}`);
      completedFiles++;
      setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setUploadProgress(0);

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit report');
      }

      const reportData = await response.json();

      if (files.length > 0) {
        await uploadFiles(reportData.report_id, currentUser.token);
      }

      // Reset form on success
      setFormData({
        incident_date: '',
        incident_time: '',
        location: '',
        submission_date: new Date().toISOString().split('T')[0],
        incident_type: '',
        description: '',
        witnesses: '',
      });
      setFiles([]);
      setUploadProgress(0);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An unexpected error occurred');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-content">
        <h2>Incident Report Form</h2>

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
                disabled
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

          <div className="form-group">
            <label>Attachments</label>
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
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;
