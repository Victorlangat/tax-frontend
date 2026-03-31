import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';
import '../../styles/pages/dashboard.css';

const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Vehicle Lookup',
      description: 'Find CRSP data for any vehicle model',
      icon: '🔍',
      color: '#4caf50',
      action: () => navigate('/vehicle-lookup')
    },
    {
      title: 'Tax Calculator',
      description: 'Calculate comprehensive import duties',
      icon: '🧮',
      color: '#2196f3',
      action: () => navigate('/tax-calculator')
    },
    {
      title: 'Document Verification',
      description: 'Verify invoice and shipping documents',
      icon: '📄',
      color: '#ff9800',
      action: () => navigate('/document-verification')
    },
    {
      title: 'Generate Report',
      description: 'Create PDF/CSV reports for authorities',
      icon: '📋',
      color: '#9c27b0',
      action: () => navigate('/reports')
    },
    {
      title: 'CRSP Upload',
      description: 'Upload latest CRSP data (Admin only)',
      icon: '⚙️',
      color: '#f44336',
      action: () => navigate('/admin-crsp'),
      admin: true
    },
    {
      title: 'System Settings',
      description: 'Configure tax rates and preferences',
      icon: '⚙️',
      color: '#607d8b',
      action: () => navigate('/settings')
    }
  ];

  return (
    <Card title="Quick Actions" icon="⚡" padding>
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <div 
            key={index} 
            className="quick-action-card"
            onClick={action.action}
            style={{ borderLeftColor: action.color }}
          >
            <div className="action-icon" style={{ backgroundColor: action.color }}>
              {action.icon}
            </div>
            <div className="action-content">
              <h4 className="action-title">{action.title}</h4>
              <p className="action-description">{action.description}</p>
            </div>
            {action.admin && (
              <div className="action-badge">Admin</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;