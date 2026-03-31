import React, { useState, useEffect, useCallback } from 'react';

const VehicleLookupForm = ({ onSubmit, availableMakes = [], availableModels = [] }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engineCC: '',
    fuelType: '',
    transmission: ''
  });
  
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // Set makes - prioritize props from parent (dynamic from CRSP), fallback to API
  useEffect(() => {
    if (availableMakes && availableMakes.length > 0) {
      // Use makes passed from parent (from CRSP data)
      setMakes(availableMakes);
    } else {
      // Fallback: fetch from API
      fetchMakes();
    }
  }, [availableMakes]);

  // Update models when availableModels prop changes or when make changes
  useEffect(() => {
    if (availableModels && typeof availableModels === 'object' && formData.make && availableModels[formData.make]) {
      // Get models for the selected make from the object
      setModels(availableModels[formData.make]);
    } else if (formData.make) {
      // Fallback: fetch models from API if not available in props
      fetchModels(formData.make);
    }
  }, [availableModels, formData.make]);

  // Fetch models when make changes
  useEffect(() => {
    if (formData.make) {
      fetchModels(formData.make);
    } else {
      setModels([]);
      setFormData(prev => ({ ...prev, model: '' }));
    }
  }, [formData.make]);

  const fetchMakes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vehicles/suggestions?type=make');
      const data = await response.json();
      if (data.success && data.makes) {
        setMakes(data.makes);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
      // Fallback to default makes
      setMakes(['Toyota', 'Suzuki', 'Mazda', 'Honda', 'Nissan', 'Mitsubishi', 'Subaru', 'Lexus', 'Volkswagen', 'BMW', 'Mercedes', 'Ford', 'Hyundai', 'Kia', 'Volvo', 'Audi', 'Porsche', 'Land Rover', 'Jaguar', 'Peugeot']);
    }
  };

  const fetchModels = async (make) => {
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/suggestions?type=model&make=${encodeURIComponent(make)}`);
      const data = await response.json();
      if (data.success && data.suggestions) {
        setModels(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };

  const handleModelInputChange = useCallback(async (value) => {
    setFormData(prev => ({ ...prev, model: value }));
    
    if (value.length >= 1 && formData.make) {
      // Filter local models based on input
      const filtered = models.filter(m => 
        m.toLowerCase().includes(value.toLowerCase())
      );
      setModelSuggestions(filtered.slice(0, 10));
      setShowModelSuggestions(true);
    } else {
      setShowModelSuggestions(false);
    }
  }, [formData.make, models]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'model') {
      handleModelInputChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setShowModelSuggestions(false);
    }
  };

  const handleModelSelect = (model) => {
    setFormData(prev => ({ ...prev, model }));
    setShowModelSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up empty fields
    const cleanData = { ...formData };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    // Ensure at least make and model are provided
    if (!cleanData.make || !cleanData.model) {
      alert('Please select a make and enter a model');
      return;
    }
    
    onSubmit(cleanData);
  };

  const handleClear = () => {
    setFormData({
      make: '',
      model: '',
      year: currentYear,
      engineCC: '',
      fuelType: '',
      transmission: ''
    });
    setModels([]);
    setModelSuggestions([]);
  };

  return (
    <form onSubmit={handleSubmit} className="vehicle-form enhanced-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Make <span className="required">*</span>
          </label>
          <select
            name="make"
            value={formData.make}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select Make</option> 
            {makes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        <div className="form-group autocomplete-wrapper">
          <label className="form-label">
            Model <span className="required">*</span>
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            onFocus={() => {
              if (formData.model && formData.make) {
                const filtered = models.filter(m => 
                  m.toLowerCase().includes(formData.model.toLowerCase())
                );
                setModelSuggestions(filtered.slice(0, 10));
                setShowModelSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowModelSuggestions(false), 200);
            }}
            className="form-input"
            placeholder={formData.make ? "Enter model name" : "Select make first"}
            required
            disabled={false || !formData.make}
            autoComplete="off"
          />
</xai:function_call > 

Wait, better: use local loading.

First add const [loading, setLoading] = useState(false); already there.

Then change prop to { onSubmit, loading, availableMakes = [], availableModels = [] }

But previous prop removal was partial.

Since file read, now edit with specific lines.

Line by line for remaining.

Next model input:

old_str = `            disabled={parentLoading || !formData.make}
            autoComplete="off"
          />`

new_str = `            disabled={loading || !formData.make}
            autoComplete="off"
          />`

But loading already defined.

The component has const [loading, setLoading] = useState(false); yes.

So replace parentLoading with loading everywhere.

But since multiple, make unique multi-line.

First one for year select:

old_str = `            className="form-select"
            disabled={parentLoading}
          >
            <option value="">Any Year</option>`

etc.

Use parallel for different lines.

Since error "Multiple matches", need unique context.

For VehicleLookupForm.js, replace all disabled={parentLoading} with disabled={false}

But multiple, so multi tool.

Let's do model input.
</thinking>

<xai:function_call name="edit_file">
<parameter name="path">tax-project/smarttax-frontend/src/components/vehicle/VehicleLookupForm.js
          {showModelSuggestions && modelSuggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {modelSuggestions.map((model, index) => (
                <li 
                  key={index} 
                  onClick={() => handleModelSelect(model)}
                >
                  {model}
                </li>
              ))}
            </ul>
          )}
          {!formData.make && (
            <small className="form-hint">Select a make first</small>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="form-select"
            disabled={parentLoading}
          >
            <option value="">Any Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Engine (CC)</label>
          <input
            type="number"
            name="engineCC"
            value={formData.engineCC}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., 1500"
            disabled={parentLoading}
            min="0"
            step="100"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fuel Type</label>
          <select
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
            className="form-select"
            disabled={parentLoading}
          >
            <option value="">Any Fuel Type</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Transmission</label>
          <select
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
            className="form-select"
            disabled={parentLoading}
          >
            <option value="">Any Transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="CVT">CVT</option>
            <option value="semi-automatic">Semi-Automatic</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button"
          className="btn btn-outline"
          onClick={handleClear}
          disabled={parentLoading}
        >
          Clear
        </button>
        <button 
          type="submit" 
          className="btn btn-primary search-btn"
          disabled={parentLoading || !formData.make || !formData.model}
        >
          {parentLoading ? (
            <>
              <span className="loading-spinner-small"></span>
              Searching...
            </>
          ) : (
            '🔍 Find Vehicle'
          )}
        </button>
      </div>

      <style>{`
        .enhanced-form .required {
          color: #e74c3c;
        }
        
        .enhanced-form .form-hint {
          color: #7f8c8d;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        
        .enhanced-form .autocomplete-wrapper {
          position: relative;
        }
        
        .enhanced-form .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          margin: 4px 0;
          padding: 0;
          list-style: none;
        }
        
        .enhanced-form .suggestions-dropdown li {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }
        
        .enhanced-form .suggestions-dropdown li:hover {
          background: #f8f9fa;
          color: #3498db;
        }
        
        .enhanced-form .suggestions-dropdown li:last-child {
          border-bottom: none;
        }
        
        .enhanced-form .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .enhanced-form .form-actions .btn {
          flex: 1;
          padding: 12px 20px;
        }
        
        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .enhanced-form .form-row {
            flex-direction: column;
          }
          
          .enhanced-form .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  );
};

export default VehicleLookupForm;

