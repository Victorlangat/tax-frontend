// src/pages/TaxCalculator.js - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const TaxCalculator = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
  const [calculationName, setCalculationName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Tax calculation helper functions
  const getDepreciationRate = (importType, age) => {
    if (importType === 'direct') {
      if (age <= 1) return 10;
      if (age <= 3) return 30;
      if (age <= 6) return 50;
      return 65;
    } else {
      if (age <= 1) return 15;
      if (age <= 3) return 35;
      if (age <= 6) return 55;
      return 70;
    }
  };

  const getTaxCategory = (engineCC) => {
    if (engineCC <= 1000) return { name: 'Small Engine', multiplier: 1.0, exciseRate: 20 };
    if (engineCC <= 1500) return { name: 'Medium Engine', multiplier: 1.2, exciseRate: 25 };
    if (engineCC <= 2000) return { name: 'Large Engine', multiplier: 1.5, exciseRate: 30 };
    if (engineCC <= 3000) return { name: 'Premium Engine', multiplier: 2.0, exciseRate: 35 };
    return { name: 'Luxury Engine', multiplier: 2.5, exciseRate: 40 };
  };

  const calculateVehicleTax = (calculationInputs) => {
    const { crspRetailPrice, age, engineCC, isDirectImport } = calculationInputs;
    
    const depreciationRate = getDepreciationRate(isDirectImport ? 'direct' : 'prev', age);
    const retentionPct = (100 - depreciationRate) / 100;
    const customsValue = crspRetailPrice * retentionPct;
    
    const category = getTaxCategory(engineCC);
    const importDuty = customsValue * 0.35;
    const exciseDuty = (customsValue + importDuty) * (category.exciseRate / 100);
    const vat = (customsValue + importDuty + exciseDuty) * 0.16;
    const idf = customsValue * 0.025;
    const rdl = customsValue * 0.02;
    const totalTax = importDuty + exciseDuty + vat + idf + rdl;
    const totalLandedCost = customsValue + totalTax;
    
    return {
      customsValue,
      importDuty,
      exciseDuty,
      vat,
      idf,
      rdl,
      totalTax,
      totalLandedCost,
      category,
      depreciationRate,
      retentionPct
    };
  };

  useEffect(() => {
    const savedVehicle = sessionStorage.getItem('selected_vehicle');
    if (savedVehicle) {
      try {
        const vehicleData = JSON.parse(savedVehicle);
        if (!vehicleData.crsp) {
          setError('The selected vehicle does not have CRSP data. Please go back and select a valid vehicle.');
          setVehicle(null);
        } else {
          setVehicle(vehicleData);
          const age = new Date().getFullYear() - (vehicleData.year || new Date().getFullYear());
          const engineCC = vehicleData.engineCC || '';
          setTaxParams({
            isDirectImport: true,
            hsCode: vehicleData.hsCode || '',
            age: age > 0 ? age : 0,
            engineCC: engineCC
          });
          setCalculationName(`${vehicleData.make} ${vehicleData.model} Tax Calculation`);
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

    const calculationInputs = {
      crspRetailPrice,
      age: parseInt(taxParams.age) || 0,
      engineCC: parseInt(taxParams.engineCC) || vehicle.engineCC || 1500,
      isDirectImport: taxParams.isDirectImport
    };

    const calcResult = calculateVehicleTax(calculationInputs);
    const depreciationRate = getDepreciationRate(
      taxParams.isDirectImport ? 'direct' : 'prev',
      parseInt(taxParams.age)
    );

    const calculationResult = {
      vehicle,
      inputs: {
        ...inputs,
        crspRetailPrice,
        ...taxParams,
        shippingCost,
        insuranceCost,
        additionalCosts
      },
      breakdown: [
        { label: `Customs Value (${depreciationRate}% depreciation)`, value: calcResult.customsValue, rate: depreciationRate },
        { label: `Import Duty (35%)`, value: calcResult.importDuty, rate: 35 },
        { label: `Excise Duty (${calcResult.category.exciseRate}%)`, value: calcResult.exciseDuty, rate: calcResult.category.exciseRate },
        { label: `VAT (16%)`, value: calcResult.vat, rate: 16 },
        { label: `IDF (2.5%)`, value: calcResult.idf, rate: 2.5 },
        { label: `RDL (2%)`, value: calcResult.rdl, rate: 2 }
      ],
      totals: {
        crspRetail: crspRetailPrice,
        customsValue: calcResult.customsValue,
        totalTax: calcResult.totalTax,
        totalLandedCost: calcResult.totalLandedCost
      },
      referenceId: `TAX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      calculatedAt: new Date().toISOString()
    };

    setResults(calculationResult);
    setLoading(false);
    setSaveSuccess(false);
  };

  const saveCalculationToDatabase = async () => {
    if (!results) {
      alert('No calculation results to save. Please calculate tax first.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert('Please login to save calculations');
        setSaving(false);
        return;
      }

      console.log('=== SAVING TO SUPABASE ===');
      console.log('User ID:', user.id);
      console.log('Results total tax:', results.totals?.totalTax);

      const calculationData = {
        user_id: user.id,
        reference_id: `CALC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: calculationName || `${results.vehicle?.make || 'Vehicle'} ${results.vehicle?.model || ''} Calculation`,
        description: `Tax calculation for ${results.vehicle?.make || ''} ${results.vehicle?.model || ''}`,
        inputs: {
          make: results.vehicle?.make,
          model: results.vehicle?.model,
          year: results.vehicle?.year,
          engineCC: results.inputs?.engineCC || results.vehicle?.engineCC,
          age: results.inputs?.age,
          crspRetailPrice: results.totals?.crspRetail,
          shippingCost: results.inputs?.shippingCost,
          insuranceCost: results.inputs?.insuranceCost,
          additionalCosts: results.inputs?.additionalCosts,
          isDirectImport: results.inputs?.isDirectImport
        },
        results: {
          totalTax: results.totals?.totalTax || 0,
          totalCost: results.totals?.totalLandedCost || 0,
          customsValue: results.totals?.customsValue || 0,
          importDuty: results.breakdown?.[1]?.value || 0,
          exciseDuty: results.breakdown?.[2]?.value || 0,
          vat: results.breakdown?.[3]?.value || 0,
          idf: results.breakdown?.[4]?.value || 0,
          rdl: results.breakdown?.[5]?.value || 0
        },
        rates: {
          importDuty: 35,
          exciseDuty: results.breakdown?.[2]?.rate || 25,
          vat: 16,
          idf: 2.5,
          rdl: 2
        },
        summary: {
          totalTax: results.totals?.totalTax || 0,
          totalLandedCost: results.totals?.totalLandedCost || 0,
          effectiveTaxRate: results.totals?.totalTax && results.totals?.crspRetail 
            ? ((results.totals.totalTax / results.totals.crspRetail) * 100).toFixed(1)
            : '0'
        },
        status: 'saved',
        is_saved: true,
        saved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        tags: [results.vehicle?.make, results.vehicle?.model].filter(Boolean),
        metadata: {
          vehicleMake: results.vehicle?.make || 'Unknown',
          vehicleModel: results.vehicle?.model || 'Unknown',
          vehicleYear: results.vehicle?.year || new Date().getFullYear(),
          calculationDate: new Date().toISOString(),
          calculationMethod: 'KRA 2025 Guidelines'
        }
      };

      console.log('Inserting data:', calculationData);

      const { data, error: insertError } = await supabase
        .from('calculations')
        .insert(calculationData)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message);
      }

      console.log('✅ Save successful!', data);
      
      setSaveSuccess(true);
      setShowSaveModal(false);
      alert(`✅ Calculation "${calculationData.name}" saved successfully! View it in your dashboard.`);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('❌ Save error:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
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
      setSaveSuccess(false);
    }
  };

  const viewDashboard = () => {
    navigate('/dashboard');
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'KES 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="tax-calculator-page" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Tax Calculator - KRA 2025
        </h1>
        <p style={{ color: '#6b7280' }}>Accurate import duties and taxes based on official guidelines</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '24px', color: '#dc2626' }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', marginLeft: 'auto' }} onClick={() => navigate('/vehicle-lookup')}>
            Go to Vehicle Lookup →
          </button>
        </div>
      )}

      {saveSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '24px', color: '#166534' }}>
          <span>✅</span>
          <span>Calculation saved successfully! <button style={{ background: 'none', border: 'none', color: '#166534', textDecoration: 'underline', cursor: 'pointer' }} onClick={viewDashboard}>View in Dashboard →</button></span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left Column - Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0 }}>Selected Vehicle</h3>
              {vehicle && (
                <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => navigate('/vehicle-lookup')}>
                  Change
                </button>
              )}
            </div>
            {vehicle ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '32px' }}>🚗</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>{vehicle.make} {vehicle.model}</h4>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{vehicle.year} • {vehicle.engineCC}cc • {vehicle.fuelType}</p>
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>CRSP Value:</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(vehicle.crsp?.retailPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                <p>No vehicle selected</p>
                <button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }} onClick={() => navigate('/vehicle-lookup')}>
                  Find Vehicle
                </button>
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3>Tax Parameters</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Import Type</label>
              <select name="isDirectImport" value={taxParams.isDirectImport} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <option value={true}>Direct Import</option>
                <option value={false}>Previously Registered</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Age (years)</label>
                <input type="number" name="age" value={taxParams.age} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} min="0" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Engine CC</label>
                <input type="number" name="engineCC" value={taxParams.engineCC} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>HS Code (optional)</label>
              <input type="text" name="hsCode" value={taxParams.hsCode} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="e.g., 8703.24.90" />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3>Additional Costs</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Shipping Cost (KES)</label>
              <input type="number" name="shippingCost" value={inputs.shippingCost} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="0" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Insurance Cost (KES)</label>
              <input type="number" name="insuranceCost" value={inputs.insuranceCost} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="0" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Additional Costs (KES)</label>
              <input type="number" name="additionalCosts" value={inputs.additionalCosts} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="0" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>CRSP Override (optional)</label>
              <input type="number" name="vehicleValue" value={inputs.vehicleValue} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="Override CRSP value" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1 }} onClick={resetCalculator} disabled={loading}>
              Reset
            </button>
            <button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1 }} onClick={calculateTax} disabled={!vehicle || loading}>
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {results ? (
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>Calculation Complete</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total Tax: {formatCurrency(results.totals.totalTax)}</p>
                  </div>
                </div>
                {!saveSuccess && (
                  <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} onClick={() => setShowSaveModal(true)} disabled={saving}>
                    💾 Save Calculation
                  </button>
                )}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.8 }}>CRSP Retail</span>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(results.totals.crspRetail)}</span>
                  </div>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.8 }}>Customs Value</span>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(results.totals.customsValue)}</span>
                  </div>
                  <div style={{ textAlign: 'center', color: 'white', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px' }}>
                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.8 }}>Total Tax</span>
                    <span style={{ fontSize: '22px', fontWeight: '700' }}>{formatCurrency(results.totals.totalTax)}</span>
                  </div>
                  <div style={{ textAlign: 'center', color: 'white', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px' }}>
                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.8 }}>Total Landed</span>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(results.totals.totalLandedCost)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px' }}>Tax Breakdown</h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', background: '#f9fafb', padding: '12px 16px', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>Description</div>
                    <div>Amount (KES)</div>
                    <div>Rate</div>
                  </div>
                  {results.breakdown.map((item, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                      <div>{item.label}</div>
                      <div style={{ fontWeight: '600', color: '#059669' }}>{formatCurrency(item.value)}</div>
                      <div style={{ color: '#6b7280' }}>{item.rate}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1 }} onClick={resetCalculator}>
                  Calculate Again
                </button>
                <button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1 }} onClick={() => setShowSaveModal(true)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Calculation'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 40px', background: 'white', borderRadius: '20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧮</div>
              <h3>Ready to Calculate</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Configure parameters and click Calculate Tax</p>
              <div style={{ textAlign: 'left', background: '#f9fafb', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
                <p style={{ fontWeight: '600', margin: '0 0 8px', color: '#4b5563' }}>Tips:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '13px' }}>
                  <li>Vehicle age affects depreciation</li>
                  <li>Engine CC determines tax category</li>
                  <li>Add shipping and insurance for accurate CIF value</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSaveModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', width: '450px', maxWidth: '90%', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0 }}>Save Calculation</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowSaveModal(false)}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }}>Calculation Name</label>
                <input type="text" value={calculationName} onChange={(e) => setCalculationName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="Enter a name for this calculation" />
              </div>
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                <p style={{ margin: '0 0 8px' }}><strong>Vehicle:</strong> {vehicle?.make} {vehicle?.model}</p>
                <p style={{ margin: '0 0 8px' }}><strong>Total Tax:</strong> {formatCurrency(results?.totals.totalTax)}</p>
                <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleString()}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
              <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }} onClick={saveCalculationToDatabase} disabled={saving}>
                {saving ? 'Saving...' : 'Save Calculation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;