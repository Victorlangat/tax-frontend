import React from 'react';
import Button from '../common/Button';
import '../../styles/pages/reports.css';

const ExportButtons = ({ onExport, disabled, loading }) => {
  const exportOptions = [
    {
      format: 'pdf',
      label: 'Export as PDF',
      icon: '📄',
      description: 'Print-ready document with all details',
      variant: 'primary'
    },
    {
      format: 'excel',
      label: 'Export to Excel',
      icon: '📊',
      description: 'Spreadsheet with raw data for analysis',
      variant: 'success'
    },
    {
      format: 'csv',
      label: 'Export as CSV',
      icon: '📋',
      description: 'Comma-separated values for databases',
      variant: 'outline'
    },
    {
      format: 'print',
      label: 'Print Report',
      icon: '🖨️',
      description: 'Direct printing without saving',
      variant: 'secondary'
    }
  ];

  const handleExport = (format) => {
    if (onExport) {
      onExport(format);
    } else {
      // Default behavior
      console.log(`Exporting as ${format}`);
    }
  };

  return (
    <div className="export-buttons">
      <div className="export-header">
        <h3>Export Report</h3>
        <p>Choose your preferred format for downloading or sharing the report.</p>
      </div>

      <div className="export-grid">
        {exportOptions.map((option) => (
          <div key={option.format} className="export-card">
            <div className="export-icon">{option.icon}</div>
            <div className="export-info">
              <h4 className="export-title">{option.label}</h4>
              <p className="export-description">{option.description}</p>
            </div>
            <Button
              variant={option.variant}
              icon={option.icon}
              onClick={() => handleExport(option.format)}
              disabled={disabled}
              loading={loading}
              className="export-btn"
            >
              Export
            </Button>
          </div>
        ))}
      </div>

      <div className="export-notes">
        <h4>Export Notes:</h4>
        <ul>
          <li>PDF exports include all charts and formatting</li>
          <li>Excel exports include raw calculation data</li>
          <li>CSV files are compatible with most data analysis tools</li>
          <li>Print option opens print dialog for immediate printing</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportButtons;