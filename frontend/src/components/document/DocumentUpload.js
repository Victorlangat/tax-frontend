import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/pages/document.css';

const DocumentUpload = ({ onUploadComplete }) => {
  const [documents, setDocuments] = useState({
    invoice: { file: null, uploaded: false, name: '', progress: 0 },
    billOfLading: { file: null, uploaded: false, name: '', progress: 0 },
    exportCertificate: { file: null, uploaded: false, name: '', progress: 0 },
    inspectionCertificate: { file: null, uploaded: false, name: '', progress: 0 },
    crspSheet: { file: null, uploaded: false, name: '', progress: 0 }
  });

  const [uploading, setUploading] = useState(null); // Track which doc is uploading
  const [uploadErrors, setUploadErrors] = useState({});
  const [dragOver, setDragOver] = useState(null);

  const handleFileChange = (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      setUploadErrors(prev => ({
        ...prev,
        [docType]: 'File type not supported. Please upload PDF, JPG, PNG, or Excel files.'
      }));
      return;
    }
    
    if (file.size > maxSize) {
      setUploadErrors(prev => ({
        ...prev,
        [docType]: 'File size too large. Maximum size is 10MB.'
      }));
      return;
    }

    // Clear any previous errors
    setUploadErrors(prev => ({ ...prev, [docType]: null }));

    setDocuments(prev => ({
      ...prev,
      [docType]: {
        file,
        uploaded: false,
        name: file.name,
        size: file.size,
        progress: 0
      }
    }));
  };

  const handleDragOver = (docType, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(docType);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (docType, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const inputEvent = {
        target: {
          files: [file]
        }
      };
      handleFileChange(docType, inputEvent);
    }
  };

  const handleUpload = async (docType) => {
    const doc = documents[docType];
    if (!doc.file) return;

    setUploading(docType);
    setUploadErrors(prev => ({ ...prev, [docType]: null }));

    // Simulate upload with progress
    const totalSteps = 10;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          progress: (i / totalSteps) * 100
        }
      }));
    }

    // Simulate success/error
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    if (isSuccess) {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          uploaded: true
        }
      }));
      
      onUploadComplete && onUploadComplete(docType, doc.file);
    } else {
      setUploadErrors(prev => ({
        ...prev,
        [docType]: 'Upload failed. Please try again or check your connection.'
      }));
    }
    
    setUploading(null);
  };

  const handleUploadAll = async () => {
    const docsToUpload = Object.entries(documents)
      .filter(([key, doc]) => doc.file && !doc.uploaded);
    
    if (docsToUpload.length === 0) return;

    setUploading('all');
    
    for (const [docType] of docsToUpload) {
      await handleUpload(docType);
    }
    
    setUploading(null);
  };

  const handleRemove = (docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: {
        file: null,
        uploaded: false,
        name: '',
        progress: 0
      }
    }));
    setUploadErrors(prev => ({ ...prev, [docType]: null }));
  };

  const handleReplace = (docType, e) => {
    handleRemove(docType);
    setTimeout(() => {
      handleFileChange(docType, e);
    }, 100);
  };

  const handleRetry = (docType) => {
    setUploadErrors(prev => ({ ...prev, [docType]: null }));
    handleUpload(docType);
  };

  const docConfig = [
    {
      key: 'invoice',
      label: 'Commercial Invoice',
      description: 'Original invoice from seller showing purchase price',
      icon: '📄',
      required: true,
      acceptedFormats: '.pdf, .jpg, .png'
    },
    {
      key: 'billOfLading',
      label: 'Bill of Lading',
      description: 'Shipping document from carrier',
      icon: '🚢',
      required: true,
      acceptedFormats: '.pdf, .jpg, .png'
    },
    {
      key: 'exportCertificate',
      label: 'Export Certificate',
      description: 'Proof of deregistration from country of origin',
      icon: '📋',
      required: true,
      acceptedFormats: '.pdf, .jpg, .png'
    },
    {
      key: 'inspectionCertificate',
      label: 'Inspection Certificate',
      description: 'KEBS-approved pre-shipment inspection',
      icon: '✅',
      required: true,
      acceptedFormats: '.pdf, .jpg, .png'
    },
    {
      key: 'crspSheet',
      label: 'CRSP Reference Sheet',
      description: 'KRA CRSP data for verification (Excel)',
      icon: '📊',
      required: false,
      acceptedFormats: '.xlsx, .xls'
    }
  ];

  const allRequiredUploaded = docConfig
    .filter(doc => doc.required)
    .every(doc => documents[doc.key].uploaded);

  const hasFiles = Object.values(documents).some(doc => doc.file);
  const uploadedCount = Object.values(documents).filter(d => d.uploaded).length;
  const totalCount = docConfig.filter(d => d.required).length;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card title="Document Upload" icon="📤" padding>
      <div className="document-upload">
        <div className="upload-intro">
          <p>
            Upload all required documents for vehicle import verification. 
            Each document will be verified against KRA CRSP data. 
            <strong> Maximum file size: 10MB per file.</strong>
          </p>
        </div>

        <div className="documents-grid">
          {docConfig.map((doc) => {
            const docState = documents[doc.key];
            const isUploading = uploading === doc.key || uploading === 'all';
            const error = uploadErrors[doc.key];
            const isDraggedOver = dragOver === doc.key;

            return (
              <div key={doc.key} className="document-card" data-required={doc.required}>
                <div className="document-header">
                  <div className="document-icon">{doc.icon}</div>
                  <div className="document-info">
                    <h4 className="document-title">
                      {doc.label}
                      {doc.required && <span className="required-indicator">*</span>}
                    </h4>
                    <p className="document-description">{doc.description}</p>
                    <div className="document-metadata">
                      <span className="metadata-item">
                        <span className="metadata-label">Format:</span>
                        <span className="metadata-value">{doc.acceptedFormats}</span>
                      </span>
                      {docState.file && (
                        <span className="metadata-item">
                          <span className="metadata-label">Size:</span>
                          <span className="metadata-value">{formatFileSize(docState.file.size)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="document-upload-area">
                  {!docState.file ? (
                    <label 
                      className={`upload-placeholder ${isDraggedOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(doc.key, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(doc.key, e)}
                    >
                      <input
                        type="file"
                        accept={doc.acceptedFormats}
                        onChange={(e) => handleFileChange(doc.key, e)}
                        className="file-input"
                        disabled={isUploading}
                      />
                      <div className="upload-content">
                        <span className="upload-icon">📎</span>
                        <span className="upload-text">
                          {isDraggedOver ? 'Drop file here' : 'Click or drag to upload'}
                        </span>
                        <span className="upload-hint">{doc.acceptedFormats}</span>
                      </div>
                    </label>
                  ) : (
                    <div className="file-preview">
                      <div className="file-info">
                        <span className="file-icon">
                          {docState.file.type.includes('pdf') ? '📄' : 
                           docState.file.type.includes('image') ? '🖼️' : 
                           docState.file.type.includes('excel') ? '📊' : '📋'}
                        </span>
                        <div className="file-details">
                          <span className="file-name" title={docState.name}>
                            {docState.name.length > 30 
                              ? `${docState.name.substring(0, 30)}...` 
                              : docState.name}
                          </span>
                          <span className="file-size">{formatFileSize(docState.file.size)}</span>
                        </div>
                      </div>
                      
                      {error && (
                        <div className="upload-error">
                          <span className="error-icon">❌</span>
                          <span className="error-text">{error}</span>
                          <button 
                            className="error-retry"
                            onClick={() => handleRetry(doc.key)}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      
                      {docState.uploaded ? (
                        <div className="upload-success">
                          <span className="success-icon">✅</span>
                          <span className="success-text">Verified</span>
                        </div>
                      ) : (
                        <div className="file-actions">
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => handleRemove(doc.key)}
                            disabled={isUploading}
                            className="action-remove"
                          >
                            Remove
                          </Button>
                          <label className="replace-label">
                            <input
                              type="file"
                              accept={doc.acceptedFormats}
                              onChange={(e) => handleReplace(doc.key, e)}
                              className="file-input"
                              disabled={isUploading}
                            />
                            <Button
                              size="small"
                              variant="secondary"
                              disabled={isUploading}
                            >
                              Replace
                            </Button>
                          </label>
                          <Button
                            size="small"
                            variant="success"
                            onClick={() => handleUpload(doc.key)}
                            loading={isUploading}
                            disabled={isUploading || docState.uploaded}
                            className="action-upload"
                          >
                            {docState.uploaded ? 'Uploaded' : 'Upload'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(isUploading && docState.progress > 0 && !docState.uploaded) && (
                    <div className="upload-progress">
                      <div className="progress-info">
                        <span className="progress-text">Uploading... {Math.round(docState.progress)}%</span>
                        <span className="progress-cancel" onClick={() => setUploading(null)}>
                          Cancel
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${docState.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon-small">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="upload-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Required Documents:</span>
              <span className="stat-value">{uploadedCount}/{totalCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Files:</span>
              <span className="stat-value">
                {Object.values(documents).filter(d => d.file).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status:</span>
              <span className={`stat-status ${allRequiredUploaded ? 'complete' : 'incomplete'}`}>
                {allRequiredUploaded ? 'Ready for verification' : 'Upload required documents'}
              </span>
            </div>
          </div>
        </div>

        <div className="bulk-actions">
          <div className="action-buttons">
            <Button
              variant="secondary"
              onClick={() => {
                // Clear all files
                const cleared = {};
                Object.keys(documents).forEach(key => {
                  cleared[key] = { file: null, uploaded: false, name: '', progress: 0 };
                });
                setDocuments(cleared);
                setUploadErrors({});
              }}
              disabled={uploading || !hasFiles}
              className="clear-all-btn"
            >
              Clear All
            </Button>
            
            <Button
              variant="success"
              icon="📤"
              loading={uploading === 'all'}
              disabled={uploading || !hasFiles}
              onClick={handleUploadAll}
              className="upload-all-btn"
            >
              Upload All Documents
            </Button>
            
            {allRequiredUploaded && (
              <Button
                variant="primary"
                icon="🔍"
                onClick={() => onUploadComplete && onUploadComplete('all')}
                className="verify-all-btn"
              >
                Verify All Documents
              </Button>
            )}
          </div>
          
          <div className="upload-tips">
            <h4>📝 Upload Tips:</h4>
            <ul>
              <li>Ensure documents are clear and legible</li>
              <li>Check that all information matches your vehicle details</li>
              <li>Upload the highest quality scans available</li>
              <li>Verify file sizes are under 10MB each</li>
              <li>Keep original documents for KRA inspection</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentUpload;