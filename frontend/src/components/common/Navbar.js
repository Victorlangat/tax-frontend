import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/components/navbar.css';

const Navbar = () => {
  return (
    <nav className="smarttax-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="logo-link">
            <div className="logo-icon">ST</div>
            <span className="logo-text">SmartTax</span>
            <span className="logo-tagline">Fair Valuation. Trusted Nation.</span>
          </Link>
        </div>
        
        <div className="navbar-menu">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/vehicle-lookup" className="nav-link">Vehicle Lookup</Link>
            </li>
            <li className="nav-item">
              <Link to="/tax-calculator" className="nav-link">Tax Calculator</Link>
            </li>
            <li className="nav-item">
              <Link to="/reports" className="nav-link">Reports</Link>
            </li>
          </ul>
          
          <div className="navbar-user">
            <div className="user-avatar">
              <span className="user-initials">LK</span>
            </div>
            <div className="user-info">
              <span className="user-name">Leonard Kariuki</span>
              <span className="user-role">Importer</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;