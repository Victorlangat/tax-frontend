import React from 'react';
import Card from '../common/Card';
import '../../styles/pages/vehicle.css';

const VehicleDetails = ({ vehicle }) => {
  if (!vehicle) {
    return (
      <Card title="Vehicle Details" icon="🚗" padding>
        <div className="vehicle-details-empty">
          <div className="empty-icon">🚗</div>
          <h3>No Vehicle Selected</h3>
          <p>Use the vehicle lookup form to find a vehicle and view its details here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Vehicle Details" icon="🚗" padding>
      <div className="vehicle-details">
        <div className="vehicle-header">
          <div className="vehicle-image-placeholder">
            <span className="vehicle-icon">🚗</span>
          </div>
          <div className="vehicle-title">
            <h3>{vehicle.make} {vehicle.model}</h3>
            <p className="vehicle-subtitle">{vehicle.trim || 'Base Model'}</p>
          </div>
        </div>

        <div className="vehicle-specs">
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Make</span>
              <span className="spec-value">{vehicle.make}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Model</span>
              <span className="spec-value">{vehicle.model}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Year</span>
              <span className="spec-value">{vehicle.year}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Trim</span>
              <span className="spec-value">{vehicle.trim || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Engine</span>
              <span className="spec-value">{vehicle.engineCC} cc</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Fuel Type</span>
              <span className="spec-value">{vehicle.fuelType}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Transmission</span>
              <span className="spec-value">{vehicle.transmission}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Age</span>
              <span className="spec-value">{2025 - vehicle.year} years</span>
            </div>
          </div>
        </div>

        <div className="vehicle-actions">
          <button className="action-btn">
            <span className="action-icon">📊</span>
            View CRSP Details
          </button>
          <button className="action-btn">
            <span className="action-icon">🧮</span>
            Calculate Taxes
          </button>
          <button className="action-btn">
            <span className="action-icon">📋</span>
            Generate Report
          </button>
        </div>
      </div>
    </Card>
  );
};

export default VehicleDetails;