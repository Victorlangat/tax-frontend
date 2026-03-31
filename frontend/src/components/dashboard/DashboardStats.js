import React from 'react';
import { Icon } from '../../common/Icons';
import Card from '../common/Card';
import '../../styles/pages/dashboard.css';

const DashboardStats = () => {
  const statsData = [
    {
      title: 'Total Calculations',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: 'calculate',
      color: '#4caf50'
    },
    {
      title: 'Accuracy Rate',
      value: '98.5%',
      change: '+0.5%',
      changeType: 'positive',
icon: 'target',
      color: '#2196f3'
    },
    {
      title: 'Average Tax',
      value: 'KES 623K',
      change: '+8%',
      changeType: 'negative',
icon: 'money',
      color: '#ff9800'
    },
    {
      title: 'Active Users',
      value: '84',
      change: '+4',
      changeType: 'positive',
      icon: 'people',
      color: '#9c27b0'
    }
  ];

  return (
    <div className="dashboard-stats-grid">
      {statsData.map((stat, index) => (
        <Card key={index} shadow="medium" className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.changeType}`}>
                <span className="change-arrow">
                  {stat.changeType === 'positive' ? '↑' : '↓'}
                </span>
                {stat.change}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};


  return (
    <div className="dashboard-stats-grid">
      {statsData.map((stat, index) => (
        <Card key={index} shadow="medium" className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.changeType}`}>
                <span className="change-arrow">
                  {stat.changeType === 'positive' ? '↑' : '↓'}
                </span>
                {stat.change}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;