import React, { useState } from 'react';

const VehicleForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engineCC: '',
    fuelType: 'petrol',
    transmission: 'automatic'
  });

  const vehicleMakes = ['Toyota', 'Suzuki', 'Mazda', 'Honda', 'Nissan', 'Mitsubishi', 'Subaru', 'Lexus'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.make || !formData.model || !formData.engineCC) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="vehicle-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Make *</label>
          <select
            name="make"
            value={formData.make}
            onChange={handleChange}
            className="form-select"
            required
            disabled={loading}
          >
            <option value="">Select make</option>
            {vehicleMakes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Model *</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Vitz, Swift"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Year *</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="form-select"
            required
            disabled={loading}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Engine (CC) *</label>
          <input
            type="number"
            name="engineCC"
            value={formData.engineCC}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., 1300"
            required
            disabled={loading}
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
            disabled={loading}
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Transmission</label>
          <select
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="cvt">CVT</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary search-btn"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Find Vehicle'}
      </button>
    </form>
  );
};

export default VehicleForm;