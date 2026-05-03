// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const result = await authService.login(formData.email, formData.password);

    if (result.success) {
      if (onLogin) {
        onLogin(result);
      }
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  const handleDemoLogin = async (role) => {
    setLoading(true);
    setError('');

    const result = await authService.demoLogin(role);

    if (result.success) {
      if (onLogin) {
        onLogin(result);
      }
      navigate('/dashboard');
    } else {
      setError(result.message || 'Demo login failed');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-logo">
              <div className="logo-icon">🚗</div>
              <div className="logo-text">
                <h1>SmartTax</h1>
                <p className="tagline">Kenya Vehicle Import Tax Calculator</p>
              </div>
            </div>
          </div>
          <div className="login-features">
            <h2>Calculate Import Duties<br />with Confidence</h2>
            <div className="features-list">
              <div className="feature">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h4>Real-time CRSP Data</h4>
                  <p>Access the latest KRA customs reference prices</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">🧮</div>
                <div className="feature-text">
                  <h4>Accurate Tax Calculation</h4>
                  <p>Based on official 2025 KRA tax rates and formulas</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">📄</div>
                <div className="feature-text">
                  <h4>Export Reports</h4>
                  <p>Generate PDF/Excel reports for KRA submission</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to calculate vehicle import taxes</p>
            </div>

            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-button"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <div className="demo-login">
                <h4>Demo Access</h4>
                <div className="demo-buttons">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleDemoLogin('importer')}
                    disabled={loading}
                  >
                    Importer Demo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleDemoLogin('admin')}
                    disabled={loading}
                  >
                    Admin Demo
                  </button>
                </div>
              </div>

              <div className="signup-link">
                <p>Don't have an account? <Link to="/signup">Create one</Link></p>
              </div>
            </form>

            <div className="login-footer">
              <p className="disclaimer">
                By signing in, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;