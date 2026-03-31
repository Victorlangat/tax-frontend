import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleLookupForm from '../components/vehicle/VehicleLookupForm';

const VehicleLookup = () => {
  const navigate = useNavigate();
const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularVehicles, setPopularVehicles] = useState([]);
  // const [availableVehicles, setAvailableVehicles] = useState([]); // unused
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [crspError, setCrspError] = useState('');
  const [corollaVariants, setCorollaVariants] = useState([
    {make: 'Toyota', model: 'Corolla', year: 2020, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic'},
    {make: 'Toyota', model: 'Corolla', year: 2019, engineCC: 1600, fuelType: 'petrol', transmission: 'manual'},
  ]);
  
  // Dynamic makes and models from CRSP data
  const [dynamicMakes, setDynamicMakes] = useState([]); 
  const [modelsByMake, setModelsByMake] = useState({});

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentVehicleSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
    fetchMakesAndModels();
  // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  // crspLoading, crspError removed - unused

  // Fetch makes from dedicated endpoint + retry
  const fetchMakesAndModels = async (retryCount = 0) => {
setLoading(true);
    setCrspError('');
    setError(''); 
    try {
      // Try dedicated makes endpoint first (fast)
      let response = await fetch('http://localhost:5000/api/crsp/makes');
      let data = await response.json();
      
      if (data.success && data.makes && data.makes.length > 0) {
        setDynamicMakes(data.makes);
        // Fetch models for first make as example
        if (data.makes.length > 0) {
          const modelsRes = await fetch(`http://localhost:5000/api/vehicles/suggestions?type=model&make=${encodeURIComponent(data.makes[0])}`);
          const modelsData = await modelsRes.json();
          setModelsByMake({ [data.makes[0]]: modelsData.suggestions || [] });
        }
        console.log('✅ Loaded', data.count, 'dynamic makes');
        return;
      }

      // Fallback to full CRSP data
      response = await fetch('http://localhost:5000/api/crsp/all?limit=200');
      data = await response.json();
      if (data.success && data.crspData && data.crspData.length > 0) {
    // uniqueMap unused
        const makesSet = new Set();
        const modelsMap = {};
        
        data.crspData.forEach(crsp => {
          const make = crsp.vehicleDetails?.make || crsp.vehicle?.make || '';
          const model = crsp.vehicleDetails?.model || crsp.vehicle?.model || '';
          
          if (make) makesSet.add(make);
          if (make && model) {
            if (!modelsMap[make]) modelsMap[make] = new Set();
            modelsMap[make].add(model);
          }
        });
        
        setDynamicMakes(Array.from(makesSet).sort());
        const modelsByMakeObj = {};
        for (const make in modelsMap) {
          modelsByMakeObj[make] = Array.from(modelsMap[make]).sort();
        }
        setModelsByMake(modelsByMakeObj);
        console.log('✅ Loaded dynamic data from CRSP');
        return;
      }

      // Health check fallback
      const healthRes = await fetch('http://localhost:5000/api/crsp/health');
      const healthData = await healthRes.json();
      if (healthData.success && healthData.totalCRSP === 0) {
        setError('CRSP database empty. Upload data via CRSP Upload page.');
      } else {
        setError('CRSP service unavailable. Using fallback data.');
      } 
    } catch (err) {
      console.error('CRSP fetch error:', err);
      if (retryCount < 3) {
        console.log(`🔄 Retrying CRSP fetch (${retryCount + 1}/3)...`);
        setTimeout(() => fetchMakesAndModels(retryCount + 1), 2000);
        return;
      }
      setCrspError('Backend unavailable. Check if server running on port 5000.');
    } finally {
setLoading(false);
    }
  };


// Load popular vehicles (no hardcoded test data)
  useEffect(() => {
    const loadPopularVehicles = async () => {
      try {
        // Load backend popular vehicles
        const response = await fetch('http://localhost:5000/api/vehicles/popular');
        const data = await response.json();
        if (data.success && data.vehicles && data.vehicles.length > 0) {
          setPopularVehicles(data.vehicles);
        }
      } catch (err) {
        console.log('Popular vehicles API unavailable, using hardcoded Corollas');
      }
    };

    loadPopularVehicles();
  }, []);

  // Load on mount + poll every 30s
  useEffect(() => {
    const saved = localStorage.getItem('recentVehicleSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
    fetchMakesAndModels();
    
    const interval = setInterval(fetchMakesAndModels, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (formData) => {
    setLoading(true);
    setError('');
    setSelectedVehicle(null);
    setSuggestions([]); 
    setSearchPerformed(true);

    // Save to recent searches
    const searchEntry = {
      make: formData.make,
      model: formData.model,
      year: formData.year,
      timestamp: new Date().toISOString()
    };
    const updatedRecent = [searchEntry, ...recentSearches.filter(
      s => !(s.make === formData.make && s.model === formData.model)
    )].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentVehicleSearches', JSON.stringify(updatedRecent));

    try {
      const response = await fetch('http://localhost:5000/api/vehicles/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Vehicle lookup failed');
      }

      if (data.success && data.vehicles?.length > 0) {
        setAllVehicles(data.vehicles);
        if (data.vehicles.length === 1) {
          setSelectedVehicle(data.vehicles[0]);
        } else {
          setError(`Found ${data.vehicles.length} matching variants - select one below:`);
        }
        setSuggestions([]);
      } else if (data.suggestions && data.vehicles && data.vehicles.length > 0) {
        setSuggestions(data.vehicles);
        setError(data.message || 'No exact match found. Please select from available vehicles below.');
      } else {
        throw new Error(data.message || 'No vehicle found. Try adjusting your search criteria.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (vehicle) => {
    const searchData = {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      engineCC: vehicle.engineCC,
      fuelType: vehicle.fuelType
    };
    handleSearch(searchData);
  };

  const handleRecentSearchClick = (search) => {
    const searchData = {
      make: search.make,
      model: search.model,
      year: search.year
    };
    handleSearch(searchData);
  };

  const handleCalculateTax = () => {
    if (selectedVehicle && selectedVehicle.crsp) {
      sessionStorage.setItem('selected_vehicle', JSON.stringify(selectedVehicle));
      navigate('/tax-calculator');
    } else {
      setError('Please select a valid vehicle with CRSP data');
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentVehicleSearches');
  };

  return (
    <div className="vehicle-lookup enhanced-lookup">
      <div className="page-header">
        <h1>🔍 Find Your Vehicle</h1>
        <p>Search the KRA database to get accurate customs valuation</p>
      </div>

      <div className="lookup-container enhanced-container">
{/* Search Form */}
        <div className="search-section">
          <VehicleLookupForm 
            onSubmit={handleSearch} 
            loading={loading}
            availableMakes={dynamicMakes}
            availableModels={modelsByMake}
          />
        </div>

        {/* Error Message */}
        {error && !allVehicles.length && (
          <div className="error-card animate-fade-in">
            <div className="error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <p>{error}</p>
          </div>
        )}

        {/* Recent Searches */}
        {!searchPerformed && recentSearches.length > 0 && (
          <div className="recent-section">
            <div className="section-header">
              <h3>📜 Recent Searches</h3>
              <button className="clear-btn" onClick={clearRecentSearches}>Clear All</button>
            </div>
            <div className="recent-grid">
              {recentSearches.map((search, index) => (
                <div 
                  key={index} 
                  className="recent-card"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <span className="recent-make">{search.make} {search.model}</span>
                  <span className="recent-year">{search.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions from API */}
        {suggestions.length > 0 && (
          <div className="suggestions-section animate-fade-in">
            <h3>🚗 Available Vehicles with CRSP Data</h3>
            <p>Select a vehicle from the list:</p>
            <div className="suggestions-grid">
              {suggestions.map((vehicle, index) => (
                <div 
                  key={index} 
                  className="suggestion-card"
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setSuggestions([]);
                    setError('');
                  }}
                >
                  <div className="card-main">
                    <strong>{vehicle.make} {vehicle.model}</strong>
                    <span className="year-tag">{vehicle.year}</span>
                  </div>
                  <div className="card-details">
                    <span>{vehicle.engineCC}cc</span>
                    <span className="fuel-tag">{vehicle.fuelType}</span>
                    {vehicle.transmission && <span className="trans-tag">{vehicle.transmission}</span>}
                  </div>
                  <div className="card-price">
                    <span>CRSP Retail: KES {(vehicle.crsp?.retailPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Vehicles + Corolla Section */}
        {!searchPerformed && (
          <div className="popular-section">
            <div className="section-header">
              <h3>⭐ Popular Vehicles</h3>

            </div>
            <div className="popular-grid">
            {/* Backend popular first */}
              {popularVehicles.map((vehicle, index) => (
                <div 
                  key={`popular-${index}`} 
                  className="popular-card"
                  onClick={() => handleQuickSelect(vehicle)}
                >
                  <div className="card-main">
                    <strong>{vehicle.make} {vehicle.model}</strong>
                    <span className="year-tag">{vehicle.year}</span>
                  </div>
                  <div className="card-details">
                    <span>{vehicle.engineCC}cc</span>
                    <span className="fuel-tag">{vehicle.fuelType}</span>
                  </div>
                  {vehicle.crsp?.retailPrice && (
                    <div className="card-price">
                      KES {vehicle.crsp.retailPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
              {/* Corolla variants */}
              {corollaVariants.map((corolla, cIndex) => (
                <div 
                  key={`corolla-${cIndex}`} 
                  className="popular-card corolla-highlight"
                  title="Hardcoded fallback - click to search"
                  onClick={() => handleQuickSelect(corolla)}
                >
                  <div className="card-main">
                    <strong>{corolla.make} {corolla.model}</strong>
                    <span className="year-tag">{corolla.year}</span>
                  </div>
                  <div className="card-details">
                    <span>{corolla.engineCC}cc</span>
                    <span className="fuel-tag">{corolla.fuelType}</span>
                  </div>
                  <div className="card-footer">
                    <small>Popular Variant</small>
                  </div>
                </div>
              ))}
              {corollaVariants.length > 0 && (
                <div className="popular-card all-corollas-btn">
                  <button 
                    className="load-all-btn"
                    onClick={() => {
                      setAllVehicles(corollaVariants);
                      setError(`Found ${corollaVariants.length} Toyota Corolla variants - select one below:`);
                      setSearchPerformed(true);
                    }}
                  >
                    📋 Load ALL {corollaVariants.length} Corolla Variants
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variants Section - Show ALL results */}
        {allVehicles.length > 0 && !selectedVehicle && (
          <div className="variants-section animate-fade-in">
            <div className="section-header">
              <h3>🎯 Found {allVehicles.length} Variants</h3>
              <div className="section-actions">
                <button 
                  className="btn btn-outline clear-results"
                  onClick={() => {
                    setAllVehicles([]);
                    setSearchPerformed(false);
                    setError('');
                  }}
                >
                  🔄 New Search
                </button>
              </div>
            </div>
            <p>Click to select your exact vehicle (showing <strong>ALL</strong> matches):</p>
            <div className="variants-grid">
              {allVehicles.slice(0, 100).map((vehicle, index) => (
                <div 
                  key={index} 
                  className="variant-card"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="card-main">
                    <strong>{vehicle.make} {vehicle.model}</strong>
                    <span className="year-tag">{vehicle.year}</span>
                  </div>
                  <div className="card-details">
                    <span>{vehicle.engineCC}cc</span>
                    <span className="fuel-tag">{vehicle.fuelType}</span>
                    {vehicle.transmission && <span className="trans-tag">{vehicle.transmission}</span>}
                    {vehicle.bodyType && <span className="body-tag">{vehicle.bodyType}</span>}
                  </div>
                  <div className="match-score">
                    Match: <strong>{vehicle.matchScore}%</strong>
                  </div>
                  <div className="card-price">
                    CRSP Retail: KES {(vehicle.crsp?.retailPrice || 0).toLocaleString()}
                  </div>
                  <button className="select-btn">Select →</button>
                </div>
              ))}
              {allVehicles.length > 100 && (
                <div className="load-more-info">
                  <p>🛑 Showing first 100 of {allVehicles.length} results for performance. 
                     All data available in backend.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {selectedVehicle && !loading && (
          <div className="results-section animate-fade-in">
            <div className="success-card">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <div>
                  <h3>Vehicle Selected!</h3>
                  <p>{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</p>
                </div>
              </div>

              <div className="vehicle-specs">
                <div className="spec-item">
                  <span className="spec-label">Engine</span>
                  <span className="spec-value">{selectedVehicle.engineCC}cc</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fuel</span>
                  <span className="spec-value">{selectedVehicle.fuelType}</span>
                </div>
{selectedVehicle.transmission && (
                  <div className="spec-item">
                    <span className="spec-label">Transmission</span>
                    <span className="spec-value">{selectedVehicle.transmission}</span>
                  </div>
                )}
{selectedVehicle.bodyType && (
                  <div className="spec-item">
                    <span className="spec-label">Body</span>
                    <span className="spec-value">{selectedVehicle.bodyType}</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Age</span>
                <span className="spec-value">{new Date().getFullYear() - selectedVehicle.year} years</span>
                </div>
              </div>

              <div className="vehicle-details">
                <div className="detail-row highlight">
                  <span>CRSP Value:</span>
                  <strong>KES {(selectedVehicle.crsp?.retailPrice || 0).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Customs Value:</span>
                  <strong>KES {(selectedVehicle.crsp?.customsValue || 0).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Wholesale Value:</span>
                  <strong>KES {(selectedVehicle.crsp?.wholesalePrice || 0).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>CRSP Month:</span>
                  <strong>{selectedVehicle.crsp?.month || 'N/A'}</strong>
                </div>
{selectedVehicle.matchScore && (
                  <div className="detail-row">
                    <span>Match Score:</span>
                    <strong className="match-badge">{selectedVehicle.matchScore}%</strong>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSelectedVehicle(null);
                    setSearchPerformed(false);
                    setError('');
                  }}
                >
                  🔄 Search Again
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCalculateTax}
                >
                  💰 Calculate Tax →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Searching KRA database...</p>
            <small>This may take a moment</small>
          </div>
        )}

        {/* No Results */}
{searchPerformed && !loading && !selectedVehicle && suggestions.length === 0 && !allVehicles.length && error && (
          <div className="no-results-card">
            <div className="no-results-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3>No Vehicles Found</h3>
            <p>We couldn't find a vehicle matching your criteria.</p>
            <div className="suggestion-tips">
              <p>Try these options:</p>
              <ul>
                <li>Check if CRSP data has been loaded from My CRSP page</li>
                <li>Try searching with just Make and Model (leave year blank)</li>
                <li>Click Popular Vehicles section for quick access</li>
              </ul>
            </div>
            <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSelectedVehicle(null);
                    setAllVehicles([]);
                    setSearchPerformed(false);
                    setError('');
                  }}
                >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-lookup .page-header {
          text-align: center;
          padding: 30px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 0;
          margin-bottom: 30px;
        }
        
        .enhanced-lookup .page-header h1 {
          margin: 0 0 10px;
          font-size: 2rem;
        }
        
        .enhanced-lookup .page-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }
        
        .enhanced-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 40px;
        }
        
        .enhanced-lookup .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .enhanced-lookup .section-header h3 {
          margin: 0;
          color: #2c3e50;
        }
        
        .clear-btn {
          background: none;
          border: none;
          color: #e74c3c;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .clear-btn:hover {
          text-decoration: underline;
        }
        
        /* Recent Section */
        .recent-section {
          margin: 25px 0;
        }
        
        .recent-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .recent-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 10px 15px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }
        
        .recent-card:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }
        
        .recent-make {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .recent-year {
          font-size: 0.85rem;
          color: #7f8c8d;
        }
        
        /* Popular Section */
        .popular-section, .suggestions-section {
          margin: 30px 0;
        }
        
        .popular-section h3, .suggestions-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .popular-grid, .suggestions-grid, .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .variant-card {
          background: white;
          border: 2px solid #667eea;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .variant-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(102, 126, 234, 0.3);
          border-color: #5a67d8;
        }

        .match-score {
          margin: 10px 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .match-score strong {
          color: #48bb78;
          font-size: 1.1rem;
        }

        .select-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .popular-card, .suggestion-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .popular-card:hover, .suggestion-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border-color: #667eea;
        }
        
        .card-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .card-main strong {
          color: #2c3e50;
          font-size: 1rem;
        }
        
        .year-tag {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
        }
        
        .card-details {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        
        .card-details span {
          font-size: 0.85rem;
          color: #7f8c8d;
        }
        
        .fuel-tag {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem !important;
        }
        
        .trans-tag {
          background: #fff3e0;
          color: #e65100;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem !important;
        }
        
        .card-price {
          font-weight: 600;
          color: #27ae60;
          font-size: 0.95rem;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }
        
        /* Results Section */
        .success-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
        
        .success-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .success-icon {
          font-size: 2.5rem;
        }
        
        .success-header h3 {
          margin: 0 0 5px;
          color: #27ae60;
        }
        
        .success-header p {
          margin: 0;
          color: #7f8c8d;
          font-size: 1.1rem;
        }
        
        .vehicle-specs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .spec-item {
          text-align: center;
        }
        
        .spec-label {
          display: block;
          font-size: 0.8rem;
          color: #7f8c8d;
          margin-bottom: 4px;
        }
        
        .spec-value {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95rem;
        }
        
        .vehicle-details {
          margin-bottom: 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-row.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .detail-row.highlight span {
          color: rgba(255,255,255,0.9);
        }
        
        .detail-row.highlight strong {
          font-size: 1.2rem;
        }
        
        .match-badge {
          background: #27ae60;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
        }
        
        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .action-buttons .btn {
          padding: 12px 30px;
          font-size: 1rem;
        }
        
        /* Loading State */
        .loading-card {
          text-align: center;
          padding: 50px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-card p {
          font-size: 1.1rem;
          color: #2c3e50;
          margin: 0 0 5px;
        }
        
        .loading-card small {
          color: #7f8c8d;
        }
        
        /* Error State */
        .error-card {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 10px;
          padding: 15px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 20px 0;
        }
        
        .error-icon {
          font-size: 1.5rem;
        }
        
        .error-card p {
          margin: 0;
          color: #c0392b;
        }
        
        /* No Results */
        .no-results-card {
          text-align: center;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 16px;
          margin-top: 20px;
        }
        
        .no-results-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }
        
        .no-results-card h3 {
          color: #2c3e50;
          margin: 0 0 10px;
        }
        
        .no-results-card > p {
          color: #7f8c8d;
          margin: 0 0 20px;
        }
        
        .suggestion-tips {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: left;
        }
        
        .suggestion-tips p {
          font-weight: 600;
          margin: 0 0 10px;
        }
        
        .suggestion-tips ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .suggestion-tips li {
          color: #7f8c8d;
          margin-bottom: 5px;
        }
        
        /* Animations */
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
          .action-buttons {
            flex-direction: column;
          }
          
          .popular-grid, .suggestions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default VehicleLookup;

