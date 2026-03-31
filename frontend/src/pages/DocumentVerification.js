import React, { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import DocumentUpload from '../components/document/DocumentUpload';
import DocumentVerification from '../components/document/DocumentVerification';
import DiscrepancyAlert from '../components/document/DiscrepancyAlert';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import '../styles/pages/document.css';

const DocumentVerificationPage = () => {
  const [documents, setDocuments] = useState({
    invoice: null,
    billOfLading: null,
    exportCertificate: null,
    inspectionCertificate: null,
    crspSheet: null
  });
  const [activeSection, setActiveSection] = useState('upload'); // 'upload', 'verify', or 'review'
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [verificationResults, setVerificationResults] = useState({});
  const [discrepancies, setDiscrepancies] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);

  // Handle upload completion
  const handleUploadComplete = (docType, file) => {
    console.log(`Uploaded ${docType}:`, file?.name);
    
    if (docType === 'all') {
      // When all documents are uploaded
      const newUploadedDocs = { ...uploadedDocs };
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          newUploadedDocs[key] = {
            name: documents[key].name || `Uploaded_${key}.pdf`,
            uploadedAt: new Date().toISOString(),
            type: documents[key].type || 'application/pdf',
            size: documents[key].size || 1024
          };
        }
      });
      setUploadedDocs(newUploadedDocs);
      setActiveSection('verify');
    } else {
      // Single document uploaded
      const newUploadedDocs = {
        ...uploadedDocs,
        [docType]: {
          name: file?.name || `Uploaded_${docType}.pdf`,
          uploadedAt: new Date().toISOString(),
          type: file?.type || 'application/pdf',
          size: file?.size || 1024
        }
      };
      setUploadedDocs(newUploadedDocs);
      
      // Check if all required documents are uploaded
      const requiredDocs = ['invoice', 'billOfLading', 'exportCertificate', 'inspectionCertificate'];
      const allRequiredUploaded = requiredDocs.every(doc => newUploadedDocs[doc]);
      
      if (allRequiredUploaded && docType !== 'all') {
        setActiveSection('verify');
      }
    }
  };

  // Handle verification completion
  const handleVerificationComplete = (isAllVerified) => {
    if (isAllVerified) {
      setOverallStatus('success');
      
      // Generate sample discrepancies for demo
      const sampleDiscrepancies = [
        {
          id: 'DISC-001',
          description: 'Invoice amount mismatch with CRSP value',
          severity: 'critical',
          document: 'Commercial Invoice',
          field: 'Total Amount',
          expected: 'KES 3,200,000',
          found: 'KES 2,800,000',
          resolved: false
        },
        {
          id: 'DISC-002',
          description: 'Missing signature on Bill of Lading',
          severity: 'warning',
          document: 'Bill of Lading',
          field: 'Signature',
          expected: 'Required',
          found: 'Missing',
          resolved: false
        },
        {
          id: 'DISC-003',
          description: 'Export certificate date format',
          severity: 'info',
          document: 'Export Certificate',
          field: 'Issue Date',
          expected: 'DD/MM/YYYY',
          found: 'MM/DD/YYYY',
          resolved: false
        }
      ];
      setDiscrepancies(sampleDiscrepancies);
      setActiveSection('review');
    } else {
      setOverallStatus('warning');
    }
  };

  // Handle discrepancy resolution
  const handleResolveDiscrepancy = (discrepancy) => {
    if (discrepancy === 'all') {
      // Mark all as resolved
      setDiscrepancies(prev => prev.map(d => ({ ...d, resolved: true })));
    } else {
      // Mark single discrepancy as resolved
      setDiscrepancies(prev => 
        prev.map(d => d.id === discrepancy.id ? { ...d, resolved: true } : d)
      );
    }
  };

  // Handle discrepancy override
  const handleOverrideDiscrepancy = (discrepancy) => {
    if (discrepancy === 'all') {
      // Override all and proceed
      setDiscrepancies([]);
      alert('All discrepancies overridden. Proceeding to tax calculation...');
    } else {
      // Override single discrepancy
      setDiscrepancies(prev => prev.filter(d => d.id !== discrepancy.id));
    }
  };

  // Handle proceed to tax calculation
  const handleProceedToCalculation = () => {
    const unresolvedDiscrepancies = discrepancies.filter(d => !d.resolved);
    
    if (unresolvedDiscrepancies.length > 0) {
      if (window.confirm(
        `There are ${unresolvedDiscrepancies.length} unresolved discrepancies. ` +
        'Are you sure you want to proceed to tax calculation?'
      )) {
        window.location.href = '/tax-calculator';
      }
    } else {
      window.location.href = '/tax-calculator';
    }
  };

  // Handle restart process
  const handleRestartProcess = () => {
    setUploadedDocs({});
    setVerificationResults({});
    setDiscrepancies([]);
    setOverallStatus(null);
    setActiveSection('upload');
  };

  // Get uploaded document count
  const getUploadedCount = () => {
    return Object.keys(uploadedDocs).length;
  };

  // Get verified document count
  const getVerifiedCount = () => {
    return Object.values(verificationResults).filter(v => v?.verified).length;
  };

  return (
    <div className="document-verification-page">
      <Header 
        title="Document Verification"
        subtitle="Upload and verify import documents against KRA standards"
        actions={
          <div className="header-action-group">
            <Button 
              variant="outline"
              onClick={handleRestartProcess}
              disabled={activeSection === 'upload'}
            >
              Restart Process
            </Button>
            <Button 
              variant="success"
              icon="🧮"
              onClick={handleProceedToCalculation}
              disabled={activeSection !== 'review' && discrepancies.length > 0}
            >
              Proceed to Tax Calculation
            </Button>
          </div>
        }
        breadcrumbs={['Dashboard', 'Document Verification']}
      />
      
      <Sidebar />
      
      <main className="main-content">
        <div className="content-container">
          {/* Progress Steps */}
          <div className="verification-progress">
            <div className="progress-steps">
              <div className={`step ${activeSection === 'upload' ? 'active' : ''} ${getUploadedCount() > 0 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-info">
                  <div className="step-title">Upload Documents</div>
                  <div className="step-description">Upload all required import documents</div>
                </div>
              </div>
              
              <div className="step-connector"></div>
              
              <div className={`step ${activeSection === 'verify' ? 'active' : ''} ${getVerifiedCount() > 0 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-info">
                  <div className="step-title">Verify Documents</div>
                  <div className="step-description">Check against KRA standards</div>
                </div>
              </div>
              
              <div className="step-connector"></div>
              
              <div className={`step ${activeSection === 'review' ? 'active' : ''} ${discrepancies.length === 0 ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-info">
                  <div className="step-title">Review & Resolve</div>
                  <div className="step-description">Address any discrepancies</div>
                </div>
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: activeSection === 'upload' ? '33%' : 
                         activeSection === 'verify' ? '66%' : '100%' 
                }}
              ></div>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="verification-sections">
            {/* Upload Section */}
            <div className={`section ${activeSection === 'upload' ? 'active' : ''}`}>
              <DocumentUpload 
                onUploadComplete={handleUploadComplete}
              />
              
              {getUploadedCount() > 0 && (
                <div className="upload-summary-card">
                  <Card padding>
                    <div className="summary-content">
                      <div className="summary-icon">📁</div>
                      <div className="summary-info">
                        <h4>Documents Uploaded</h4>
                        <p>{getUploadedCount()} out of 5 documents uploaded</p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setActiveSection('verify')}
                      >
                        Continue to Verification
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Verification Section */}
            <div className={`section ${activeSection === 'verify' ? 'active' : ''}`}>
              <DocumentVerification 
                documents={uploadedDocs}
                onVerifyComplete={handleVerificationComplete}
              />
              
              <div className="verification-actions">
                <div className="action-buttons">
                  <Button
                    variant="secondary"
                    onClick={() => setActiveSection('upload')}
                  >
                    ← Back to Upload
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleVerificationComplete(false)}
                  >
                    Run Verification
                  </Button>
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div className={`section ${activeSection === 'review' ? 'active' : ''}`}>
              {overallStatus === 'success' && (
                <div className="success-banner">
                  <div className="success-content">
                    <div className="success-icon">✅</div>
                    <div className="success-text">
                      <h3>Verification Complete!</h3>
                      <p>All documents have been verified. {discrepancies.length} discrepancies found.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {overallStatus === 'warning' && (
                <div className="warning-banner">
                  <div className="warning-content">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-text">
                      <h3>Verification Issues Found</h3>
                      <p>Some documents failed verification. Please review the discrepancies below.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Discrepancies */}
              {discrepancies.length > 0 && (
                <div className="discrepancies-section">
                  <DiscrepancyAlert 
                    discrepancies={discrepancies.filter(d => !d.resolved)}
                    onResolve={handleResolveDiscrepancy}
                    onOverride={handleOverrideDiscrepancy}
                    severity={
                      discrepancies.some(d => d.severity === 'critical' && !d.resolved) 
                        ? 'critical' 
                        : discrepancies.some(d => d.severity === 'warning' && !d.resolved)
                        ? 'warning'
                        : 'info'
                    }
                  />
                  
                  {/* Resolved Discrepancies */}
                  {discrepancies.filter(d => d.resolved).length > 0 && (
                    <Card title="Resolved Issues" icon="✅" padding>
                      <div className="resolved-discrepancies">
                        {discrepancies.filter(d => d.resolved).map((disc) => (
                          <div key={disc.id} className="resolved-item">
                            <div className="resolved-icon">✓</div>
                            <div className="resolved-text">
                              <span className="resolved-description">{disc.description}</span>
                              <span className="resolved-document">{disc.document}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Summary */}
              <div className="review-summary">
                <Card title="Verification Summary" icon="📊" padding>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <div className="item-icon">📁</div>
                      <div className="item-info">
                        <div className="item-label">Documents Uploaded</div>
                        <div className="item-value">{getUploadedCount()}/5</div>
                      </div>
                    </div>
                    
                    <div className="summary-item">
                      <div className="item-icon">✅</div>
                      <div className="item-info">
                        <div className="item-label">Documents Verified</div>
                        <div className="item-value">{getVerifiedCount()}/{getUploadedCount()}</div>
                      </div>
                    </div>
                    
                    <div className="summary-item">
                      <div className="item-icon">⚠️</div>
                      <div className="item-info">
                        <div className="item-label">Discrepancies</div>
                        <div className="item-value">{discrepancies.filter(d => !d.resolved).length}</div>
                      </div>
                    </div>
                    
                    <div className="summary-item">
                      <div className="item-icon">📝</div>
                      <div className="item-info">
                        <div className="item-label">Status</div>
                        <div className="item-value">
                          {discrepancies.filter(d => !d.resolved).length === 0 
                            ? 'Ready for Tax Calculation' 
                            : 'Needs Review'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="help-section">
            <Card title="Document Requirements" icon="📋" padding>
              <div className="requirements-list">
                <div className="requirement-item">
                  <div className="req-icon">📄</div>
                  <div className="req-content">
                    <h4>Commercial Invoice</h4>
                    <p>Must show actual purchase price, seller and buyer details, vehicle specifications, and date of sale.</p>
                    <div className="req-status">
                      <span className="status-indicator required">Required</span>
                      <span className="format-info">PDF, JPG, PNG</span>
                    </div>
                  </div>
                </div>
                
                <div className="requirement-item">
                  <div className="req-icon">🚢</div>
                  <div className="req-content">
                    <h4>Bill of Lading</h4>
                    <p>Original shipping document showing vessel details, ports, and shipment information.</p>
                    <div className="req-status">
                      <span className="status-indicator required">Required</span>
                      <span className="format-info">PDF, JPG, PNG</span>
                    </div>
                  </div>
                </div>
                
                <div className="requirement-item">
                  <div className="req-icon">📋</div>
                  <div className="req-content">
                    <h4>Export Certificate</h4>
                    <p>Proof of deregistration from the exporting country's transport authority.</p>
                    <div className="req-status">
                      <span className="status-indicator required">Required</span>
                      <span className="format-info">PDF, JPG, PNG</span>
                    </div>
                  </div>
                </div>
                
                <div className="requirement-item">
                  <div className="req-icon">✅</div>
                  <div className="req-content">
                    <h4>Inspection Certificate</h4>
                    <p>KEBS-approved pre-shipment inspection certificate from authorized agent in Japan.</p>
                    <div className="req-status">
                      <span className="status-indicator required">Required</span>
                      <span className="format-info">PDF, JPG, PNG</span>
                    </div>
                  </div>
                </div>
                
                <div className="requirement-item">
                  <div className="req-icon">📊</div>
                  <div className="req-content">
                    <h4>CRSP Reference</h4>
                    <p>KRA Current Retail Selling Price database reference for the specific vehicle model.</p>
                    <div className="req-status">
                      <span className="status-indicator optional">Optional</span>
                      <span className="format-info">Excel, PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <Footer />
      </main>
    </div>
  );
};

export default DocumentVerificationPage;