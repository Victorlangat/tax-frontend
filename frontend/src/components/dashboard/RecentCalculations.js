import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/pages/dashboard.css';

const RecentCalculations = () => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCalculations = useCallback(() => {
    try {
      // Load calculations from localStorage
      const savedCalculations = JSON.parse(localStorage.getItem('smarttax_calculations') || '[]');
      
      // If no saved calculations, use demo data
      if (savedCalculations.length === 0) {
        setCalculations([
          { id: 'CALC-001', vehicle: 'Suzuki Swift 1.2L (2018)', date: '2025-01-15', totalTax: 'KES 623,503', status: 'Verified', match: '95%' },
          { id: 'CALC-002', vehicle: 'Toyota Vitz Hybrid F', date: '2025-01-14', totalTax: 'KES 580,000', status: 'Disputed', match: '87%' },
          { id: 'CALC-003', vehicle: 'Mazda Demio 1.5L', date: '2025-01-13', totalTax: 'KES 467,350', status: 'Verified', match: '98%' },
          { id: 'CALC-004', vehicle: 'Toyota Premio 2.0G', date: '2025-01-12', totalTax: 'KES 1,200,000', status: 'Pending', match: '92%' },
          { id: 'CALC-005', vehicle: 'Lexus LX570', date: '2025-01-11', totalTax: 'KES 3,410,000', status: 'Verified', match: '96%' }
        ]);
      } else {
        // Format saved calculations
        const formattedCalcs = savedCalculations
          .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
          .slice(0, 10)
          .map((calc, index) => ({
            id: calc.referenceId || `CALC-${String(index + 1).padStart(3, '0')}`,
            vehicle: `${calc.vehicle?.make || 'Unknown'} ${calc.vehicle?.model || 'Vehicle'} ${calc.vehicle?.year || ''}`.trim(),
            date: calc.calculationDate || new Date(calc.timestamp).toLocaleDateString(),
            totalTax: `KES ${(calc.totalTax || 0).toLocaleString()}`,
            status: calc.status || 'Verified',
            match: `${calc.matchPercentage || Math.floor(Math.random() * 20 + 80)}%`
          }));
        setCalculations(formattedCalcs);
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadCalculations();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadCalculations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCalculations();
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Verified': { class: 'status-verified', label: 'Verified' },
      'Disputed': { class: 'status-disputed', label: 'Disputed' },
      'Pending': { class: 'status-pending', label: 'Pending' }
    };
    
    const config = statusConfig[status];
    return <span className={`status-badge ${config?.class}`}>{config?.label}</span>;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Verified': return <CheckCircle size={16} color="#10b981" />;
      case 'Disputed': return <XCircle size={16} color="#ef4444" />;
      case 'Pending': return <AlertCircle size={16} color="#eab308" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card title="Recent Calculations" icon={<BarChart3 size={20} />} padding>
        <div className="loading-state">
          <p>Loading calculations...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Recent Calculations" icon={<BarChart3 size={20} />} padding>
      <div className="recent-calculations-header">
        <button className="refresh-btn-small" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        {lastUpdated && <span className="last-updated-small">Updated: {lastUpdated.toLocaleTimeString()}</span>}
      </div>
      
      <div className="calculations-table">
        <div className="table-header">
          <div className="table-cell">ID</div>
          <div className="table-cell">Vehicle</div>
          <div className="table-cell">Date</div>
          <div className="table-cell">Total Tax</div>
          <div className="table-cell">Status</div>
          <div className="table-cell">CRSP Match</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {calculations.map((calc) => (
          <div key={calc.id} className="table-row">
            <div className="table-cell cell-id">
              <span className="cell-value">{calc.id}</span>
            </div>
            <div className="table-cell cell-vehicle">
              <span className="cell-value">{calc.vehicle}</span>
            </div>
            <div className="table-cell cell-date">
              <span className="cell-value">{calc.date}</span>
            </div>
            <div className="table-cell cell-tax">
              <span className="cell-value">{calc.totalTax}</span>
            </div>
            <div className="table-cell cell-status">
              {getStatusIcon(calc.status)}
              {getStatusBadge(calc.status)}
            </div>
            <div className="table-cell cell-match">
              <div className="match-bar">
                <div className="match-fill" style={{ width: calc.match }}></div>
                <span className="match-percentage">{calc.match}</span>
              </div>
            </div>
            <div className="table-cell cell-actions">
              <Button variant="outline" size="small" className="action-btn">View</Button>
              <Button variant="outline" size="small" className="action-btn">Export</Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="calculations-footer">
        <Button variant="outline">View All Calculations</Button>
      </div>
    </Card>
  );
};

export default RecentCalculations;
