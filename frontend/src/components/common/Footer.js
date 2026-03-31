import React from 'react';
import '../../styles/components/footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="smarttax-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">SmartTax</div>
            <p className="footer-tagline">
              Fair Valuation. Trusted Nation.
            </p>
            <p className="footer-description">
              A transparent tax evaluation system for Kenya's vehicle imports.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-list">
                <li><a href="/features">Features</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/documentation">Documentation</a></li>
                <li><a href="/api">API</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-list">
                <li><a href="/about">About</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-list">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/disclaimer">Disclaimer</a></li>
                <li><a href="/compliance">Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            © {currentYear} SmartTax System. All rights reserved.
          </div>
          
          <div className="footer-info">
            <span className="contact-info">
              <strong>Phone:</strong> +254112262121
            </span>
            <span className="contact-info">
              <strong>Email:</strong> support@smarttax.com
            </span>
            <span className="contact-info">
              <strong>Address:</strong> Nairobi, Kenya
            </span>
          </div>
          
          <div className="footer-social">
            <a href="https://facebook.com" className="social-link">Facebook</a>
            <a href="https://twitter.com" className="social-link">Twitter</a>
            <a href="https://linkedin.com" className="social-link">LinkedIn</a>
            <a href="https://github.com" className="social-link">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;