// src/pages/Reports.js - REMOVE SIDEBAR
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FileText, Download, Eye, Trash2, TrendingUp, Calendar, Filter } from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('smarttax_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error:', e);
      }
    }
    
    // Load reports from localStorage (demo data)
    const savedCalculations = localStorage.getItem('smarttax_calculations');
    if (savedCalculations) {
      const calculations = JSON.parse(savedCalculations);
      const reportData = calculations.map(calc => ({
        id: calc.id || Date.now(),
        title: calc.name || 'Tax Calculation',
        vehicle: `${calc.vehicle?.make || ''} ${calc.vehicle?.model || ''}`.trim(),
        date: calc.calculationDate || new Date().toLocaleDateString(),
        totalTax: calc.totalTax || 0,
        status: 'Generated'
      }));
      setReports(reportData);
    } else {
      // Demo data
      setReports([
        { id: 1, title: 'Toyota Vitz Tax Calculation', vehicle: 'Toyota Vitz 2018', date: '2025-01-15', totalTax: 580000, status: 'Generated' },
        { id: 2, title: 'Suzuki Swift Calculation', vehicle: 'Suzuki Swift 2020', date: '2025-01-14', totalTax: 623503, status: 'Generated' }
      ]);
    }
    setLoading(false);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleDownload = (report) => {
    alert(`Downloading report: ${report.title}`);
  };

  const handleView = (report) => {
    alert(`Viewing report: ${report.title}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this report?')) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return (
      <>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div>Loading reports...</div>
        </div>
      </>
    );
  }

  return (
    <>
     
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>Reports</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>View and export your tax calculation reports</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <FileText size={24} color="#10b981" />
              <span style={{ color: '#6b7280' }}>Total Reports</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{reports.length}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <TrendingUp size={24} color="#3b82f6" />
              <span style={{ color: '#6b7280' }}>Total Tax Value</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(reports.reduce((sum, r) => sum + r.totalTax, 0))}</div>
          </div>
        </div>

        {/* Reports Table */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px' }}>Generated Reports</h3>
          
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No reports generated yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Vehicle</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontWeight: '600' }}>Total Tax</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>{report.title}</td>
                      <td style={{ padding: '12px' }}>{report.vehicle}</td>
                      <td style={{ padding: '12px' }}>{report.date}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{formatCurrency(report.totalTax)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleView(report)} style={{ padding: '6px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleDownload(report)} style={{ padding: '6px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            <Download size={16} />
                          </button>
                          <button onClick={() => handleDelete(report.id)} style={{ padding: '6px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;