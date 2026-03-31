import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  Car, 
  Clock, 
  FileText, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Trophy, 
  Receipt, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import './../styles/pages/dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    calculations: 0,
    vehicles: 0,
    taxPaid: 0,
    accuracy: '98.5%',
    savings: 0,
    monthlyTrend: '+12%'
  });

  const [recentCalculations, setRecentCalculations] = useState([]);
  const [lookupHistory, setLookupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [realData, setRealData] = useState({
    vehicleMakes: [],
    taxByMonth: [],
    topVehicles: [],
    taxBreakdown: [],
    monthlyTotals: []
  });

  const [kraAlerts, setKraAlerts] = useState([
    {
      id: 1,
      type: 'deadline',
      priority: 'critical',
      title: 'Monthly Tax Filing',
      description: 'Deadline for January 2024 tax filing: 20th February 2024',
      effectiveDate: '2024-02-20',
      source: 'KRA Auto-Notice',
      timestamp: 'Active',
      read: false,
      isReal: true
    },
    {
      id: 2,
      type: 'system',
      priority: 'medium',
      title: 'Data Verification Required',
      description: 'Verify your vehicle details in the system for accurate tax calculations',
      effectiveDate: new Date().toISOString().split('T')[0],
      source: 'System Alert',
      timestamp: 'Today',
      read: false,
      isReal: true
    }
  ]);

  const calculateRealStatistics = (calculations) => {
    if (calculations.length === 0) return;

    const makesCount = {};
    calculations.forEach(calc => {
      const make = calc.vehicle?.make || 'Unknown';
      makesCount[make] = (makesCount[make] || 0) + 1;
    });

    const vehicleMakes = Object.entries(makesCount)
      .map(([make, count]) => ({
        make,
        count,
        percentage: Math.round((count / calculations.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const monthlyTax = {};
    calculations.forEach(calc => {
      const date = new Date(calc.timestamp || Date.now());
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyTax[monthYear]) {
        monthlyTax[monthYear] = { total: 0, count: 0 };
      }
      monthlyTax[monthYear].total += calc.totalTax || 0;
      monthlyTax[monthYear].count++;
    });

    const taxByMonth = Object.entries(monthlyTax)
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
        average: Math.round(data.total / data.count)
      }))
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month.substring(0, 3)) - months.indexOf(b.month.substring(0, 3));
      })
      .slice(-6);

    const vehicleModels = {};
    calculations.forEach(calc => {
      const key = `${calc.vehicle?.make || ''} ${calc.vehicle?.model || ''}`.trim();
      if (key) {
        vehicleModels[key] = (vehicleModels[key] || 0) + 1;
      }
    });

    const topVehicles = Object.entries(vehicleModels)
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const taxBreakdown = { duty: 0, vat: 0, excise: 0, other: 0 };
    calculations.forEach(calc => {
      taxBreakdown.duty += calc.taxBreakdown?.importDuty || 0;
      taxBreakdown.vat += calc.taxBreakdown?.vat || 0;
      taxBreakdown.excise += calc.taxBreakdown?.exciseDuty || 0;
      taxBreakdown.other += calc.taxBreakdown?.otherCharges || 0;
    });

    const monthlyTotals = Object.entries(monthlyTax)
      .slice(-3)
      .map(([month, data]) => ({ month, total: data.total }));

    setRealData({
      vehicleMakes,
      taxByMonth,
      topVehicles,
      taxBreakdown: Object.entries(taxBreakdown)
        .filter(([_, value]) => value > 0)
        .map(([type, value]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          value,
          percentage: Math.round((value / stats.taxPaid) * 100) || 0
        })),
      monthlyTotals
    });
  };

  const loadDashboardData = useCallback(() => {
    try {
      const savedCalculations = JSON.parse(localStorage.getItem('smarttax_calculations') || '[]');
      const lookupData = JSON.parse(localStorage.getItem('smarttax_lookups') || '[]');
      
      const totalTax = savedCalculations.reduce((sum, c) => sum + (c.totalTax || 0), 0);
      const uniqueVehicles = new Set(
        savedCalculations.map(c => `${c.vehicle?.make || ''}-${c.vehicle?.model || ''}-${c.vehicle?.year || ''}`)
      ).size;
      const timeSaved = savedCalculations.length * 30;

      const thisMonth = new Date().getMonth();
      const lastMonthCalculations = savedCalculations.filter(calc => {
        const calcDate = new Date(calc.timestamp || Date.now());
        return calcDate.getMonth() === (thisMonth - 1 + 12) % 12;
      });
      const lastMonthCount = lastMonthCalculations.length;
      const thisMonthCount = savedCalculations.filter(calc => {
        const calcDate = new Date(calc.timestamp || Date.now());
        return calcDate.getMonth() === thisMonth;
      }).length;
      const monthlyTrend = lastMonthCount > 0 
        ? `${thisMonthCount > lastMonthCount ? '+' : ''}${Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)}%`
        : '+0%';

      setStats({
        calculations: savedCalculations.length,
        vehicles: uniqueVehicles,
        taxPaid: totalTax,
        accuracy: '98.5%',
        savings: timeSaved,
        monthlyTrend
      });

      const recentCalcs = savedCalculations
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 5)
        .map(calc => ({
          ...calc,
          calculationDate: calc.calculationDate || new Date().toLocaleDateString(),
          referenceId: calc.referenceId || `STX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          timestamp: calc.timestamp || new Date().toISOString()
        }));

      const lookups = lookupData
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 10)
        .map(lookup => ({
          ...lookup,
          timestamp: lookup.timestamp || new Date().toISOString(),
          vehicle: lookup.vehicle || 'Unknown Vehicle',
          status: lookup.success ? 'success' : 'failed'
        }));

      setRecentCalculations(recentCalcs);
      setLookupHistory(lookups);
      calculateRealStatistics(savedCalculations);

      const today = new Date();
      const nextDeadline = new Date(today.getFullYear(), today.getMonth() + 1, 20);
      setKraAlerts(prev => [
        {
          ...prev[0],
          effectiveDate: nextDeadline.toISOString().split('T')[0],
          description: `Deadline for ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} tax filing: ${nextDeadline.getDate()}th ${today.toLocaleDateString('en-US', { month: 'long' })} ${nextDeadline.getFullYear()}`
        },
        ...prev.slice(1)
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadDashboardData();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const markAlertAsRead = (id) => {
    setKraAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, read: true } : alert));
  };

  const markAllAlertsAsRead = () => {
    setKraAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'tax_update': return <DollarSign size={16} />;
      case 'system_update': return <Settings size={16} />;
      case 'deadline': return <Clock size={16} />;
      case 'rate_update': return <TrendingUp size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const exportToCSV = () => {
    const data = recentCalculations.map(calc => ({
      'Vehicle': `${calc.vehicle?.make || ''} ${calc.vehicle?.model || ''}`,
      'Year': calc.vehicle?.year || '',
      'CIF Value': calc.cifValue || 0,
      'Total Tax': calc.totalTax || 0,
      'Date': calc.calculationDate || '',
      'Reference ID': calc.referenceId || ''
    }));

    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smarttax-calculations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderVehicleMakes = () => {
    if (realData.vehicleMakes.length === 0) {
      return <div className="empty-data-state"><p>No vehicle data yet. Start calculating to see statistics.</p></div>;
    }
    return (
      <div className="real-data-list">
        {realData.vehicleMakes.map((make, index) => (
          <div key={index} className="data-item">
            <div className="data-item-header">
              <span className="data-label">{make.make || 'Unknown'}</span>
              <span className="data-value">{make.count} vehicles</span>
            </div>
            <div className="data-progress">
              <div className="data-progress-bar" style={{ width: `${make.percentage}%`, backgroundColor: '#10b981' }}></div>
            </div>
            <div className="data-percentage">{make.percentage}%</div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthlyTax = () => {
    if (realData.taxByMonth.length === 0) {
      return <div className="empty-data-state"><p>No monthly data available. Calculations will appear here.</p></div>;
    }
    const maxTax = Math.max(...realData.taxByMonth.map(m => m.total));
    return (
      <div className="monthly-tax-chart">
        <div className="chart-bars">
          {realData.taxByMonth.map((monthData, index) => {
            const height = maxTax > 0 ? (monthData.total / maxTax) * 150 : 0;
            return (
              <div key={index} className="chart-bar-group">
                <div className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${height}px`, backgroundColor: '#10b981' }}></div>
                </div>
                <div className="chart-label">
                  <div>{monthData.month}</div>
                  <div className="chart-sub-label">{monthData.count} calc{monthData.count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-axis">
          <div className="axis-label">KES 0</div>
          <div className="axis-label">KES {maxTax.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderTaxBreakdown = () => {
    if (realData.taxBreakdown.length === 0) {
      return <div className="empty-data-state"><p>Tax breakdown will appear after calculations.</p></div>;
    }
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
    return (
      <div className="tax-breakdown">
        {realData.taxBreakdown.map((item, index) => (
          <div key={index} className="breakdown-item">
            <div className="breakdown-header">
              <div className="breakdown-color" style={{ backgroundColor: colors[index] || '#6b7280' }}></div>
              <span className="breakdown-type">{item.type}</span>
              <span className="breakdown-percentage">{item.percentage}%</span>
            </div>
            <div className="breakdown-value">KES {item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTopVehicles = () => {
    if (realData.topVehicles.length === 0) {
      return <div className="empty-data-state"><p>Your most calculated vehicles will appear here.</p></div>;
    }
    return (
      <div className="top-vehicles">
        {realData.topVehicles.map((vehicle, index) => (
          <div key={index} className="top-vehicle-item">
            <div className="vehicle-rank">{index + 1}</div>
            <div className="vehicle-details">
              <div className="vehicle-name">{vehicle.vehicle}</div>
              <div className="vehicle-count">{vehicle.count} calculation{vehicle.count !== 1 ? 's' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthlyQuickView = () => {
    if (realData.monthlyTotals.length === 0) {
      return <div className="empty-data-state"><p>Monthly totals will appear here.</p></div>;
    }
    return (
      <div className="monthly-quick-view">
        {realData.monthlyTotals.map((month, index) => (
          <div key={index} className="month-item">
            <div className="month-name">{month.month}</div>
            <div className="month-total">KES {month.total.toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Loading SmartTax Dashboard</h3>
          <p>Analyzing your calculation data...</p>
          <div className="loading-progress"><div className="progress-bar"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="header-subtitle">Welcome back, {user?.name || 'Importer'}</p>
        </div>
        <div className="header-right">
          <div className="date-time">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            Real Data
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdated && <span className="last-updated">Updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <BarChart3 size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.calculations}</div>
            <div className="stat-label">Total Calculations</div>
            <div className="stat-trend positive">
              <span>↑ {stats.monthlyTrend}</span>
              <span>monthly trend</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Car size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.vehicles}</div>
            <div className="stat-label">Unique Vehicles</div>
            <div className="stat-trend positive">
              <span>↑ {Math.floor(stats.vehicles * 0.1)}</span>
              <span>this month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <DollarSign size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-value">KES {stats.taxPaid.toLocaleString()}</div>
            <div className="stat-label">Total Tax Estimated</div>
            <div className="stat-trend positive">
              <span>↑ {stats.calculations > 0 ? Math.round(stats.taxPaid / stats.calculations).toLocaleString() : '0'}</span>
              <span>average per vehicle</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Clock size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.savings}</div>
            <div className="stat-label">Minutes Saved</div>
            <div className="stat-trend positive">
              <span>↑ 30 mins</span>
              <span>per calculation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-left">
          <div className="section-card">
            <div className="section-header">
              <div className="tab-buttons">
                <button className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
                  <FileText size={16} />
                  Recent Calculations
                </button>
                <button className={`tab-button ${activeTab === 'lookups' ? 'active' : ''}`} onClick={() => setActiveTab('lookups')}>
                  <Search size={16} />
                  Lookup History
                </button>
              </div>
              <button className="btn-export" onClick={exportToCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'recent' ? (
                recentCalculations.length > 0 ? (
                  <div className="calculations-list">
                    {recentCalculations.map((calc, index) => (
                      <div key={index} className="calculation-item">
                        <div className="calc-icon">
                          <Car size={20} />
                        </div>
                        <div className="calc-details">
                          <div className="calc-main">
                            <h4>{calc.vehicle?.make || 'Unknown'} {calc.vehicle?.model || 'Vehicle'}</h4>
                            <div className="calc-meta">
                              <span className="meta-item"><span className="meta-label">Year:</span> {calc.vehicle?.year || 'N/A'}</span>
                              <span className="meta-item"><span className="meta-label">CIF:</span> KES {(calc.cifValue || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="calc-summary">
                            <div className="calc-tax">KES {calc.totalTax?.toLocaleString() || '0'}</div>
                            <div className="calc-date">{new Date(calc.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <button className="calc-action" onClick={() => window.location.href = `/calculation/${calc.id || index}`}>
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon"><BarChart3 size={48} /></div>
                    <h3>No calculations yet</h3>
                    <p>Start your first tax calculation to see your history here</p>
                    <Link to="/vehicle-lookup" className="btn btn-primary">Start Calculating</Link>
                  </div>
                )
              ) : (
                <div className="lookups-list">
                  {lookupHistory.map((lookup, index) => (
                    <div key={index} className="lookup-item">
                      <div className="lookup-icon">
                        {lookup.status === 'success' ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                      </div>
                      <div className="lookup-details">
                        <div className="lookup-main">
                          <h4>{lookup.vehicle || 'Vehicle Lookup'}</h4>
                          <div className="lookup-meta">
                            <span className="meta-item">
                              <span className="meta-label">Status:</span> 
                              <span className={`status-badge ${lookup.status}`}>{lookup.status}</span>
                            </span>
                          </div>
                        </div>
                        <div className="lookup-time">{new Date(lookup.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3><Calendar size={18} /> Monthly Tax Overview</h3>
              <div className="time-filter">
                <select className="filter-select">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>All Time</option>
                </select>
              </div>
            </div>
            <div className="chart-container">{renderMonthlyTax()}</div>
            <div className="monthly-quick-view-container">{renderMonthlyQuickView()}</div>
          </div>
        </div>

        <div className="content-right">
          <div className="section-card">
            <div className="section-header">
              <h3><Trophy size={18} /> Top Vehicle Makes</h3>
              <span className="total-count">{stats.calculations} total</span>
            </div>
            <div className="real-data-container">{renderVehicleMakes()}</div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3><Receipt size={18} /> Tax Breakdown</h3>
              <span className="total-count">KES {stats.taxPaid.toLocaleString()}</span>
            </div>
            <div className="real-data-container">{renderTaxBreakdown()}</div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                <AlertTriangle size={18} />
                <h3>Important Alerts</h3>
                <span className="badge">{kraAlerts.filter(a => !a.read).length}</span>
              </div>
              <button className="btn-mark-read" onClick={markAllAlertsAsRead}>Mark all as read</button>
            </div>

            <div className="alerts-list">
              {kraAlerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.read ? 'read' : 'unread'} ${alert.isReal ? 'real-alert' : ''}`} onClick={() => markAlertAsRead(alert.id)}>
                  <div className="alert-header">
                    <div className="alert-type">
                      <span className="type-icon">{getTypeIcon(alert.type)}</span>
                      <span className="priority-dot" style={{ backgroundColor: getPriorityColor(alert.priority) }}></span>
                    </div>
                    <div className="alert-title">
                      <h4>{alert.title}</h4>
                      <span className="alert-time">{alert.timestamp}</span>
                    </div>
                    {!alert.read && <div className="unread-indicator"></div>}
                  </div>
                  <p className="alert-description">{alert.description}</p>
                  <div className="alert-footer">
                    <span className="alert-source">{alert.source}</span>
                    <span className="alert-date">Due: {alert.effectiveDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <Link to="/vehicle-lookup" className="action-card primary">
          <div className="action-icon"><Search size={24} /></div>
          <div className="action-content">
            <h4>New Vehicle Lookup</h4>
            <p>Search KRA database for vehicle details</p>
          </div>
          <div className="action-arrow"><ChevronRight size={20} /></div>
        </Link>

        <Link to="/tax-calculator" className="action-card secondary">
          <div className="action-icon"><Calculator size={24} /></div>
          <div className="action-content">
            <h4>Quick Tax Calculator</h4>
            <p>Calculate import duties instantly</p>
          </div>
          <div className="action-arrow"><ChevronRight size={20} /></div>
        </Link>

        <Link to="/reports" className="action-card tertiary">
          <div className="action-icon"><Activity size={24} /></div>
          <div className="action-content">
            <h4>View All Reports</h4>
            <p>See detailed tax analysis reports</p>
          </div>
          <div className="action-arrow"><ChevronRight size={20} /></div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
