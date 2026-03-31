import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/pages/document.css';

const DocumentVerification = ({ documents = {}, onVerifyComplete }) => {
  const [verificationStatus, setVerificationStatus] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [overallResult, setOverallResult] = useState(null);

  const verifyDocument = (docType) => {
    setVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      const isVerified = Math.random() > 0.2; // 80% success rate for demo
      const discrepancies = isVerified ? [] : [
        "Date format doesn't match KRA standards",
        "Signature missing on page 3",
        "Amount differs from CRSP reference"
      ];
      
      setVerificationStatus(prev => ({
        ...prev,
        [docType]: {
          verified: isVerified,
          discrepancies,
          timestamp: new Date().toISOString()
        }
      }));
      
      setVerifying(false);
      
      // Check if all documents are verified
      const allDocs = Object.keys(documents || {});
      const allVerified = allDocs.every(doc => 
        verificationStatus[doc]?.verified === true
      );
      
      if (allVerified && allDocs.length > 0) {
        setOverallResult('success');
        onVerifyComplete && onVerifyComplete(true);
      }
    }, 1500);
  };

  const verifyAll = () => {
    // Guard against null/undefined documents
    if (!documents) {
      console.error('No documents provided for verification');
      return;
    }
    
    const docKeys = Object.keys(documents);
    if (docKeys.length === 0) {
      alert('No documents to verify. Please upload documents first.');
      return;
    }
    
    setVerifying(true);
    setOverallResult(null);
    
    // Simulate bulk verification
    setTimeout(() => {
      const results = {};
      let allVerified = true;
      
      docKeys.forEach(docType => {
        const doc = documents[docType];
        if (!doc) return;
        
        const isVerified = Math.random() > 0.2;
        if (!isVerified) allVerified = false;
        
        const discrepancies = isVerified ? [] : [
          "Document format requires review",
          "Information mismatch detected"
        ];
        
        results[docType] = {
          verified: isVerified,
          discrepancies,
          timestamp: new Date().toISOString()
        };
      });
      
      setVerificationStatus(results);
      setOverallResult(allVerified ? 'success' : 'warning');
      setVerifying(false);
      onVerifyComplete && onVerifyComplete(allVerified);
    }, 3000);
  };

  const getStatusIcon = (status) => {
    if (!status) return '⏳';
    return status.verified ? '✅' : '❌';
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.verified ? 'Verified' : 'Failed';
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-pending';
    return status.verified ? 'status-verified' : 'status-failed';
  };

  const docTypes = [
    { key: 'invoice', label: 'Commercial Invoice', icon: '📄' },
    { key: 'billOfLading', label: 'Bill of Lading', icon: '🚢' },
    { key: 'exportCertificate', label: 'Export Certificate', icon: '📋' },
    { key: 'inspectionCertificate', label: 'Inspection Certificate', icon: '✅' },
    { key: 'crspSheet', label: 'CRSP Reference', icon: '📊' }
  ];

  const hasDocuments = documents && Object.keys(documents).length > 0;
  const docKeys = documents ? Object.keys(documents) : [];

  return (
    <Card title="Document Verification" icon="🔍" padding>
      <div className="document-verification">
        <div className="verification-header">
          <div className="header-info">
            <h3>KRA Document Compliance Check</h3>
            <p>Verify uploaded documents against KRA standards and CRSP data</p>
          </div>
          
          <div className="header-actions">
            <Button
              variant="primary"
              icon="🔍"
              loading={verifying}
              onClick={verifyAll}
              disabled={verifying || !hasDocuments}
            >
              Verify All Documents
            </Button>
          </div>
        </div>

        {overallResult && (
          <div className={`overall-result result-${overallResult}`}>
            <div className="result-icon">
              {overallResult === 'success' ? '✅' : '⚠️'}
            </div>
            <div className="result-content">
              <h4>
                {overallResult === 'success' 
                  ? 'All Documents Verified Successfully' 
                  : 'Verification Issues Detected'}
              </h4>
              <p>
                {overallResult === 'success'
                  ? 'All documents comply with KRA standards and are ready for tax calculation.'
                  : 'Some documents require review before proceeding with tax calculation.'}
              </p>
            </div>
          </div>
        )}

        <div className="verification-table">
          <div className="table-header">
            <div className="table-cell">Document</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Discrepancies</div>
            <div className="table-cell">Actions</div>
          </div>

          {docTypes.map((doc) => {
            const docExists = documents && documents[doc.key];
            const status = verificationStatus[doc.key];
            
            return (
              <div key={doc.key} className="table-row">
                <div className="table-cell cell-document">
                  <div className="document-cell">
                    <span className="doc-icon">{doc.icon}</span>
                    <div className="doc-info">
                      <span className="doc-name">{doc.label}</span>
                      {docExists && (
                        <span className="doc-filename">{documents[doc.key].name}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="table-cell cell-status">
                  <div className={`status-badge ${getStatusClass(status)}`}>
                    <span className="status-icon">{getStatusIcon(status)}</span>
                    <span className="status-text">{getStatusText(status)}</span>
                  </div>
                </div>
                
                <div className="table-cell cell-discrepancies">
                  {status?.discrepancies?.length > 0 ? (
                    <div className="discrepancies-list">
                      {status.discrepancies.map((item, idx) => (
                        <span key={idx} className="discrepancy-item">{item}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-discrepancies">
                      {status ? 'No discrepancies found' : 'Not verified yet'}
                    </span>
                  )}
                </div>
                
                <div className="table-cell cell-actions">
                  {docExists ? (
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => verifyDocument(doc.key)}
                      loading={verifying}
                      disabled={verifying}
                      className="verify-btn"
                    >
                      {status ? 'Re-verify' : 'Verify'}
                    </Button>
                  ) : (
                    <span className="no-document">Document not uploaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="verification-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">
                {Object.values(verificationStatus).filter(v => v?.verified).length}
              </span>
              <span className="stat-label">Verified</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {Object.values(verificationStatus).filter(v => v && !v.verified).length}
              </span>
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {docTypes.length - Object.keys(verificationStatus).length}
              </span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          
          <div className="verification-notes">
            <h4>Verification Notes:</h4>
            <ul>
              <li>All documents must be in PDF, JPG, or Excel format</li>
              <li>Documents must be clear and legible</li>
              <li>Dates and amounts must match across all documents</li>
              <li>Signatures and stamps must be visible</li>
              <li>CRSP reference must be from official KRA database</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentVerification;