// src/pages/Dashboard.js - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calculator, Car, Search, Download, 
  CheckCircle, ChevronRight, RefreshCw, BarChart3, 
  Database, DollarSign, Trash2, TrendingUp, 
  FileText, AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Dashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalTax: 0,
    uniqueVehicles: 0,
    thisMonth: 0
  });

  const loadCalculations = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setCalculations([]);
        setLoading(false);
        return;
      }

      if (!propUser) setUser(currentUser);

      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map(calc => ({
        id: calc.id,
        referenceId: calc.reference_id,
        name: calc.name || 'Tax Calculation',
        vehicleName: calc.metadata?.vehicleMake || calc.inputs?.make || 'Vehicle',
        vehicleYear: calc.metadata?.vehicleYear || calc.inputs?.year,
        date: calc.created_at ? new Date(calc.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        totalTax: calc.results?.totalTax || 0,
        status: calc.status || 'saved',
        createdAt: calc.created_at
      }));

      setCalculations(processed);

      const total = processed.length;
      const totalTax = processed.reduce((sum, c) => sum + (c.totalTax || 0), 0);
      const uniqueVehicles = new Set(processed.map(c => c.vehicleName)).size;
      const thisMonth = processed.filter(c => {
        const date = new Date(c.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      setStats({ total, totalTax, uniqueVehicles, thisMonth });

    } catch (err) {
      console.error('Error loading calculations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propUser]);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCalculations();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    // Use window.confirm instead of just confirm (ESLint fix)
    const userConfirmed = window.confirm('Delete this calculation?');
    if (!userConfirmed) return;

    const { error } = await supabase.from('calculations').delete().eq('id', id);
    if (!error) {
      loadCalculations();
    } else {
      alert('Delete failed: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p>Loading dashboard...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>Dashboard</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Welcome back, {user?.email?.split('@')[0] || 'Importer'}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={<BarChart3 />} color="#10b981" label="Total Calculations" value={stats.total} />
        <StatCard icon={<DollarSign />} color="#8b5cf6" label="Total Tax Estimated" value={formatCurrency(stats.totalTax)} />
        <StatCard icon={<Car />} color="#3b82f6" label="Unique Vehicles" value={stats.uniqueVehicles} />
        <StatCard icon={<TrendingUp />} color="#f59e0b" label="This Month" value={stats.thisMonth} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Calculations List */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <CheckCircle size={20} />
              Saved Calculations
            </h3>
            {calculations.length > 0 && (
              <button style={{ padding: '6px 12px', background: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <Download size={14} style={{ marginRight: '6px' }} />
                Export CSV
              </button>
            )}
          </div>

          {calculations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e1' }}>📊</div>
              <h3 style={{ margin: '0 0 8px' }}>No saved calculations yet</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Calculate taxes on a vehicle and save it to see it here.</p>
              <Link to="/vehicle-lookup" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textDecoration: 'none', borderRadius: '12px', display: 'inline-block' }}>
                Find Vehicle
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {calculations.map(calc => (
                <div
                  key={calc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
                >
                  <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667eea' }}>
                    <Calculator size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>{calc.name}</h4>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
                      <span><strong>Vehicle:</strong> {calc.vehicleName}</span>
                      {calc.vehicleYear && <span><strong>Year:</strong> {calc.vehicleYear}</span>}
                      <span><strong>Ref:</strong> {calc.referenceId?.slice(-8)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{formatCurrency(calc.totalTax)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{calc.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => handleDelete(calc.id, e)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={20} color="#9ca3af" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 20px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ActionLink to="/vehicle-lookup" icon={<Search size={18} />} color="#4f46e5" bg="#e0e7ff" title="Vehicle Lookup" desc="Find vehicle in CRSP database" />
              <ActionLink to="/tax-calculator" icon={<Calculator size={18} />} color="#059669" bg="#dcfce7" title="Tax Calculator" desc="Calculate import duties" />
              <ActionLink to="/my-crsp" icon={<Database size={18} />} color="#d97706" bg="#fef3c7" title="CRSP Management" desc="Upload and manage CRSP data" />
              <ActionLink to="/reports" icon={<FileText size={18} />} color="#0284c7" bg="#e0f2fe" title="Reports" desc="Generate and export reports" />
            </div>
          </div>

          {/* Tips Card */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', padding: '24px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertCircle size={24} />
              <h3 style={{ margin: 0 }}>Pro Tips</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
              <li>Always verify vehicle details match your documents</li>
              <li>Save calculations for future reference</li>
              <li>Export reports for KRA submission</li>
              <li>Keep CRSP data updated monthly</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, color, label, value }) => (
  <div style={{ background: 'white', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <div style={{ width: '56px', height: '56px', background: `${color}20`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
    </div>
  </div>
);

// Action Link Component
const ActionLink = ({ to, icon, color, bg, title, desc }) => (
  <Link 
    to={to} 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '14px', 
      padding: '14px', 
      background: '#f9fafb', 
      borderRadius: '14px', 
      textDecoration: 'none', 
      transition: 'all 0.2s' 
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
    onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
  >
    <div style={{ width: '44px', height: '44px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{desc}</div>
    </div>
    <ChevronRight size={18} color="#9ca3af" />
  </Link>
);

export default Dashboard;