// src/pages/Settings.js - SIMPLIFIED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Settings as SettingsIcon, User, Bell, Shield, DollarSign } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const savedUser = localStorage.getItem('smarttax_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error:', e);
      }
    }
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'tax', label: 'Tax Rates', icon: <DollarSign size={18} /> }
  ];

  return (
    <>
    
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>Settings</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage your account preferences</p>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Sidebar Tabs */}
          <div style={{ width: '280px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: activeTab === tab.id ? '#4f46e5' : '#4b5563',
                  fontWeight: activeTab === tab.id ? '600' : '500'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ margin: '0 0 24px' }}>Profile Information</h3>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#4b5563' }}>Email</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f9fafb' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#4b5563' }}>Name</label>
                  <input type="text" placeholder="Your name" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                </div>
                <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ margin: '0 0 24px' }}>Notification Preferences</h3>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Email Notifications</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>SMS Alerts</span>
                  <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Report Updates</span>
                  <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 style={{ margin: '0 0 24px' }}>Security Settings</h3>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#4b5563' }}>Current Password</label>
                  <input type="password" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#4b5563' }}>New Password</label>
                  <input type="password" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                </div>
                <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  Update Password
                </button>
              </div>
            )}

            {activeTab === 'tax' && (
              <div>
                <h3 style={{ margin: '0 0 24px' }}>Tax Rate Configuration</h3>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Import Duty</span>
                  <span style={{ fontWeight: '600' }}>35%</span>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Excise Duty (Base)</span>
                  <span style={{ fontWeight: '600' }}>20%</span>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>VAT</span>
                  <span style={{ fontWeight: '600' }}>16%</span>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>IDF</span>
                  <span style={{ fontWeight: '600' }}>2.5%</span>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>RDL</span>
                  <span style={{ fontWeight: '600' }}>2%</span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '20px' }}>Tax rates are based on KRA 2025 guidelines</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;