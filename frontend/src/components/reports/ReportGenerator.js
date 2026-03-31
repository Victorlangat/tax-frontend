import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import '../../styles/pages/reports.css';

const ReportGenerator = ({ vehicleData, taxData, onGenerate }) => {
  const [reportType, setReportType] = useState('detailed');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDiscrepancies, setIncludeDiscrepancies] = useState(true);
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { id: 'summary', label: 'Summary Report', description: 'Brief overview of tax calculation' },
    { id: 'detailed', label: 'Detailed Report', description: 'Complete breakdown with all calculations' },
    { id: 'dispute', label: 'Dispute Report', description: 'Formatted for KRA appeal or dispute' },
    { id: 'audit', label: 'Audit Report', description: 'For internal audit and record keeping' }
  ];

  const handleGenerate = () => {
    setGenerating(true);
    
    // Prepare report configuration
    const reportConfig = {
      type: reportType,
      includeCharts,
      includeDiscrepancies,
      timestamp: new Date().toISOString()
    };

    // Simulate report generation
    setTimeout(() => {
      onGenerate && onGenerate(reportConfig);
      setGenerating(false);
    }, 2000);
  };

  return (
    <Card title="Generate Report" icon="📋" padding>
      <div className="report-generator">
        <div className="generator-intro">
          <p>Generate comprehensive reports for your vehicle import tax calculation. Choose the report type and customize the content.</p>
        </div>

        <div className="report-configuration">
          <div className="config-section">
            <h4 className="section-title">Report Type</h4>
            <div className="report-type-grid">
              {reportTypes.map(type => (
                <div 
                  key={type.id}
                  className={`type-card ${reportType === type.id ? 'selected' : ''}`}
                  onClick={() => setReportType(type.id)}
                >
                  <div className="type-icon">📄</div>
                  <div className="type-info">
                    <h5 className="type-label">{type.label}</h5>
                    <p className="type-description">{type.description}</p>
                  </div>
                  <div className="type-radio">
                    <div className="radio-circle">
                      {reportType === type.id && <div className="radio-inner"></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h4 className="section-title">Report Options</h4>
            <div className="options-grid">
              <div className="option-item">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="option-checkbox"
                  />
                  <span className="option-text">Include Charts & Graphs</span>
                </label>
                <p className="option-description">Visual representation of tax breakdown</p>
              </div>

              <div className="option-item">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={includeDiscrepancies}
                    onChange={(e) => setIncludeDiscrepancies(e.target.checked)}
                    className="option-checkbox"
                  />
                  <span className="option-text">Include Discrepancy Analysis</span>
                </label>
                <p className="option-description">Detailed discrepancy report and resolution</p>
              </div>

              <div className="option-item">
                <label className="option-label">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="option-checkbox"
                    disabled
                  />
                  <span className="option-text">Include KRA Compliance Statement</span>
                </label>
                <p className="option-description">Required for official submissions</p>
              </div>

              <div className="option-item">
                <label className="option-label">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="option-checkbox"
                  />
                  <span className="option-text">Include Watermark</span>
                </label>
                <p className="option-description">"SmartTax Generated Report" watermark</p>
              </div>
            </div>
          </div>

          <div className="config-section">
            <h4 className="section-title">Report Details</h4>
            <div className="details-form">
              <div className="form-row">
                <div className="form-col">
                  <Input
                    label="Report Title"
                    type="text"
                    defaultValue={`Tax Calculation Report - ${vehicleData?.make || 'Vehicle'}`}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Reference Number"
                    type="text"
                    defaultValue={`REF-${Date.now().toString().slice(-6)}`}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes (Optional)</label>
                <textarea
                  className="report-notes"
                  placeholder="Add any additional information or comments for the report..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="generator-actions">
          <div className="action-buttons">
            <Button
              variant="secondary"
              icon="🔄"
              disabled={generating}
            >
              Preview Report
            </Button>
            <Button
              variant="success"
              icon="📥"
              loading={generating}
              onClick={handleGenerate}
              className="generate-btn"
            >
              Generate & Download
            </Button>
          </div>

          <div className="formats-info">
            <h4>Available Formats:</h4>
            <div className="formats-list">
              <span className="format-item">📄 PDF (Print-ready)</span>
              <span className="format-item">📊 Excel (Data analysis)</span>
              <span className="format-item">📋 CSV (Raw data)</span>
              <span className="format-item">🖨️ Print (Direct printing)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReportGenerator;