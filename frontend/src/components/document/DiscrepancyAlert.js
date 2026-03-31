import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import '../../styles/pages/document.css';

const DiscrepancyAlert = ({ discrepancies, onResolve, onOverride, severity = 'warning' }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);

  if (!discrepancies || discrepancies.length === 0) {
    return null;
  }

  const getSeverityConfig = (sev) => {
    switch (sev) {
      case 'critical':
        return {
          icon: '🚨',
          title: 'Critical Discrepancy',
          color: '#f44336',
          bgColor: '#ffebee'
        };
      case 'warning':
        return {
          icon: '⚠️',
          title: 'Verification Warning',
          color: '#ff9800',
          bgColor: '#fff3e0'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          title: 'Information Notice',
          color: '#2196f3',
          bgColor: '#e3f2fd'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Discrepancy Detected',
          color: '#ff9800',
          bgColor: '#fff3e0'
        };
    }
  };

  const config = getSeverityConfig(severity);

  const handleResolve = (discrepancy) => {
    setSelectedDiscrepancy(discrepancy);
    setShowModal(true);
  };

  const handleModalResolve = () => {
    onResolve && onResolve(selectedDiscrepancy);
    setShowModal(false);
    setSelectedDiscrepancy(null);
  };

  const handleModalOverride = () => {
    onOverride && onOverride(selectedDiscrepancy);
    setShowModal(false);
    setSelectedDiscrepancy(null);
  };

  return (
    <>
      <Card 
        className="discrepancy-alert"
        style={{ borderLeft: `4px solid ${config.color}`, backgroundColor: config.bgColor }}
      >
        <div className="alert-header">
          <div className="alert-title">
            <span className="alert-icon">{config.icon}</span>
            <h3>{config.title}</h3>
          </div>
          <div className="alert-count">
            {discrepancies.length} issue{discrepancies.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="alert-content">
          <p>The following discrepancies were found during document verification:</p>
          
          <div className="discrepancies-list">
            {discrepancies.map((discrepancy, index) => (
              <div key={index} className="discrepancy-item">
                <div className="discrepancy-main">
                  <span className="discrepancy-number">{index + 1}.</span>
                  <span className="discrepancy-text">{discrepancy.description}</span>
                  <span className={`discrepancy-severity severity-${discrepancy.severity}`}>
                    {discrepancy.severity}
                  </span>
                </div>
                
                <div className="discrepancy-details">
                  <div className="detail-row">
                    <span className="detail-label">Document:</span>
                    <span className="detail-value">{discrepancy.document}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Field:</span>
                    <span className="detail-value">{discrepancy.field}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expected:</span>
                    <span className="detail-value expected">{discrepancy.expected}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Found:</span>
                    <span className="detail-value found">{discrepancy.found}</span>
                  </div>
                </div>

                <div className="discrepancy-actions">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleResolve(discrepancy)}
                  >
                    Resolve Issue
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => onOverride && onOverride(discrepancy)}
                  >
                    Override
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="alert-footer">
          <div className="footer-actions">
            <Button
              variant="primary"
              onClick={() => onResolve && onResolve('all')}
            >
              Resolve All Issues
            </Button>
            <Button
              variant="success"
              onClick={() => onOverride && onOverride('all')}
            >
              Override All & Continue
            </Button>
          </div>
          
          <div className="footer-note">
            <p>
              <strong>Note:</strong> Resolving discrepancies ensures accurate tax calculation. 
              Overriding may lead to disputes with KRA.
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Resolve Discrepancy"
        size="medium"
      >
        {selectedDiscrepancy && (
          <div className="resolution-modal">
            <div className="modal-header">
              <h3>{selectedDiscrepancy.description}</h3>
              <p className="modal-subtitle">
                Document: {selectedDiscrepancy.document} • Field: {selectedDiscrepancy.field}
              </p>
            </div>

            <div className="comparison-section">
              <div className="comparison-item expected">
                <h4>Expected Value</h4>
                <div className="comparison-value">{selectedDiscrepancy.expected}</div>
                <p className="comparison-source">Based on KRA CRSP data</p>
              </div>
              
              <div className="comparison-arrow">→</div>
              
              <div className="comparison-item found">
                <h4>Found in Document</h4>
                <div className="comparison-value">{selectedDiscrepancy.found}</div>
                <p className="comparison-source">From uploaded document</p>
              </div>
            </div>

            <div className="resolution-options">
              <div className="option-card">
                <h4>Option 1: Update Document</h4>
                <p>Upload a corrected version of the document</p>
                <Button
                  variant="primary"
                  icon="📤"
                  onClick={handleModalResolve}
                >
                  Upload Corrected Document
                </Button>
              </div>

              <div className="option-card">
                <h4>Option 2: Provide Explanation</h4>
                <p>Add notes explaining the discrepancy for KRA review</p>
                <textarea
                  className="explanation-textarea"
                  placeholder="Explain why this discrepancy exists..."
                  rows={3}
                />
                <Button
                  variant="outline"
                  icon="💬"
                  onClick={handleModalResolve}
                >
                  Save Explanation
                </Button>
              </div>

              <div className="option-card">
                <h4>Option 3: Override & Continue</h4>
                <p>Accept the discrepancy and proceed with calculation</p>
                <Button
                  variant="secondary"
                  icon="⚡"
                  onClick={handleModalOverride}
                >
                  Override Discrepancy
                </Button>
                <p className="warning-text">
                  ⚠️ This may result in tax calculation errors or KRA disputes
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DiscrepancyAlert;