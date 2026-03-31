import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import '../styles/pages/settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'Leonard Kariuki',
    email: 'leonard@smarttax.com',
    phone: '+254712345678',
    role: 'Importer',
    company: 'Thynk Unlimited',
    address: 'Nairobi, Kenya',
    krapin: 'P123456789X',
    notifications: {
      email: true,
      sms: false,
      push: true,
      updates: true
    }
  });
  const [systemSettings, setSystemSettings] = useState({
    taxYear: 2025,
    defaultCurrency: 'KES',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365,
    apiEnabled: false
  });
  const [taxRates, setTaxRates] = useState({
    importDuty: 35,
    exciseDuty: 20,
    vat: 16,
    idf: 2.5,
    rdl: 2,
    depreciationYear1: 10,
    depreciationYear2: 30,
    depreciationYear3: 50,
    depreciationYear4: 65
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changesSaved, setChangesSaved] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('smarttax_user');
    if (storedUser) {
      setUserData(prev => ({ ...prev, ...JSON.parse(storedUser) }));
    }
  }, []);

  const handleUserDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setUserData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSystemSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTaxRatesChange = (e) => {
    const { name, value } = e.target;
    setTaxRates(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSaveChanges = () => {
    setLoading(true);
    
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      setChangesSaved(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setChangesSaved(false);
      }, 3000);
    }, 1500);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    setLoading(true);
    
    // Simulate password change
    setTimeout(() => {
      setLoading(false);
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    }, 2000);
  };

  const handleExportData = () => {
    setLoading(true);
    
    // Simulate data export
    setTimeout(() => {
      setLoading(false);
      alert('Data exported successfully!');
    }, 1500);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      setSystemSettings({
        taxYear: 2025,
        defaultCurrency: 'KES',
        timezone: 'Africa/Nairobi',
        dateFormat: 'DD/MM/YYYY',
        autoBackup: true,
        backupFrequency: 'daily',
        dataRetention: 365,
        apiEnabled: false
      });
      alert('Settings reset to default!');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'tax', label: 'Tax Rates', icon: '💰' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <div className="profile-header">
              <div className="profile-avatar">
                <span className="avatar-text">LK</span>
              </div>
              <div className="profile-info">
                <h3>{userData.name}</h3>
                <p>{userData.role} • {userData.company}</p>
                <p className="profile-email">{userData.email}</p>
              </div>
            </div>

            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-grid">
                <div className="form-col">
                  <Input
                    label="Full Name"
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleUserDataChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleUserDataChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleUserDataChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="KRA PIN"
                    type="text"
                    name="krapin"
                    value={userData.krapin}
                    onChange={handleUserDataChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Company Information</h4>
              <div className="form-grid">
                <div className="form-col">
                  <Input
                    label="Company Name"
                    type="text"
                    name="company"
                    value={userData.company}
                    onChange={handleUserDataChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Address"
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleUserDataChange}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="tab-content">
            <div className="form-section">
              <h4>General Settings</h4>
              <div className="form-grid">
                <div className="form-col">
                  <Input
                    label="Tax Year"
                    type="number"
                    name="taxYear"
                    value={systemSettings.taxYear}
                    onChange={handleSystemSettingsChange}
                  />
                </div>
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Default Currency</label>
                    <select
                      name="defaultCurrency"
                      value={systemSettings.defaultCurrency}
                      onChange={handleSystemSettingsChange}
                      className="smarttax-select"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select
                      name="timezone"
                      value={systemSettings.timezone}
                      onChange={handleSystemSettingsChange}
                      className="smarttax-select"
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Date Format</label>
                    <select
                      name="dateFormat"
                      value={systemSettings.dateFormat}
                      onChange={handleSystemSettingsChange}
                      className="smarttax-select"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Data Management</h4>
              <div className="settings-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="autoBackup"
                    checked={systemSettings.autoBackup}
                    onChange={handleSystemSettingsChange}
                  />
                  <span>Enable Automatic Backups</span>
                </label>
                
                <div className="form-group">
                  <label className="form-label">Backup Frequency</label>
                  <select
                    name="backupFrequency"
                    value={systemSettings.backupFrequency}
                    onChange={handleSystemSettingsChange}
                    className="smarttax-select"
                    disabled={!systemSettings.autoBackup}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Data Retention (Days)</label>
                  <Input
                    type="number"
                    name="dataRetention"
                    value={systemSettings.dataRetention}
                    onChange={handleSystemSettingsChange}
                  />
                </div>
                
                <div className="settings-actions">
                  <Button variant="outline" onClick={handleExportData} loading={loading}>
                    Export All Data
                  </Button>
                  <Button variant="secondary" onClick={handleResetSettings}>
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>API Settings</h4>
              <div className="settings-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="apiEnabled"
                    checked={systemSettings.apiEnabled}
                    onChange={handleSystemSettingsChange}
                  />
                  <span>Enable API Access</span>
                </label>
                
                {systemSettings.apiEnabled && (
                  <div className="api-info">
                    <div className="api-key">
                      <label>API Key:</label>
                      <code>sk_live_1234567890abcdef</code>
                      <Button size="small" variant="outline">
                        Regenerate
                      </Button>
                    </div>
                    <div className="api-docs">
                      <p>View API documentation for integration details.</p>
                      <Button variant="secondary" size="small">
                        API Documentation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="tab-content">
            <div className="form-section">
              <h4>Tax Rates (%)</h4>
              <div className="form-grid">
                <div className="form-col">
                  <Input
                    label="Import Duty"
                    type="number"
                    step="0.1"
                    name="importDuty"
                    value={taxRates.importDuty}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Excise Duty"
                    type="number"
                    step="0.1"
                    name="exciseDuty"
                    value={taxRates.exciseDuty}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="VAT"
                    type="number"
                    step="0.1"
                    name="vat"
                    value={taxRates.vat}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="IDF"
                    type="number"
                    step="0.1"
                    name="idf"
                    value={taxRates.idf}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="RDL"
                    type="number"
                    step="0.1"
                    name="rdl"
                    value={taxRates.rdl}
                    onChange={handleTaxRatesChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Depreciation Schedule (%)</h4>
              <div className="form-grid">
                <div className="form-col">
                  <Input
                    label="Year 1"
                    type="number"
                    step="0.1"
                    name="depreciationYear1"
                    value={taxRates.depreciationYear1}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Year 2-3"
                    type="number"
                    step="0.1"
                    name="depreciationYear2"
                    value={taxRates.depreciationYear2}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Year 4-6"
                    type="number"
                    step="0.1"
                    name="depreciationYear3"
                    value={taxRates.depreciationYear3}
                    onChange={handleTaxRatesChange}
                  />
                </div>
                <div className="form-col">
                  <Input
                    label="Year 7-8"
                    type="number"
                    step="0.1"
                    name="depreciationYear4"
                    value={taxRates.depreciationYear4}
                    onChange={handleTaxRatesChange}
                  />
                </div>
              </div>
            </div>

            <div className="settings-note">
              <div className="note-icon">⚠️</div>
              <div className="note-content">
                <p>
                  <strong>Important:</strong> These tax rates are based on KRA 2025 guidelines. 
                  Changing these rates may affect tax calculation accuracy and compliance.
                </p>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="tab-content">
            <div className="form-section">
              <h4>Password & Security</h4>
              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <h5>Password</h5>
                    <p>Last changed: 2 weeks ago</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h5>Two-Factor Authentication</h5>
                    <p>Add an extra layer of security</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h5>Session Management</h5>
                    <p>Manage active sessions and devices</p>
                  </div>
                  <Button variant="outline">
                    View Sessions
                  </Button>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Login History</h4>
              <div className="login-history">
                <div className="history-item">
                  <div className="history-info">
                    <span className="history-device">Chrome on Windows</span>
                    <span className="history-location">Nairobi, Kenya</span>
                  </div>
                  <div className="history-time">Today, 14:30</div>
                </div>
                <div className="history-item">
                  <div className="history-info">
                    <span className="history-device">Mobile Safari</span>
                    <span className="history-location">Nairobi, Kenya</span>
                  </div>
                  <div className="history-time">Yesterday, 10:15</div>
                </div>
                <div className="history-item">
                  <div className="history-info">
                    <span className="history-device">Firefox on Mac</span>
                    <span className="history-location">Mombasa, Kenya</span>
                  </div>
                  <div className="history-time">3 days ago, 09:45</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="tab-content">
            <div className="form-section">
              <h4>Notification Preferences</h4>
              <div className="notification-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notifications.email"
                    checked={userData.notifications.email}
                    onChange={handleUserDataChange}
                  />
                  <div className="checkbox-content">
                    <span className="checkbox-title">Email Notifications</span>
                    <span className="checkbox-description">Receive updates via email</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notifications.sms"
                    checked={userData.notifications.sms}
                    onChange={handleUserDataChange}
                  />
                  <div className="checkbox-content">
                    <span className="checkbox-title">SMS Notifications</span>
                    <span className="checkbox-description">Receive important alerts via SMS</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notifications.push"
                    checked={userData.notifications.push}
                    onChange={handleUserDataChange}
                  />
                  <div className="checkbox-content">
                    <span className="checkbox-title">Push Notifications</span>
                    <span className="checkbox-description">Receive in-app notifications</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notifications.updates"
                    checked={userData.notifications.updates}
                    onChange={handleUserDataChange}
                  />
                  <div className="checkbox-content">
                    <span className="checkbox-title">System Updates</span>
                    <span className="checkbox-description">Receive system maintenance alerts</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4>Notification Types</h4>
              <div className="notification-types">
                <div className="notification-type">
                  <div className="type-info">
                    <span className="type-title">Tax Calculations</span>
                    <span className="type-description">When tax calculations are completed</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-type">
                  <div className="type-info">
                    <span className="type-title">Document Verification</span>
                    <span className="type-description">When documents are verified or rejected</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-type">
                  <div className="type-info">
                    <span className="type-title">KRA Updates</span>
                    <span className="type-description">Important updates from KRA</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-type">
                  <div className="type-info">
                    <span className="type-title">Report Generation</span>
                    <span className="type-description">When reports are generated</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <Header 
        title="Settings"
        subtitle="Manage your account preferences and system configuration"
        breadcrumbs={['Dashboard', 'Settings']}
      />
      
      <Sidebar />
      
      <main className="main-content">
        <div className="content-container">
          {/* Settings Tabs */}
          <div className="settings-container">
            <div className="settings-sidebar">
              <div className="sidebar-header">
                <h3>Settings</h3>
              </div>
              <div className="sidebar-tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {changesSaved && (
                <div className="save-success">
                  <span className="success-icon">✅</span>
                  <span>Changes saved successfully!</span>
                </div>
              )}
            </div>

            <div className="settings-content">
              <Card className="settings-card" padding>
                <div className="card-header">
                  <h2>
                    {tabs.find(t => t.id === activeTab)?.icon}
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p>Configure your preferences for this section</p>
                </div>

                {renderTabContent()}

                <div className="settings-actions">
                  <Button 
                    variant="primary"
                    onClick={handleSaveChanges}
                    loading={loading}
                    icon="💾"
                  >
                    Save Changes
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
        
        <Footer />
      </main>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="small"
      >
        <div className="password-modal">
          <div className="modal-content">
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ 
                ...prev, 
                currentPassword: e.target.value 
              }))}
              required
            />
            
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ 
                ...prev, 
                newPassword: e.target.value 
              }))}
              required
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ 
                ...prev, 
                confirmPassword: e.target.value 
              }))}
              required
            />
            
            <div className="password-rules">
              <p>Password must contain:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
          </div>
          
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handlePasswordChange}
              loading={loading}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;