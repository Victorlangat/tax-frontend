import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import '../styles/pages/reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportConfig, setReportConfig] = useState({
    type: 'tax',
    format: 'pdf',
    includeDetails: true,
    includeDiscrepancies: true,
    includeRecommendations: true
  });

  // Sample reports data
  useEffect(() => {
    const sampleReports = [
      {
        id: 'REP-2025-001',
        title: 'Suzuki Swift Tax Calculation',
        vehicle: 'Suzuki Swift 1.2L (2018)',
        date: '2025-01-15',
        type: 'tax',
        format: 'pdf',
        totalTax: 'KES 623,503',
        status: 'generated',
        size: '2.4 MB'
      },
      {
        id: 'REP-2025-002',
        title: 'Monthly Import Summary',
        vehicle: 'Multiple Vehicles',
        date: '2025-01-10',
        type: 'summary',
        format: 'excel',
        totalTax: 'KES 4,820,000',
        status: 'generated',
        size: '1.8 MB'
      },
      {
        id: 'REP-2025-003',
        title: 'Dispute Resolution Report',
        vehicle: 'Toyota Vitz Hybrid',
        date: '2025-01-08',
        type: 'dispute',
        format: 'pdf',
        totalTax: 'KES 580,000',
        status: 'submitted',
        size: '3.2 MB'
      },
      {
        id: 'REP-2025-004',
        title: 'CRSP Compliance Report',
        vehicle: 'Mazda Demio 1.5L',
        date: '2025-01-05',
        type: 'compliance',
        format: 'pdf',
        totalTax: 'KES 467,350',
        status: 'generated',
        size: '2.1 MB'
      },
      {
        id: 'REP-2025-005',
        title: 'Annual Tax Analysis',
        vehicle: 'All Models',
        date: '2025-01-01',
        type: 'analysis',
        format: 'excel',
        totalTax: 'KES 24,500,000',
        status: 'archived',
        size: '5.6 MB'
      }
    ];
    
    setLoading(true);
    setTimeout(() => {
      setReports(sampleReports);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.type === filter;
  });

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    // In real app, this would open the report
    alert(`Opening report: ${report.title}`);
  };

  const handleDownloadReport = (report) => {
    // Simulate download
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Downloading: ${report.title}`);
    }, 1000);
  };

  const handleDeleteReport = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  const handleGenerateReport = () => {
    setLoading(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport = {
        id: `REP-${Date.now().toString().slice(-6)}`,
        title: `${reportConfig.type.charAt(0).toUpperCase() + reportConfig.type.slice(1)} Report`,
        vehicle: 'Custom Selection',
        date: new Date().toISOString().split('T')[0],
        type: reportConfig.type,
        format: reportConfig.format,
        totalTax: 'KES 0',
        status: 'generated',
        size: `${Math.random() * 5 + 1} MB`
      };
      
      setReports(prev => [newReport, ...prev]);
      setLoading(false);
      setShowGenerateModal(false);
      alert(`Report generated successfully: ${newReport.title}`);
    }, 2000);
  };

  const handleShareReport = (report) => {
    const email = prompt('Enter email address to share with:');
    if (email) {
      alert(`Sharing report ${report.id} with ${email}`);
    }
  };

  const handlePrintReport = (report) => {
    window.print();
    alert(`Printing: ${report.title}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      generated: { label: 'Generated', class: 'status-generated' },
      submitted: { label: 'Submitted', class: 'status-submitted' },
      archived: { label: 'Archived', class: 'status-archived' },
      pending: { label: 'Pending', class: 'status-pending' }
    };
    
    const config = statusConfig[status];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tax': return '🧮';
      case 'summary': return '📊';
      case 'dispute': return '⚖️';
      case 'compliance': return '✅';
      case 'analysis': return '📈';
      default: return '📋';
    }
  };

  const getFormatIcon = (format) => {
    return format === 'pdf' ? '📄' : '📊';
  };

  return (
    <div className="reports-page">
      <Header 
        title="Reports"
        subtitle="Generate, view, and manage tax calculation reports"
        actions={
          <Button 
            variant="success"
            icon="📋"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate New Report
          </Button>
        }
        breadcrumbs={['Dashboard', 'Reports']}
        searchEnabled={true}
        onSearch={(query) => console.log('Searching:', query)}
      />
      
      <Sidebar />
      
      <main className="main-content">
        <div className="content-container">
          {/* Quick Stats */}
          <div className="reports-stats">
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Total Reports</h3>
                  <div className="stat-value">{reports.length}</div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>PDF Reports</h3>
                  <div className="stat-value">
                    {reports.filter(r => r.format === 'pdf').length}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Excel Reports</h3>
                  <div className="stat-value">
                    {reports.filter(r => r.format === 'excel').length}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">💾</div>
                <div className="stat-info">
                  <h3>Total Size</h3>
                  <div className="stat-value">
                    {reports.reduce((total, r) => total + parseFloat(r.size), 0).toFixed(1)} MB
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="reports-filters">
            <Card title="Filter Reports" icon="🔍" padding>
              <div className="filter-content">
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('all')}
                  >
                    All Reports
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'tax' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('tax')}
                  >
                    Tax Calculations
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'summary' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('summary')}
                  >
                    Summaries
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'dispute' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('dispute')}
                  >
                    Dispute Reports
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'analysis' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('analysis')}
                  >
                    Analysis
                  </button>
                </div>
                
                <div className="date-filters">
                  <div className="date-input">
                    <Input
                      label="From Date"
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="date-input">
                    <Input
                      label="To Date"
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <Button variant="outline" icon="🔍">
                    Apply Filter
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <div className="reports-list">
            <Card title="Generated Reports" icon="📋" padding>
              {loading ? (
                <div className="loading-reports">
                  <div className="loading-spinner"></div>
                  <p>Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="no-reports">
                  <div className="no-reports-icon">📋</div>
                  <h3>No Reports Found</h3>
                  <p>Generate your first report or adjust your filters.</p>
                  <Button 
                    variant="primary"
                    onClick={() => setShowGenerateModal(true)}
                  >
                    Generate Report
                  </Button>
                </div>
              ) : (
                <div className="reports-table">
                  <div className="table-header">
                    <div className="table-cell">Report</div>
                    <div className="table-cell">Vehicle</div>
                    <div className="table-cell">Date</div>
                    <div className="table-cell">Type</div>
                    <div className="table-cell">Format</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  
                  {filteredReports.map((report) => (
                    <div key={report.id} className="table-row">
                      <div className="table-cell cell-report">
                        <div className="report-cell">
                          <span className="report-icon">{getTypeIcon(report.type)}</span>
                          <div className="report-info">
                            <span className="report-title">{report.title}</span>
                            <span className="report-id">{report.id}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="table-cell cell-vehicle">
                        <span className="cell-value">{report.vehicle}</span>
                      </div>
                      
                      <div className="table-cell cell-date">
                        <span className="cell-value">{report.date}</span>
                      </div>
                      
                      <div className="table-cell cell-type">
                        <span className="type-badge">
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </span>
                      </div>
                      
                      <div className="table-cell cell-format">
                        <span className="format-badge">
                          <span className="format-icon">{getFormatIcon(report.format)}</span>
                          {report.format.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="table-cell cell-status">
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <div className="table-cell cell-actions">
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewReport(report)}
                            title="View Report"
                          >
                            👁️
                          </button>
                          <button 
                            className="action-btn download"
                            onClick={() => handleDownloadReport(report)}
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button 
                            className="action-btn print"
                            onClick={() => handlePrintReport(report)}
                            title="Print"
                          >
                            🖨️
                          </button>
                          <button 
                            className="action-btn share"
                            onClick={() => handleShareReport(report)}
                            title="Share"
                          >
                            📤
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteReport(report.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Report Templates */}
          <div className="report-templates">
            <Card title="Report Templates" icon="📑" padding>
              <div className="templates-grid">
                <div className="template-card">
                  <div className="template-icon">🧮</div>
                  <div className="template-content">
                    <h4>Standard Tax Report</h4>
                    <p>Complete tax calculation with breakdown</p>
                    <Button variant="outline" size="small">
                      Use Template
                    </Button>
                  </div>
                </div>
                
                <div className="template-card">
                  <div className="template-icon">⚖️</div>
                  <div className="template-content">
                    <h4>Dispute Resolution</h4>
                    <p>Appeal letter and evidence compilation</p>
                    <Button variant="outline" size="small">
                      Use Template
                    </Button>
                  </div>
                </div>
                
                <div className="template-card">
                  <div className="template-icon">📊</div>
                  <div className="template-content">
                    <h4>Monthly Summary</h4>
                    <p>Import statistics and tax totals</p>
                    <Button variant="outline" size="small">
                      Use Template
                    </Button>
                  </div>
                </div>
                
                <div className="template-card">
                  <div className="template-icon">📈</div>
                  <div className="template-content">
                    <h4>Annual Analysis</h4>
                    <p>Year-over-year comparison and trends</p>
                    <Button variant="outline" size="small">
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <Footer />
      </main>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate New Report"
        size="medium"
      >
        <div className="generate-report-modal">
          <div className="modal-section">
            <h4>Report Configuration</h4>
            
            <div className="config-options">
              <div className="option-group">
                <label className="option-label">Report Type</label>
                <div className="option-buttons">
                  <button 
                    className={`option-btn ${reportConfig.type === 'tax' ? 'active' : ''}`}
                    onClick={() => setReportConfig(prev => ({ ...prev, type: 'tax' }))}
                  >
                    🧮 Tax Calculation
                  </button>
                  <button 
                    className={`option-btn ${reportConfig.type === 'summary' ? 'active' : ''}`}
                    onClick={() => setReportConfig(prev => ({ ...prev, type: 'summary' }))}
                  >
                    📊 Summary Report
                  </button>
                  <button 
                    className={`option-btn ${reportConfig.type === 'dispute' ? 'active' : ''}`}
                    onClick={() => setReportConfig(prev => ({ ...prev, type: 'dispute' }))}
                  >
                    ⚖️ Dispute Report
                  </button>
                </div>
              </div>
              
              <div className="option-group">
                <label className="option-label">Output Format</label>
                <div className="option-buttons">
                  <button 
                    className={`option-btn ${reportConfig.format === 'pdf' ? 'active' : ''}`}
                    onClick={() => setReportConfig(prev => ({ ...prev, format: 'pdf' }))}
                  >
                    📄 PDF Document
                  </button>
                  <button 
                    className={`option-btn ${reportConfig.format === 'excel' ? 'active' : ''}`}
                    onClick={() => setReportConfig(prev => ({ ...prev, format: 'excel' }))}
                  >
                    📊 Excel Spreadsheet
                  </button>
                </div>
              </div>
              
              <div className="option-group">
                <label className="option-label">Include Sections</label>
                <div className="checkbox-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeDetails}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeDetails: e.target.checked 
                      }))}
                    />
                    <span>Detailed Tax Breakdown</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeDiscrepancies}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeDiscrepancies: e.target.checked 
                      }))}
                    />
                    <span>Document Discrepancies</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeRecommendations}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeRecommendations: e.target.checked 
                      }))}
                    />
                    <span>KRA Recommendations</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="success"
              onClick={handleGenerateReport}
              loading={loading}
              icon="📋"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;