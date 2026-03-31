import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import '../../styles/components/sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {/* Logo & Title */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
<Icon name="car" className="logo-icon" />
          <div className="logo-text">
            <h1>SmartTax</h1>
            <p className="logo-subtitle">Vehicle Import Taxes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
<Icon name="barChart" className="nav-icon" />
              <span className="nav-text">Dashboard</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink 
              to="/vehicle-lookup" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
<Icon name="search" className="nav-icon" />
              <span className="nav-text">Find Vehicle</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink 
              to="/tax-calculator" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
<Icon name="calculate" className="nav-icon" />
              <span className="nav-text">Calculate Tax</span>
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink 
              to="/my-crsp" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
<Icon name="description" className="nav-icon" />
              <span className="nav-text">My CRSP</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* User Profile / Login */}
      <div className="sidebar-footer">
        {user ? (
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-email">{user.email || ''}</span>
            </div>
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
<Icon name="logout" className="logout-icon" />
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            <button 
              className="login-btn"
              onClick={() => navigate('/login')}
            >
<Icon name="login" className="login-icon" />
              <span>Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
