import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import '../../styles/pages/calculator.css';

const TaxCalculatorForm = ({ vehicle, onSubmit }) => {
  const [formData, setFormData] = useState({
    vehicleValue: vehicle?.customsValue || '',
    invoiceValue: '',
    shippingCost: '',
    insuranceCost: '',
    age: vehicle?.age || '',
    engineCC: vehicle?.engineCC || '',
    fuelType: vehicle?.fuelType || ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateCIF = () => {
    const vehicleValue = parseFloat(formData.vehicleValue) || 0;
    const shipping = parseFloat(formData.shippingCost) || 0;
    const insurance = parseFloat(formData.insuranceCost) || 0;
    return vehicleValue + shipping + insurance;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Calculate CIF value
    const cifValue = calculateCIF();
    
    // Prepare data for tax calculation
    const calculationData = {
      ...formData,
      cifValue,
      timestamp: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      onSubmit && onSubmit(calculationData);
      setLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    setFormData({
      vehicleValue: vehicle?.customsValue || '',
      invoiceValue: '',
      shippingCost: '',
      insuranceCost: '',
      age: vehicle?.age || '',
      engineCC: vehicle?.engineCC || '',
      fuelType: vehicle?.fuelType || ''
    });
  };

  return (
    <Card title="Tax Calculation Input" icon="🧮" padding>
      <form onSubmit={handleSubmit} className="tax-calculator-form">
        <div className="form-section">
          <h4 className="section-title">Vehicle Information</h4>
          <div className="form-grid">
            <div className="form-col">
              <Input
                label="Customs Value (KES)"
                type="number"
                name="vehicleValue"
                value={formData.vehicleValue}
                onChange={handleChange}
                placeholder="Enter customs value"
                required
                icon="💰"
              />
            </div>
            <div className="form-col">
              <Input
                label="Invoice Value (KES)"
                type="number"
                name="invoiceValue"
                value={formData.invoiceValue}
                onChange={handleChange}
                placeholder="Enter invoice value"
                required
                icon="📄"
              />
            </div>
            <div className="form-col">
              <Input
                label="Vehicle Age (Years)"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter vehicle age"
                required
                icon="📅"
              />
            </div>
            <div className="form-col">
              <Input
                label="Engine CC"
                type="number"
                name="engineCC"
                value={formData.engineCC}
                onChange={handleChange}
                placeholder="Enter engine capacity"
                required
                icon="⚙️"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Shipping & Insurance Costs</h4>
          <div className="form-grid">
            <div className="form-col">
              <Input
                label="Shipping Cost (KES)"
                type="number"
                name="shippingCost"
                value={formData.shippingCost}
                onChange={handleChange}
                placeholder="Enter shipping cost"
                required
                icon="🚢"
              />
            </div>
            <div className="form-col">
              <Input
                label="Insurance Cost (KES)"
                type="number"
                name="insuranceCost"
                value={formData.insuranceCost}
                onChange={handleChange}
                placeholder="Enter insurance cost"
                required
                icon="🛡️"
              />
            </div>
            <div className="form-col">
              <div className="calculated-value">
                <label className="form-label">CIF Value</label>
                <div className="cif-display">
                  <span className="currency">KES</span>
                  <span className="value">{calculateCIF().toLocaleString()}</span>
                </div>
                <p className="helper-text">Vehicle + Shipping + Insurance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="section-title">Fuel Type & Tax Rates</h4>
          <div className="form-grid">
            <div className="form-col">
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="smarttax-select"
                  required
                >
                  <option value="">Select Fuel Type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>
            <div className="form-col">
              <div className="tax-rate-display">
                <div className="rate-item">
                  <span className="rate-label">Import Duty</span>
                  <span className="rate-value">35%</span>
                </div>
                <div className="rate-item">
                  <span className="rate-label">Excise Duty</span>
                  <span className="rate-value">{formData.engineCC > 2500 ? '35%' : '20%'}</span>
                </div>
                <div className="rate-item">
                  <span className="rate-label">VAT</span>
                  <span className="rate-value">16%</span>
                </div>
                <div className="rate-item">
                  <span className="rate-label">IDF</span>
                  <span className="rate-value">2.5%</span>
                </div>
                <div className="rate-item">
                  <span className="rate-label">RDL</span>
                  <span className="rate-value">2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <div className="action-buttons">
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset Form
            </Button>
            <Button 
              type="submit"
              variant="success"
              loading={loading}
              icon="🧮"
            >
              Calculate Taxes
            </Button>
          </div>
          <div className="form-note">
            <p>Note: All calculations are based on KRA 2025 CRSP guidelines. Final values may vary based on actual verification.</p>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default TaxCalculatorForm;