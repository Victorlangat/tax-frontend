import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import '../styles/pages/audit.css';

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [userFilter, setUserFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Sample audit logs
  useEffect(() => {
    const sampleLogs = [
      {
        id: 'AUDIT-001',
        timestamp: '2025-01-15 14:30:25',
        user: 'Leonard Kariuki',
        action: 'Tax Calculation',
        entity: 'Suzuki Swift',
        entityId: 'CALC-2025-001',
        changes: 'Calculated import duties',
        ipAddress: '192.168.1.100',
        status: 'success'
      },
      {
        id: 'AUDIT-002',
        timestamp: '2025-01-15 11:15:42',
        user: 'Admin User',
        action: 'CRSP Update',
        entity: 'CRSP Database',
        entityId: 'CRSP-2025',
        changes: 'Uploaded new CRSP database',
        ipAddress: '192.168.1.50',
        status: 'success'
      },
      {
        id: 'AUDIT-003',
        timestamp: '2025-01-14 16:45:18',
        user: 'Test Importer',
        action: 'Document Upload',
        entity: 'Commercial Invoice',
        entityId: 'DOC-001',
        changes: 'Uploaded invoice for Toyota Vitz',
        ipAddress: '41.90.120.45',
        status: 'success'
      },
      {
        id: 'AUDIT-004',
        timestamp: '2025-01-14 09:20:33',
        user: 'Leonard Kariuki',
        action: 'Report Generation',
        entity: 'Tax Report',
        entityId: 'REP-001',
        changes: 'Generated PDF tax report',
        ipAddress: '192.168.1.100',
        status: 'success'
      },
      {
        id: 'AUDIT-005',
        timestamp: '2025-01-13 13:55:10',
        user: 'Admin User',
        action: 'User Management',
        entity: 'User Account',
        entityId: 'USER-003',
        changes: 'Created new user account',
        ipAddress: '192.168.1.50',
        status: 'success'
      },
      {
        id: 'AUDIT-006',
        timestamp: '2025-01-12 17:30:45',
        user: 'Test Importer',
        action: 'Failed Login',
        entity: 'Authentication',
        entityId: 'AUTH-001',
        changes: 'Invalid password attempt',
        ipAddress: '41.90.120.45',
        status: 'failed'
      },
      {
        id: 'AUDIT-007',
        timestamp: '2025-01-11 10:05:22',
        user: 'System',
        action: 'System Backup',
        entity: 'Database',
        entityId: 'BACKUP-001',
        changes: 'Automatic nightly backup',
        ipAddress: '127.0.0.1',
        status: 'success'
      },
      {
        id: 'AUDIT-008',
        timestamp: '2025-01-10 08:15:59',
        user: 'Leonard Kariuki',
        action: 'Settings Update',
        entity: 'System Settings',
        entityId: 'SETTINGS',
        changes: 'Updated notification preferences',
        ipAddress: '192.168.1.100',
        status: 'success'
      }
    ];
    
    setLoading(true);
    setTimeout(() => {
      setAuditLogs(sampleLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    // Apply type filter
    if (filter !== 'all' && filter !== log.status) {
      return false;
    }
    
    // Apply user filter
    if (userFilter && !log.user.toLowerCase().includes(userFilter.toLowerCase())) {
      return false;
    }
    
    // Apply date filter
    if (dateRange.startDate && dateRange.endDate) {
      const logDate = new Date(log.timestamp.split(' ')[0]);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      if (logDate < startDate || logDate > endDate) {
        return false;
      }
    }
    
    return true;
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

  const handleUserFilterChange = (e) => {
    setUserFilter(e.target.value);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleExportLogs = () => {
    setLoading(true);
    
    // Simulate export
    setTimeout(() => {
      setLoading(false);
      alert('Audit logs exported successfully!');
    }, 1500);
  };

  const handleClearFilters = () => {
    setFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setUserFilter('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { label: 'Success', class: 'status-success' },
      failed: { label: 'Failed', class: 'status-failed' },
      warning: { label: 'Warning', class: 'status-warning' }
    };
    
    const config = statusConfig[status];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'Tax Calculation': return '🧮';
      case 'CRSP Update': return '📊';
      case 'Document Upload': return '📄';
      case 'Report Generation': return '📋';
      case 'User Management': return '👥';
      case 'Failed Login': return '🔒';
      case 'System Backup': return '💾';
      case 'Settings Update': return '⚙️';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    const [date, time] = timestamp.split(' ');
    return (
      <div className="timestamp">
        <span className="date">{date}</span>
        <span className="time">{time}</span>
      </div>
    );
  };

  return (
    <div className="audit-log-page">
      <Header 
        title="Audit Log"
        subtitle="Track system activities and user actions for security and compliance"
        actions={
          <Button 
            variant="success"
            icon="📤"
            onClick={handleExportLogs}
            loading={loading}
          >
            Export Logs
          </Button>
        }
        breadcrumbs={['Dashboard', 'Admin', 'Audit Log']}
      />
      
      <Sidebar />
      
      <main className="main-content">
        <div className="content-container">
          {/* Audit Stats */}
          <div className="audit-stats">
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>Total Logs</h3>
                  <div className="stat-value">{auditLogs.length}</div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Successful</h3>
                  <div className="stat-value">
                    {auditLogs.filter(l => l.status === 'success').length}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">❌</div>
                <div className="stat-info">
                  <h3>Failed</h3>
                  <div className="stat-value">
                    {auditLogs.filter(l => l.status === 'failed').length}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Unique Users</h3>
                  <div className="stat-value">
                    {[...new Set(auditLogs.map(l => l.user))].length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="audit-filters">
            <Card title="Filter Logs" icon="🔍" padding>
              <div className="filter-content">
                <div className="filter-row">
                  <div className="filter-group">
                    <label className="filter-label">Action Type</label>
                    <div className="filter-buttons">
                      <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                      >
                        All Actions
                      </button>
                      <button 
                        className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('success')}
                      >
                        Successful
                      </button>
                      <button 
                        className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('failed')}
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">User Filter</label>
                    <Input
                      type="text"
                      placeholder="Search by user name..."
                      value={userFilter}
                      onChange={handleUserFilterChange}
                      icon="👤"
                    />
                  </div>
                </div>
                
                <div className="filter-row">
                  <div className="filter-group">
                    <label className="filter-label">Date Range</label>
                    <div className="date-inputs">
                      <Input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        placeholder="Start Date"
                      />
                      <span className="date-separator">to</span>
                      <Input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                  
                  <div className="filter-actions">
                    <Button 
                      variant="outline"
                      onClick={handleClearFilters}
                      disabled={loading}
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => console.log('Applying filters...')}
                      disabled={loading}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Audit Table */}
          <div className="audit-table-section">
            <Card 
              title="Activity Log"
              icon="📋"
              padding
              footer={
                <div className="table-footer">
                  <div className="footer-info">
                    Showing {filteredLogs.length} of {auditLogs.length} audit logs
                  </div>
                  <div className="footer-actions">
                    <Button variant="outline" size="small">
                      Refresh Logs
                    </Button>
                  </div>
                </div>
              }
            >
              {loading ? (
                <div className="loading-logs">
                  <div className="loading-spinner"></div>
                  <p>Loading audit logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="no-logs">
                  <div className="no-logs-icon">📝</div>
                  <h3>No Audit Logs Found</h3>
                  <p>Try adjusting your filters or check back later.</p>
                  <Button 
                    variant="primary"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="audit-table">
                  <div className="table-header">
                    <div className="table-cell">Timestamp</div>
                    <div className="table-cell">User</div>
                    <div className="table-cell">Action</div>
                    <div className="table-cell">Entity</div>
                    <div className="table-cell">Changes</div>
                    <div className="table-cell">IP Address</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="table-row">
                      <div className="table-cell cell-timestamp">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      
                      <div className="table-cell cell-user">
                        <div className="user-cell">
                          <span className="user-icon">👤</span>
                          <span className="user-name">{log.user}</span>
                        </div>
                      </div>
                      
                      <div className="table-cell cell-action">
                        <div className="action-cell">
                          <span className="action-icon">{getActionIcon(log.action)}</span>
                          <span className="action-name">{log.action}</span>
                        </div>
                      </div>
                      
                      <div className="table-cell cell-entity">
                        <div className="entity-cell">
                          <span className="entity-name">{log.entity}</span>
                          <span className="entity-id">{log.entityId}</span>
                        </div>
                      </div>
                      
                      <div className="table-cell cell-changes">
                        <span className="changes-text">{log.changes}</span>
                      </div>
                      
                      <div className="table-cell cell-ip">
                        <code className="ip-address">{log.ipAddress}</code>
                      </div>
                      
                      <div className="table-cell cell-status">
                        {getStatusBadge(log.status)}
                      </div>
                      
                      <div className="table-cell cell-actions">
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewDetails(log)}
                            title="View Details"
                          >
                            👁️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Audit Information */}
          <div className="audit-info">
            <Card title="Audit Log Information" icon="ℹ️" padding>
              <div className="info-content">
                <div className="info-section">
                  <h4>What is being logged?</h4>
                  <ul>
                    <li>User login attempts and authentication events</li>
                    <li>CRSP database changes and updates</li>
                    <li>Tax calculation activities</li>
                    <li>Document uploads and verification</li>
                    <li>Report generation and downloads</li>
                    <li>System configuration changes</li>
                    <li>User management activities</li>
                  </ul>
                </div>
                
                <div className="info-section">
                  <h4>Retention Policy</h4>
                  <p>
                    Audit logs are retained for 365 days for compliance purposes. 
                    Older logs are automatically archived and can be restored upon request.
                  </p>
                </div>
                
                <div className="info-section">
                  <h4>Security Compliance</h4>
                  <p>
                    The audit log system helps maintain compliance with KRA regulations 
                    and data protection requirements by tracking all system activities.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <Footer />
      </main>

      {/* Log Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Audit Log Details"
        size="medium"
      >
        {selectedLog && (
          <div className="log-details-modal">
            <div className="modal-content">
              <div className="log-header">
                <div className="log-id">
                  <span className="label">Log ID:</span>
                  <span className="value">{selectedLog.id}</span>
                </div>
                <div className="log-status">
                  {getStatusBadge(selectedLog.status)}
                </div>
              </div>
              
              <div className="log-details">
                <div className="detail-row">
                  <span className="detail-label">Timestamp:</span>
                  <span className="detail-value">{selectedLog.timestamp}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User:</span>
                  <span className="detail-value">{selectedLog.user}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Action:</span>
                  <span className="detail-value">{selectedLog.action}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Entity:</span>
                  <span className="detail-value">{selectedLog.entity} ({selectedLog.entityId})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value">{selectedLog.ipAddress}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Changes:</span>
                  <span className="detail-value changes">{selectedLog.changes}</span>
                </div>
              </div>
              
              <div className="log-metadata">
                <h4>Additional Information</h4>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Session ID:</span>
                    <span className="metadata-value">SESS-{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">User Agent:</span>
                    <span className="metadata-value">Mozilla/5.0 (Windows NT 10.0; Win64; x64)</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Browser:</span>
                    <span className="metadata-value">Chrome 120.0.0.0</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Location:</span>
                    <span className="metadata-value">Nairobi, Kenya</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <Button 
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button 
                variant="primary"
                onClick={() => {
                  alert('Exporting log details...');
                  setShowDetailsModal(false);
                }}
              >
                Export This Log
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLog;