import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/pages/vehicle.css';

const CRSPMatchResult = ({ crspData, matchPercentage }) => {
  if (!crspData) {
    return null;
  }

  const depreciationRate = crspData.age <= 1 ? '10%' :
                         crspData.age <= 3 ? '30%' :
                         crspData.age <= 6 ? '50%' : '65%';

  return (
    <Card title="CRSP Match Result" icon="📊" padding>
      <div className="crsp-result">
        <div className="match-header">
          <div className="match-percentage-display">
            <div className="percentage-circle">
              <svg width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" strokeWidth="8"/>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={matchPercentage >= 90 ? '#4caf50' : matchPercentage >= 80 ? '#ff9800' : '#f44336'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${matchPercentage * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="percentage-text">{matchPercentage}%</div>
            </div>
            <div className="match-label">
              <span className={`match-status ${matchPercentage >= 90 ? 'high' : matchPercentage >= 80 ? 'medium' : 'low'}`}>
                {matchPercentage >= 90 ? 'Excellent Match' : 
                 matchPercentage >= 80 ? 'Good Match' : 'Partial Match'}
              </span>
            </div>
          </div>
        </div>

        <div className="crsp-details">
          <div className="crsp-detail-row">
            <div className="detail-label">CRSP Reference</div>
            <div className="detail-value">CRSP-{crspData.id}</div>
          </div>
          <div className="crsp-detail-row">
            <div className="detail-label">Current Retail Selling Price</div>
            <div className="detail-value">KES {crspData.crspValue.toLocaleString()}</div>
          </div>
          <div className="crsp-detail-row">
            <div className="detail-label">Vehicle Age</div>
            <div className="detail-value">{crspData.age} years</div>
          </div>
          <div className="crsp-detail-row">
            <div className="detail-label">Depreciation Rate</div>
            <div className="detail-value">{depreciationRate}</div>
          </div>
          <div className="crsp-detail-row">
            <div className="detail-label">Customs Value</div>
            <div className="detail-value highlight">KES {crspData.customsValue.toLocaleString()}</div>
          </div>
          <div className="crsp-detail-row">
            <div className="detail-label">Last Updated</div>
            <div className="detail-value">{crspData.lastUpdated}</div>
          </div>
        </div>

        <div className="crsp-actions">
          <Button variant="success" icon="🧮">
            Calculate Taxes
          </Button>
          <Button variant="outline" icon="📋">
            Generate Valuation Report
          </Button>
          <Button variant="secondary" icon="📄">
            Download CRSP Sheet
          </Button>
        </div>

        {matchPercentage < 80 && (
          <div className="crsp-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <strong>Partial Match Detected</strong>
              <p>This vehicle doesn't have an exact match in the CRSP database. Consider:</p>
              <ul>
                <li>Checking for alternative trim levels</li>
                <li>Verifying vehicle specifications</li>
                <li>Using the manual valuation option</li>
                <li>Consulting with KRA for clarification</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CRSPMatchResult;