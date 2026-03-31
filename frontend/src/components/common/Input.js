import React from 'react';
import '../../styles/components/forms.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const inputClass = `smarttax-input ${error ? 'input-error' : ''} ${className}`;
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
          {...props}
        />
        {error && <span className="input-error-icon">⚠️</span>}
      </div>
      
      {helperText && !error && (
        <div className="helper-text">{helperText}</div>
      )}
      {error && (
        <div className="error-text">{error}</div>
      )}
    </div>
  );
};

export default Input;