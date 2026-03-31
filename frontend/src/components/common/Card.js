import React from 'react';
import '../../styles/components/cards.css';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  footer,
  padding = true,
  border = true,
  shadow = 'medium',
  className = '',
  onClick
}) => {
  const cardClass = `smarttax-card ${shadow} ${border ? 'with-border' : ''} ${padding ? 'with-padding' : ''} ${className}`;
  
  return (
    <div className={cardClass} onClick={onClick}>
      {(title || icon) && (
        <div className="card-header">
          <div className="card-title-container">
            {icon && <span className="card-icon">{icon}</span>}
            <div>
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;