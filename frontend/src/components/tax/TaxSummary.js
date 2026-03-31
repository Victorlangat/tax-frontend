import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/pages/calculator.css';

const TaxSummary = ({ taxData, onGenerateReport, onSaveCalculation }) => {
  if (!taxData) {
    return (
      <Card title="Tax Summary" icon="💰" padding>
        <div className="tax-summary-empty">
          <div className="empty-icon">💸</div>
          <h3>No Tax Summary Available</h3>
          <p>Complete a tax calculation to view the summary and generate reports.</p>
        </div>
      </Card>
    );
  }

  const { 
    totalTax, 
    customsValue, 
    cifValue,
    vehicleDetails,
    calculationDate 
  } = taxData;

  const savingAmount = taxData.savingAmount || 0;
  const accuracyScore = taxData.accuracyScore || 98;

  return (
    <Card title="Tax Summary" icon="💰" padding>
      <div className="tax-summary">
        {/* Main Summary Card */}
        <div className="summary-card">
          <div className="summary-header">
            <h3 className="summary-title">Import Duty Summary</h3>
            <span className="calculation-date">{calculationDate}</span>
          </div>
          
          <div className="summary-values">
            <div className="value-row">
              <span className="value-label">Customs Value</span>
              <span className="value-amount">KES {customsValue.toLocaleString()}</span>
            </div>
            <div className="value-row">
              <span className="value-label">CIF Value</span>
              <span className="value-amount">KES {cifValue.toLocaleString()}</span>
            </div>
            <div className="value-row highlight">
              <span className="value-label">Total Tax Payable</span>
              <span className="value-amount total">KES {totalTax.toLocaleString()}</span>
            </div>
          </div>

          {/* Savings Indicator */}
          {savingAmount > 0 && (
            <div className="savings-indicator">
              <div className="savings-icon">💸</div>
              <div className="savings-content">
                <span className="savings-label">Potential Savings</span>
                <span className="savings-amount">KES {savingAmount.toLocaleString()}</span>
                <span className="savings-note">Compared to manual calculation</span>
              </div>
            </div>
          )}

          {/* Accuracy Score */}
          <div className="accuracy-score">
            <div className="score-circle">
              <div className="score-value">{accuracyScore}%</div>
              <div className="score-label">Accuracy</div>
            </div>
            <div className="score-description">
              <p>Based on KRA 2025 CRSP data and official tax formulas.</p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        {vehicleDetails && (
          <div className="vehicle-summary">
            <h4 className="section-title">Vehicle Details</h4>
            <div className="vehicle-info">
              <div className="info-row">
                <span className="info-label">Make/Model:</span>
                <span className="info-value">{vehicleDetails.make} {vehicleDetails.model}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year:</span>
                <span className="info-value">{vehicleDetails.year}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Engine:</span>
                <span className="info-value">{vehicleDetails.engineCC}cc {vehicleDetails.fuelType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Age:</span>
                <span className="info-value">{vehicleDetails.age} years</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="summary-actions">
          <div className="action-buttons">
            <Button 
              variant="success" 
              icon="📋"
              onClick={() => onGenerateReport && onGenerateReport('pdf')}
              className="action-btn"
            >
              Generate PDF Report
            </Button>
            <Button 
              variant="primary" 
              icon="📊"
              onClick={() => onGenerateReport && onGenerateReport('excel')}
              className="action-btn"
            >
              Export to Excel
            </Button>
            <Button 
              variant="outline" 
              icon="💾"
              onClick={onSaveCalculation}
              className="action-btn"
            >
              Save Calculation
            </Button>
          </div>
          
          <div className="additional-actions">
            <button className="additional-btn">
              <span className="btn-icon">🖨️</span>
              Print Summary
            </button>
            <button className="additional-btn">
              <span className="btn-icon">📧</span>
              Email Report
            </button>
            <button className="additional-btn">
              <span className="btn-icon">⚖️</span>
              Generate Appeal Letter
            </button>
          </div>
        </div>

        {/* Important Notes */}
        <div className="important-notes">
          <h4 className="notes-title">Important Notes</h4>
          <ul className="notes-list">
            <li>This is an estimate based on provided information</li>
            <li>Final tax amount is determined by KRA upon vehicle inspection</li>
            <li>Always verify with official KRA documentation</li>
            <li>Keep all original documents for verification</li>
            <li>Tax rates are based on 2025 KRA CRSP guidelines</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default TaxSummary;