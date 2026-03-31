import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import VehicleLookup from './pages/VehicleLookup';
import TaxCalculator from './pages/TaxCalculator';
import MyCRSP from './pages/MyCRSP';
import Sidebar from './components/common/Sidebar';
import './styles/main.css';
import './styles/components/icons.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smarttax_token');
    const userData = localStorage.getItem('smarttax_user');
    
    if (token && userData) {
      if (token.includes('.') && token.split('.').length === 3) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        localStorage.removeItem('smarttax_token');
        localStorage.removeItem('smarttax_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (loginResponse) => {
    if (loginResponse.token) {
      localStorage.setItem('smarttax_token', loginResponse.token);
    }
    if (loginResponse.user) {
      localStorage.setItem('smarttax_user', JSON.stringify(loginResponse.user));
      setUser(loginResponse.user);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('smarttax_token');
    localStorage.removeItem('smarttax_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading SmartTax...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <div className="app-layout">
            <div className="sidebar-container">
              <Sidebar user={user} onLogout={handleLogout} />
            </div>
            <div className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/vehicle-lookup" element={<VehicleLookup />} />
                <Route path="/tax-calculator" element={<TaxCalculator />} />
                <Route path="/my-crsp" element={<MyCRSP user={user} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
