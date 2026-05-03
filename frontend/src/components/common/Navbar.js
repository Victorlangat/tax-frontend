// src/components/common/Navbar.js - NEW FILE
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Calculator, 
  Database, 
  FileText, 
  Settings,
  LogOut,
  User,
  Car
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px'
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Car size={20} color="white" />
          </div>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            SmartTax
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavLink to="/vehicle-lookup" icon={<Search size={18} />} label="Find Vehicle" />
          <NavLink to="/tax-calculator" icon={<Calculator size={18} />} label="Calculator" />
          <NavLink to="/my-crsp" icon={<Database size={18} />} label="CRSP" />
          <NavLink to="/reports" icon={<FileText size={18} />} label="Reports" />
          <NavLink to="/settings" icon={<Settings size={18} />} label="Settings" />
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                background: '#f9fafb',
                borderRadius: '10px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    {user.email?.split('@')[0] || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Importer</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#dc2626',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fee2e2';
                  e.target.style.borderColor = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// Helper component for nav links
const NavLink = ({ to, icon, label }) => {
  const location = window.location.pathname;
  const isActive = location === to;

  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
        background: isActive ? '#f3f4f6' : 'transparent',
        color: isActive ? '#4f46e5' : '#4b5563'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.target.style.background = '#f9fafb';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.target.style.background = 'transparent';
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default Navbar;