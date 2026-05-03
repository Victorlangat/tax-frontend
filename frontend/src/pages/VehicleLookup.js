// src/pages/VehicleLookup.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, X, AlertCircle, ChevronRight, Calendar, Gauge, Fuel, Settings, Info } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const VehicleLookup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [allVehiclesCache, setAllVehiclesCache] = useState([]);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    engineCC: '',
    fuelType: ''
  });

  // Load all vehicles on mount
  useEffect(() => {
    loadAllVehicles();
  }, []);

  // Load ALL models for selected make from the database (not filtered)
  useEffect(() => {
    if (formData.make && allVehiclesCache.length > 0) {
      // Get ALL unique models for this make from the cache
      const uniqueModels = [...new Set(
        allVehiclesCache
          .filter(v => v.make && v.make.toLowerCase() === formData.make.toLowerCase())
          .map(v => v.model)
      )].sort();
      setModels(uniqueModels);
    } else {
      setModels([]);
    }
  }, [formData.make, allVehiclesCache]);

  const loadAllVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select(`
          id,
          vehicle_details,
          retail_price,
          customs_value,
          wholesale_price,
          month,
          source,
          is_active
        `)
        .eq('is_active', true)
        .limit(2000);

      if (error) throw error;

      if (data && data.length > 0) {
        const vehicleMap = new Map();
        
        data.forEach(crsp => {
          const v = crsp.vehicle_details;
          if (!v || !v.make || !v.model) return;
          
          const key = `${v.make}-${v.model}-${v.year}-${v.engineCC}-${v.fuelType}`;
          
          if (!vehicleMap.has(key)) {
            vehicleMap.set(key, {
              id: crsp.id,
              make: v.make,
              model: v.model,
              year: v.year,
              engineCC: v.engineCC,
              fuelType: v.fuelType || 'petrol',
              transmission: v.transmission || 'automatic',
              bodyType: v.bodyType || 'sedan',
              crsp: {
                retailPrice: crsp.retail_price,
                customsValue: crsp.customs_value,
                wholesalePrice: crsp.wholesale_price,
                month: crsp.month,
                source: crsp.source
              }
            });
          }
        });
        
        const vehiclesList = Array.from(vehicleMap.values());
        setAllVehiclesCache(vehiclesList);
        
        // Get ALL unique makes from the database
        const uniqueMakes = [...new Set(vehiclesList.map(v => v.make))].sort();
        setMakes(uniqueMakes);
        
        console.log(`Loaded ${vehiclesList.length} unique vehicle configurations`);
        console.log(`Makes available: ${uniqueMakes.length}`);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicle data. Please refresh the page.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    // Clear models when make changes
    if (name === 'make') {
      setModels([]);
      setFormData(prev => ({ ...prev, model: '' }));
    }
  };

  // Search ONLY filters by Make and Model - shows ALL variants
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!formData.make) {
      setError('Please select a vehicle make');
      return;
    }
    
    if (!formData.model) {
      setError('Please select a vehicle model');
      return;
    }

    setLoading(true);
    setError('');
    setSearchPerformed(true);
    setSelectedVehicle(null);

    try {
      // Filter by make and model ONLY - get ALL variants
      let results = [...allVehiclesCache];
      
      results = results.filter(v => 
        v.make && v.make.toLowerCase() === formData.make.toLowerCase() &&
        v.model && v.model.toLowerCase() === formData.model.toLowerCase()
      );
      
      if (results.length > 0) {
        setVehicles(results);
        console.log(`Found ${results.length} variants for ${formData.make} ${formData.model}`);
      } else {
        setVehicles([]);
        setError(`No vehicles found for ${formData.make} ${formData.model}. Please check your selection.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    // Create vehicle for calculation using user's input values
    const vehicleForCalculation = {
      ...vehicle,
      // Use user-provided values for tax calculation
      year: formData.year ? parseInt(formData.year) : vehicle.year,
      engineCC: formData.engineCC ? parseInt(formData.engineCC) : vehicle.engineCC,
      fuelType: formData.fuelType || vehicle.fuelType,
      // Store original values for reference
      originalYear: vehicle.year,
      originalEngineCC: vehicle.engineCC,
      originalFuelType: vehicle.fuelType
    };
    
    setSelectedVehicle(vehicleForCalculation);
    setVehicles([]);
    setError('');
  };

  const handleCalculateTax = () => {
    if (selectedVehicle) {
      sessionStorage.setItem('selected_vehicle', JSON.stringify(selectedVehicle));
      navigate('/tax-calculator');
    }
  };

  const resetSearch = () => {
    setSelectedVehicle(null);
    setVehicles([]);
    setSearchPerformed(false);
    setError('');
    setFormData({
      make: '',
      model: '',
      year: '',
      engineCC: '',
      fuelType: ''
    });
  };

  return (
    <div className="vehicle-lookup-page">
      <div className="page-header">
        <h1>Find Your Vehicle</h1>
        <p>Select Make and Model to see all available variants. Year, Engine CC, and Fuel Type will be used for tax calculation.</p>
      </div>

      <div className="search-container">
        {/* Search Form */}
        <div className="search-card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Car size={16} />
                  Make *
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Make</option>
                  {makes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Settings size={16} />
                  Model *
                </label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  disabled={loading || !formData.make}
                >
                  <option value="">Select Model</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2023"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>
                  <Gauge size={16} />
                  Engine CC *
                </label>
                <input
                  type="number"
                  name="engineCC"
                  value={formData.engineCC}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>
                  <Fuel size={16} />
                  Fuel Type *
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Fuel Type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>

              <div className="form-group search-button">
                <button type="submit" className="btn-search" disabled={loading}>
                  {loading ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <>
                      <Search size={18} />
                      Search Vehicle
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Note about search */}
        <div className="search-note">
          <Info size={14} />
          <span>Search shows ALL variants for your selected Make and Model. Your Year, Engine CC, and Fuel Type will be used for tax calculation.</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-card">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={resetSearch} className="btn-link">Clear Search</button>
          </div>
        )}

        {/* Search Results - Show ALL variants */}
        {vehicles.length > 0 && !selectedVehicle && (
          <div className="results-section">
            <div className="results-header">
              <h3>Found {vehicles.length} Variant{vehicles.length !== 1 ? 's' : ''} of {formData.make} {formData.model}</h3>
              <button onClick={resetSearch} className="btn-outline-small">
                <X size={16} />
                Clear
              </button>
            </div>
            <div className="results-note">
              <span>Your tax calculation values: Year {formData.year || '?'}, Engine {formData.engineCC || '?'}cc, Fuel {formData.fuelType || '?'}</span>
            </div>
            <div className="results-grid">
              {vehicles.map((vehicle, index) => (
                <div key={index} className="vehicle-card" onClick={() => handleSelectVehicle(vehicle)}>
                  <div className="vehicle-card-header">
                    <div className="vehicle-title">
                      <Car size={20} />
                      <strong>{vehicle.make} {vehicle.model}</strong>
                    </div>
                    <span className="year-badge">Year: {vehicle.year}</span>
                  </div>
                  <div className="vehicle-specs">
                    <span>Engine: {vehicle.engineCC}cc</span>
                    <span className={`fuel-badge ${vehicle.fuelType?.toLowerCase() || 'petrol'}`}>
                      Fuel: {vehicle.fuelType || 'Petrol'}
                    </span>
                    <span>Trans: {vehicle.transmission || 'N/A'}</span>
                  </div>
                  {vehicle.crsp && (
                    <div className="vehicle-price">
                      CRSP Value: KES {vehicle.crsp.retailPrice?.toLocaleString()}
                    </div>
                  )}
                  <div className="user-inputs-note">
                    <span>Your values: {formData.year} · {formData.engineCC}cc · {formData.fuelType}</span>
                  </div>
                  <button className="select-btn">
                    Select This Variant →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <div className="selected-vehicle-section">
            <div className="selected-vehicle-card">
              <div className="selected-header">
                <div className="selected-icon">
                  <Car size={32} />
                </div>
                <div className="selected-info">
                  <h2>{selectedVehicle.make} {selectedVehicle.model}</h2>
                  <p>Selected Variant: {selectedVehicle.originalYear || selectedVehicle.year} · {selectedVehicle.originalEngineCC || selectedVehicle.engineCC}cc · {selectedVehicle.originalFuelType || selectedVehicle.fuelType}</p>
                </div>
                <button onClick={resetSearch} className="btn-outline-small">
                  <X size={16} />
                  Change
                </button>
              </div>

              <div className="selected-details">
                <div className="comparison-section">
                  <h4>Tax Calculation Values</h4>
                  <div className="comparison-grid">
                    <div className="comparison-item">
                      <span className="comparison-label">Parameter</span>
                      <span className="comparison-label">Your Input</span>
                      <span className="comparison-label">Vehicle Data</span>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Year</span>
                      <span className="comparison-value user">{selectedVehicle.year}</span>
                      <span className="comparison-value stored">{selectedVehicle.originalYear || selectedVehicle.year}</span>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Engine CC</span>
                      <span className="comparison-value user">{selectedVehicle.engineCC}</span>
                      <span className="comparison-value stored">{selectedVehicle.originalEngineCC || selectedVehicle.engineCC}</span>
                    </div>
                    <div className="comparison-item">
                      <span className="comparison-label">Fuel Type</span>
                      <span className="comparison-value user">{selectedVehicle.fuelType}</span>
                      <span className="comparison-value stored">{selectedVehicle.originalFuelType || selectedVehicle.fuelType}</span>
                    </div>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Transmission</span>
                    <span className="detail-value">{selectedVehicle.transmission || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Body Type</span>
                    <span className="detail-value">{selectedVehicle.bodyType || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Age for Calculation</span>
                    <span className="detail-value">{new Date().getFullYear() - selectedVehicle.year} years</span>
                  </div>
                </div>

                {selectedVehicle.crsp && (
                  <div className="pricing-section">
                    <div className="price-row highlight">
                      <span>CRSP Retail Price (Base)</span>
                      <strong>KES {selectedVehicle.crsp.retailPrice?.toLocaleString()}</strong>
                    </div>
                    <div className="price-row">
                      <span>Customs Value (Reference)</span>
                      <strong>KES {selectedVehicle.crsp.customsValue?.toLocaleString()}</strong>
                    </div>
                    <div className="price-row">
                      <span>CRSP Month</span>
                      <strong>{selectedVehicle.crsp.month || 'N/A'}</strong>
                    </div>
                  </div>
                )}

                <div className="info-note warning">
                  <span className="note-icon">⚠️</span>
                  <span className="note-text">
                    Tax calculation will use YOUR values: Year {selectedVehicle.year}, Engine {selectedVehicle.engineCC}cc, Fuel {selectedVehicle.fuelType}
                  </span>
                </div>

                <div className="action-buttons">
                  <button onClick={resetSearch} className="btn-outline">
                    Search Again
                  </button>
                  <button onClick={handleCalculateTax} className="btn-primary">
                    Calculate Tax
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Searching database...</p>
          </div>
        )}

        {/* No Results State */}
        {searchPerformed && !loading && vehicles.length === 0 && !error && (
          <div className="no-results-card">
            <div className="no-results-icon">
              <Car size={48} />
            </div>
            <h3>No Variants Found</h3>
            <p>No variants found for {formData.make} {formData.model}. Please try a different model.</p>
            <button onClick={resetSearch} className="btn-primary">Clear Search</button>
          </div>
        )}
      </div>

      <style>{`
        .vehicle-lookup-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6b7280;
          font-size: 14px;
        }

        .search-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
        }

        .form-group select,
        .form-group input {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }

        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-button {
          display: flex;
        }

        .btn-search {
          width: 100%;
          padding: 10px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-search:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-search:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-note {
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 10px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #0369a1;
        }

        .results-note {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 10px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #92400e;
        }

        .error-card {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #dc2626;
          margin-bottom: 24px;
        }

        .btn-link {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          margin-left: auto;
          text-decoration: underline;
        }

        .results-section {
          margin-bottom: 24px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .vehicle-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .vehicle-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: #667eea;
        }

        .vehicle-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .vehicle-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
        }

        .year-badge {
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
        }

        .vehicle-specs {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .fuel-badge {
          padding: 2px 8px;
          border-radius: 6px;
        }

        .fuel-badge.petrol { background: #dbeafe; color: #1e40af; }
        .fuel-badge.diesel { background: #fef3c7; color: #92400e; }
        .fuel-badge.hybrid { background: #dcfce7; color: #166534; }
        .fuel-badge.electric { background: #e0e7ff; color: #3730a3; }

        .vehicle-price {
          font-weight: 600;
          color: #10b981;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .user-inputs-note {
          font-size: 11px;
          color: #667eea;
          background: #eef2ff;
          padding: 4px 8px;
          border-radius: 6px;
          margin: 8px 0;
          text-align: center;
        }

        .select-btn {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .select-btn:hover {
          background: #667eea;
          color: white;
        }

        .selected-vehicle-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .selected-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .selected-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .selected-info {
          flex: 1;
        }

        .selected-info h2 {
          margin-bottom: 4px;
        }

        .selected-info p {
          font-size: 13px;
          color: #6b7280;
        }

        .comparison-section {
          margin-bottom: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .comparison-section h4 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 14px;
          color: #374151;
        }

        .comparison-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .comparison-item {
          display: grid;
          grid-template-columns: 100px 1fr 1fr;
          gap: 10px;
          font-size: 13px;
          padding: 8px;
          background: white;
          border-radius: 8px;
        }

        .comparison-label {
          font-weight: 600;
          color: #6b7280;
        }

        .comparison-value.user {
          color: #059669;
          font-weight: 500;
        }

        .comparison-value.stored {
          color: #6b7280;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
        }

        .detail-value {
          font-weight: 600;
        }

        .pricing-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .price-row.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          border-radius: 8px;
          margin: -8px -8px 8px -8px;
        }

        .info-note {
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #0369a1;
        }

        .info-note.warning {
          background: #fef3c7;
          border-color: #fde68a;
          color: #92400e;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .btn-outline {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-outline:hover {
          background: #f3f4f6;
        }

        .btn-primary {
          padding: 10px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-outline-small {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .no-results-card {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
        }

        .no-results-icon {
          margin-bottom: 20px;
          color: #9ca3af;
        }

        .loading-card {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .selected-header {
            flex-wrap: wrap;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .comparison-item {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default VehicleLookup;