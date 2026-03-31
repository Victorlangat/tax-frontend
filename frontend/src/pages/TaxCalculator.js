import React, { useState, useEffect } from 'react';
import { Icon } from '../components/common/Icons';
import taxCalc from '../services/taxCalculation.js';

const TaxCalculator = () => {
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState({
    vehicleValue: '',
    shippingCost: '',
    insuranceCost: '',
    additionalCosts: ''
  });
  const [taxParams, setTaxParams] = useState({
    isDirectImport: true,
    hsCode: '',
    age: 0,
    engineCC: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedVehicle = sessionStorage.getItem('selected_vehicle');
    if (savedVehicle) {
      try {
        const vehicle = JSON.parse(savedVehicle);
        if (!vehicle.crsp) {
          setError('The selected vehicle does not have CRSP data. Please go back and select a valid vehicle.');
          setVehicle(null);
        } else {
          setVehicle(vehicle);
          const age = new Date().getFullYear() - vehicle.year || 0;
          setTaxParams({
            isDirectImport: true,
            hsCode: vehicle.hsCode || '',
            age,
            engineCC: vehicle.engineCC || ''
          });
        }
      } catch (err) {
        setError('Invalid vehicle data. Please select a vehicle again.');
      }
    } else {
      setError('No vehicle selected. Please find a vehicle first.');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (['isDirectImport', 'hsCode', 'age', 'engineCC'].includes(name)) {
      setTaxParams(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateTax = () => {
    if (!vehicle || !vehicle.crsp) {
      setError('No valid vehicle with CRSP data selected.');
      return;
    }

    setLoading(true);
    setError('');

    const crspRetailPrice = parseFloat(inputs.vehicleValue) || vehicle.crsp.retailPrice;
    const shippingCost = parseFloat(inputs.shippingCost) || 0;
    const insuranceCost = parseFloat(inputs.insuranceCost) || 0;
        const additionalCosts = parseFloat(inputs.additionalCosts) || 0;
        const cifAdditional = shippingCost + insuranceCost + additionalCosts;

    const calculationInputs = {
      crspRetailPrice,
      age: parseInt(taxParams.age) || 0,
      engineCC: parseInt(taxParams.engineCC) || vehicle.engineCC || 1500,
      isDirectImport: taxParams.isDirectImport,
      hsCode: taxParams.hsCode,
      shippingCost,
      insuranceCost,
      additionalCosts
    };

    const calcResult = taxCalc(calculationInputs);

    const calculationResult = {
      vehicle,
      inputs: {
        ...inputs,
        crspRetailPrice,
        ...taxParams,
        cifAdditional: shippingCost + insuranceCost + additionalCosts,
        shippingCost,
        insuranceCost,
        additionalCosts
      },
      result: calcResult,
      breakdown: [
{ 
          label: `Customs Value (${calcResult.category.name}, Retention ${((100 - taxCalc.getDepreciationRate(taxParams.isDirectImport ? 'direct' : 'prev', parseInt(taxParams.age)) || 0) / 100 * 100).toFixed(0)}% )`, 
          value: calcResult.customsValue, 
          percentage: (calcResult.category.baseCustomsPct * 100).toFixed(1)
        },
        { label: `Import Duty (${calcResult.taxes.rates.importDuty}%)`, value: calcResult.taxes.importDuty, percentage: calcResult.taxes.rates.importDuty },
        { label: `Excise Duty (${calcResult.taxes.rates.exciseDuty}%)`, value: calcResult.taxes.exciseDuty, percentage: calcResult.taxes.rates.exciseDuty },
        { label: `VAT (${calcResult.taxes.rates.vat}%)`, value: calcResult.taxes.vat, percentage: calcResult.taxes.rates.vat },
        { label: `IDF (${calcResult.taxes.rates.idf}%)`, value: calcResult.taxes.idf, percentage: calcResult.taxes.rates.idf },
        { label: `RDL (${calcResult.taxes.rates.rdl}%)`, value: calcResult.taxes.rdl, percentage: calcResult.taxes.rates.rdl }
      ],
      totals: {
        crspRetail: crspRetailPrice,
        cifAdditional,
        customsValue: calcResult.customsValue,
        totalTax: calcResult.summary.totalTax,
        totalLandedCost: calcResult.summary.totalLandedCost
      },
      referenceId: `TAX-${Date.now().toString().slice(-6)}`,
      calculatedAt: new Date().toLocaleString()
    };

    setResults(calculationResult);
    setLoading(false);
  };

  const saveCalculation = () => {
    if (!results) return;

    const saved = JSON.parse(localStorage.getItem('smarttax_calculations') || '[]');
    saved.push(results);
    localStorage.setItem('smarttax_calculations', JSON.stringify(saved));

    alert('Calculation saved! You can view it in Dashboard.');
  };

  const resetCalculator = () => {
    if (window.confirm('Reset all inputs?')) {
      setInputs({
        vehicleValue: '',
        shippingCost: '',
        insuranceCost: '',
        additionalCosts: ''
      });
      setResults(null);
    }
  };

  return (
    <div className="tax-calculator">
      <div className="page-header">
        <h1>Tax Calculator - KRA 2025</h1>
        <p>Accurate import duties and taxes based on official guidelines</p>
      </div>

      {error && (
        <div className="error-banner">
          <Icon name="warning" className="error-icon" />
          <span>{error}</span>
          <button className="btn btn-link" onClick={() => window.location.href = '/vehicle-lookup'}>
            Go to Vehicle Lookup
          </button>
        </div>
      )}

      <div className="calculator-grid">
        <div className="calculator-column">
          <div className="input-section">
            {vehicle ? (
              <div className="selected-vehicle">
                <div className="vehicle-header">
                  <h3>Selected Vehicle</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => window.location.href = '/vehicle-lookup'}>
                    Change
                  </button>
                </div>
                <div className="vehicle-details">
                  <div className="vehicle-info">
                    <span className="vehicle-make">{vehicle.make} {vehicle.model}</span>
                    <span className="vehicle-year">{vehicle.year} • {vehicle.engineCC}cc</span>
                  </div>
                  <div className="vehicle-pricing">
                    <div className="price-row">
                      <span>CRSP Value:</span>
                      <strong>KES {vehicle.crsp.retailPrice?.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-vehicle">
                <Icon name="car" className="no-vehicle-icon" />
                <h3>No Vehicle Selected</h3>
                <p>Please select a vehicle first</p>
                <a href="/vehicle-lookup" className="btn btn-primary">
                  Find Vehicle
                </a>
              </div>
            )}
          </div>

          <div className="tax-params-section">
            <h3>Tax Parameters</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Import Type</label>
                <select name="isDirectImport" value={taxParams.isDirectImport} onChange={handleInputChange} className="form-input">
                  <option value={true}>Direct Import</option>
                  <option value={false}>Previously Registered</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age (years)</label>
                <input type="number" name="age" value={taxParams.age} onChange={handleInputChange} className="form-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Engine CC</label>
                <input type="number" name="engineCC" value={taxParams.engineCC} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>HS Code (optional)</label>
                <input type="text" name="hsCode" value={taxParams.hsCode} onChange={handleInputChange} className="form-input" />
              </div>
            </div>

            <div className="cost-inputs">
              <h4>Additional Costs</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Shipping</label>
                  <input type="number" name="shippingCost" value={inputs.shippingCost} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Insurance</label>
                  <input type="number" name="insuranceCost" value={inputs.insuranceCost} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
              <input type="number" name="vehicleValue" value={inputs.vehicleValue} onChange={handleInputChange} className="form-input" placeholder="CRSP override (optional)" />
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn btn-outline" onClick={resetCalculator} disabled={loading}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={calculateTax} disabled={!vehicle || loading}>
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
          </div>
        </div>

        <div className="calculator-column">
          {results ? (
            <div className="results-section">
              <div className="results-header">
                <Icon name="success" className="success-icon" />
                <h3>Calculation Complete</h3>
                <p>Ref: {results.referenceId} | {results.calculatedAt}</p>
              </div>

              <div className="summary-card">
                <div className="summary-row">
                  <span>CRSP Retail:</span>
                  <strong>KES {results.totals.crspRetail?.toLocaleString()}</strong>
                </div>
                <div className="summary-row">
                  <span>Customs Value:</span>
                  <strong>KES {results.totals.customsValue.toLocaleString()}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total Tax:</span>
                  <strong className="total-tax">KES {results.totals.totalTax.toLocaleString()}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total Landed:</span>
                  <strong>KES {results.totals.totalLandedCost.toLocaleString()}</strong>
                </div>
              </div>

              <div className="breakdown">
                <h4>Tax Breakdown</h4>
                {results.breakdown.map((item, index) => (
                  <div key={index} className="breakdown-row">
                    <span>{item.label}</span>
                    <strong>KES {item.value.toLocaleString()}</strong>
                    <small>{item.percentage}%</small>
                  </div>
                ))}
              </div>

              <div className="results-actions">
                <button className="btn btn-primary" onClick={saveCalculation}>
                  Save Calculation
                </button>
                <button className="btn btn-secondary" onClick={() => setResults(null)}>
                  Calculate Again
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-results">
              <Icon name="calculate" className="empty-icon" />
              <h3>Ready to Calculate</h3>
              <p>Configure parameters and click Calculate Tax</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;

