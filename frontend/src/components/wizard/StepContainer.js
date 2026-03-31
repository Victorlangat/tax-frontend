import React from 'react';
import '../../styles/components/wizard.css';

const StepContainer = ({ 
  children, 
  title, 
  subtitle,
  stepNumber,
  totalSteps,
  footer
}) => {
  return (
    <div className="wizard-step-container">
      <div className="step-header">
        <div className="step-header-info">
          <div className="step-indicator">
            <span className="step-current">{stepNumber}</span>
            <span className="step-total">/{totalSteps}</span>
          </div>
          <div className="step-header-content">
            {title && <h2 className="step-title">{title}</h2>}
            {subtitle && <p className="step-subtitle">{subtitle}</p>}
          </div>
        </div>
        {footer && (
          <div className="step-header-footer">
            {footer}
          </div>
        )}
      </div>
      
      <div className="step-content">
        {children}
      </div>
    </div>
  );
};

export default StepContainer;