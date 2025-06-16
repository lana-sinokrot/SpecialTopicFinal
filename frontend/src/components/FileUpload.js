import React, { useRef, useState } from 'react';
import '../styles/FileUpload.css';

const FileUpload = ({ onFilesChange, maxFileSize = 5 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const ACCEPTED_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  };

  const acceptedExtensions = Object.values(ACCEPTED_TYPES).flat().join(',');

  const validateFile = (file) => {
    // Size check
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Max size is ${maxFileSize}MB.`;
    }

    // Type check (fallback for missing MIME types)
    const isAccepted = Object.keys(ACCEPTED_TYPES).includes(file.type);
    if (!isAccepted) {
      return `File "${file.name}" is not an accepted type.`;
    }

    return null;
  };

  const handleFiles = (files) => {
    const fileList = Array.from(files);
    const errors = [];
    const validFiles = [];

    fileList.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    });

    setError(errors.join('\n'));

    if (validFiles.length > 0) {
      onFilesChange(validFiles);
    }

    // Reset input so same files can be uploaded again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-container ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="file-input"
          onChange={handleChange}
          accept={acceptedExtensions}
          hidden
        />
        <div className="upload-message">
          <i className="upload-icon">📎</i>
          <p>Drag and drop files here or click to select</p>
          <span className="upload-hint">
            Accepted files: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG (Max {maxFileSize}MB)
          </span>
        </div>
      </div>
      {error && (
        <div className="upload-error">
          {error.split('\n').map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
