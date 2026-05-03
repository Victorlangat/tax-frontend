// src/App.js - WITH GLOBAL NAVBAR
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Dashboard from './pages/Dashboard';
import VehicleLookup from './pages/VehicleLookup';
import TaxCalculator from './pages/TaxCalculator';
import MyCRSP from './pages/MyCRSP';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('smarttax_token');
    const savedUser = localStorage.getItem('smarttax_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.user);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      {/* Navbar appears on every page automatically */}
      <Navbar user={user} onLogout={handleLogout} />
      
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/vehicle-lookup" element={<VehicleLookup />} />
        <Route path="/tax-calculator" element={<TaxCalculator />} />
        <Route path="/my-crsp" element={<MyCRSP user={user} />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;