import React from 'react';
import Button from './Button';
import '../../styles/components/header.css';

const Header = ({ 
  title, 
  subtitle,
  actions,
  breadcrumbs,
  searchEnabled = false,
  onSearch,
  filters
}) => {
  return (
    <header className="smarttax-header">
      <div className="header-container">
        <div className="header-left">
          {breadcrumbs && (
            <div className="breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="breadcrumb-separator">/</span>}
                  <span className="breadcrumb-item">{crumb}</span>
                </React.Fragment>
              ))}
            </div>
          )}
          
          <div className="header-titles">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="header-right">
          {searchEnabled && (
            <div className="header-search">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
            </div>
          )}
          
          {filters && (
            <div className="header-filters">
              {filters}
            </div>
          )}
          
          {actions && (
            <div className="header-actions">
              {Array.isArray(actions) ? (
                actions.map((action, index) => (
                  <React.Fragment key={index}>{action}</React.Fragment>
                ))
              ) : (
                actions
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;