import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCRSP, saveCRSPData, deleteCRSP } from '../services/crspService';
import * as XLSX from 'xlsx';
import './MyCRSP.css';

// ==================== Excel Parsing Helpers ====================

const monthMap = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12'
};

const extractMonthFromSheetName = (sheetName) => {
  const lower = sheetName.toLowerCase();
  let month = null, year = null;
  for (const [name, num] of Object.entries(monthMap)) {
    if (lower.includes(name)) { month = num; break; }
  }
  const yearMatch = sheetName.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) year = yearMatch[0];
  if (month && year) return `${year}-${month}`;
  return null;
};

const normalize = (str) => (str?.toString().trim().replace(/\s+/g, ' ') ?? '').toLowerCase();

const parseNumber = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[,$\sKES]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const guessColumnMapping = (headers) => {
  const mapping = { 
    make: null, model: null, year: null, engineCC: null, 
    fuelType: null, transmission: null, bodyType: null, retailPrice: null 
  };
  headers.forEach((header, idx) => {
    const h = normalize(header);
    if (h.includes('make') || h.includes('manufacturer') || h.includes('brand')) mapping.make = idx;
    if (h.includes('model') && !h.includes('number')) mapping.model = idx;
    if (h.includes('year') || h.includes('yom')) mapping.year = idx;
    if (h.includes('engine') || h.includes('capacity') || h.includes('cc')) mapping.engineCC = idx;
    if (h.includes('fuel')) mapping.fuelType = idx;
    if (h.includes('transmission') || h.includes('gear')) mapping.transmission = idx;
    if (h.includes('body') || h.includes('type')) mapping.bodyType = idx;
    if (h.includes('crsp') || h.includes('price') || h.includes('kes')) mapping.retailPrice = idx;
  });
  return mapping;
};

const isHeaderRow = (row) => {
  if (!row || row.length === 0) return false;
  const keywords = ['make', 'model', 'year', 'engine', 'fuel', 'body', 'price', 'crsp', 'transmission'];
  let matchCount = 0;
  for (let cell of row) {
    const str = normalize(cell);
    if (keywords.some(k => str.includes(k))) matchCount++;
    if (matchCount >= 3) return true;
  }
  return false;
};

const isManufacturerRow = (row) => {
  if (!row || row.length === 0) return false;
  const first = row[0]?.toString().trim();
  if (!first) return false;
  const hasOther = row.slice(1).some(cell => cell?.toString().trim() !== '');
  if (hasOther) return false;
  const upper = first.toUpperCase();
  if (first !== upper) return false;
  const commonHeaders = ['make', 'model', 'year', 'engine', 'fuel', 'body', 'price', 'crsp', 'transmission'];
  const lower = first.toLowerCase();
  if (commonHeaders.some(h => lower.includes(h))) return false;
  return true;
};

const parseFlatTable = (worksheet, sheetName) => {
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (json.length < 2) return [];

  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(20, json.length); i++) {
    const row = json[i];
    if (row && isHeaderRow(row)) { headerRowIndex = i; break; }
  }
  if (headerRowIndex === -1) return [];

  const headers = json[headerRowIndex].map(h => h?.toString().trim() || '');
  const mapping = guessColumnMapping(headers);
  const dataRows = json.slice(headerRowIndex + 1);
  const month = extractMonthFromSheetName(sheetName) || new Date().toISOString().slice(0, 7);

  const results = [];
  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;
    const make = mapping.make !== null ? row[mapping.make]?.toString().trim() : null;
    const model = mapping.model !== null ? (row[mapping.model]?.toString().trim() || '') : null;
    if (!make || !model) return;

    const year = mapping.year !== null ? parseInt(row[mapping.year]) : new Date().getFullYear();
    const engineCC = mapping.engineCC !== null ? parseNumber(row[mapping.engineCC]) : 1500;
    const fuel = mapping.fuelType !== null ? (row[mapping.fuelType]?.toString().trim() || 'petrol') : 'petrol';
    const transmission = mapping.transmission !== null ? (row[mapping.transmission]?.toString().trim() || 'automatic') : 'automatic';
    const body = mapping.bodyType !== null ? (row[mapping.bodyType]?.toString().trim() || 'sedan') : 'sedan';
    const price = mapping.retailPrice !== null ? parseNumber(row[mapping.retailPrice]) : 0;
    if (price === 0) return;

    results.push({
      make, model,
      year: isNaN(year) ? new Date().getFullYear() : year,
      engineCC, fuelType: fuel.toLowerCase(),
      transmission: transmission.toLowerCase(),
      bodyType: body.toLowerCase(),
      retailPrice: price, month
    });
  });
  return results;
};

const parseSectionedTable = (worksheet, sheetName) => {
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (json.length < 2) return [];

  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, json.length); i++) {
    const row = json[i];
    if (row && isHeaderRow(row)) { headerRowIndex = i; break; }
  }
  let headers = [];
  if (headerRowIndex !== -1) {
    headers = json[headerRowIndex].map(h => h?.toString().trim() || '');
  } else {
    headerRowIndex = json.findIndex(row => row && row.length > 0 && row[0]?.toString().trim() !== '');
    if (headerRowIndex === -1) return [];
    headers = json[headerRowIndex].map(h => h?.toString().trim() || '');
  }
  const mapping = guessColumnMapping(headers);
  const month = extractMonthFromSheetName(sheetName) || new Date().toISOString().slice(0, 7);

  let currentMake = null;
  const results = [];

  for (let i = headerRowIndex + 1; i < json.length; i++) {
    const row = json[i];
    if (!row || row.length === 0) continue;
    if (isManufacturerRow(row)) {
      currentMake = row[0].toString().trim();
      continue;
    }
    if (!currentMake) continue;

    const model = mapping.model !== null ? (row[mapping.model]?.toString().trim() || '') : null;
    if (!model) continue;

    const make = currentMake;
    const year = mapping.year !== null ? parseInt(row[mapping.year]) : new Date().getFullYear();
    const engineCC = mapping.engineCC !== null ? parseNumber(row[mapping.engineCC]) : 1500;
    const fuel = mapping.fuelType !== null ? (row[mapping.fuelType]?.toString().trim() || 'petrol') : 'petrol';
    const transmission = mapping.transmission !== null ? (row[mapping.transmission]?.toString().trim() || 'automatic') : 'automatic';
    const body = mapping.bodyType !== null ? (row[mapping.bodyType]?.toString().trim() || 'sedan') : 'sedan';
    const price = mapping.retailPrice !== null ? parseNumber(row[mapping.retailPrice]) : 0;
    if (price === 0) continue;

    results.push({
      make, model,
      year: isNaN(year) ? new Date().getFullYear() : year,
      engineCC, fuelType: fuel.toLowerCase(),
      transmission: transmission.toLowerCase(),
      bodyType: body.toLowerCase(),
      retailPrice: price, month
    });
  }
  return results;
};

const parseCRSPFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let sheetName = null;
        for (const name of workbook.SheetNames) {
          const lower = name.toLowerCase();
          if (lower.includes('vehicle') || lower.includes('motor') || lower.includes('car')) {
            sheetName = name;
            break;
          }
        }
        if (!sheetName) sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        let vehicles = parseFlatTable(worksheet, sheetName);
        if (vehicles.length === 0) {
          vehicles = parseSectionedTable(worksheet, sheetName);
        }
        resolve({ vehicles, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// ==================== MyCRSP Component ====================

const MyCRSP = ({ user }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [previewData, setPreviewData] = useState([]);
  const [allPreviewData, setAllPreviewData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [crspData, setCrspData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [currentUploadTitle, setCurrentUploadTitle] = useState('');

  // Load CRSP data on mount
  useEffect(() => {
    loadCRSPData();
  }, []);

  // Load CRSP data
  const loadCRSPData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllCRSP(500);
      if (result.success) {
        setCrspData(result.crspData || []);
      } else {
        setCrspData([]);
      }
    } catch (error) {
      setError(error.message || 'Failed to load CRSP data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get vehicle info
  const getVehicleInfo = (crsp) => {
    if (crsp.vehicle) {
      return {
        make: crsp.vehicle.make,
        model: crsp.vehicle.model,
        year: crsp.vehicle.year,
        engineCC: crsp.vehicle.engineCC,
        fuelType: crsp.vehicle.fuelType,
        transmission: crsp.vehicle.transmission
      };
    }
    if (crsp.vehicleDetails) {
      return {
        make: crsp.vehicleDetails.make,
        model: crsp.vehicleDetails.model,
        year: crsp.vehicleDetails.year,
        engineCC: crsp.vehicleDetails.engineCC,
        fuelType: crsp.vehicleDetails.fuelType,
        transmission: crsp.vehicleDetails.transmission
      };
    }
    return { make: '-', model: '-', year: '-', engineCC: 1500, fuelType: 'petrol', transmission: 'automatic' };
  };

  // Handle lookup button click
  const handleLookupVehicle = (crsp) => {
    const vehicleInfo = getVehicleInfo(crsp);
    sessionStorage.setItem('lookup_vehicle', JSON.stringify(vehicleInfo));
    navigate('/vehicle-lookup');
  };

// Handle delete CRSP
  const handleDeleteCRSP = async (crspId) => {
    if (!window.confirm('Are you sure you want to delete this CRSP entry?')) {
      return;
    }
    
    setDeleting(crspId);
    try {
      await deleteCRSP(crspId);
      setUploadMessage({
        type: 'success',
        text: 'CRSP entry deleted successfully!'
      });
      // Refresh the list
      loadCRSPData();
    } catch (error) {
      setUploadMessage({
        type: 'error',
        text: error.message || 'Failed to delete CRSP entry'
      });
    } finally {
      setDeleting(null);
    }
  };

  // Handle delete all invalid entries (without Make/Model)
  const handleDeleteInvalidEntries = async () => {
    const invalidEntries = crspData.filter(crsp => {
      const make = crsp.vehicle ? crsp.vehicle.make : (crsp.vehicleDetails?.make || '');
      const model = crsp.vehicle ? crsp.vehicle.model : (crsp.vehicleDetails?.model || '');
      return !make || make === '-' || !model || model === '-';
    });
    
    if (invalidEntries.length === 0) {
      setUploadMessage({
        type: 'success',
        text: 'No invalid entries found!'
      });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${invalidEntries.length} entries with missing Make/Model data?`)) {
      return;
    }
    
    setDeleting('all-invalid');
    try {
      // Delete each invalid entry
      for (const crsp of invalidEntries) {
        await deleteCRSP(crsp._id);
      }
      setUploadMessage({
        type: 'success',
        text: `Successfully deleted ${invalidEntries.length} entries with missing Make/Model data!`
      });
      // Refresh the list
      loadCRSPData();
    } catch (error) {
      setUploadMessage({
        type: 'error',
        text: error.message || 'Failed to delete invalid entries'
      });
    } finally {
      setDeleting(null);
    }
  };

  // Count invalid entries
  const invalidCount = crspData.filter(crsp => {
    const make = crsp.vehicle ? crsp.vehicle.make : (crsp.vehicleDetails?.make || '');
    const model = crsp.vehicle ? crsp.vehicle.model : (crsp.vehicleDetails?.model || '');
    return !make || make === '-' || !model || model === '-';
  }).length;

  // File validation
  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadMessage({ type: 'error', text: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.' });
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File is too large. Maximum size is 10MB.' });
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    setUploadMessage({ type: '', text: '' });
    setPreviewData([]);
    setAllPreviewData([]);
    
    if (!file) return;
    
    if (!validateFile(file)) {
      return;
    }
    
    setSelectedFile(file);
    setCurrentFileName(file.name);
    previewFile(file);
  };

  // Preview file data
  const previewFile = async (file) => {
    setUploading(true);
    
    try {
      const { vehicles, sheetName } = await parseCRSPFile(file);
      
      if (vehicles.length === 0) {
        setUploadMessage({ type: 'error', text: 'No valid vehicle data found in the file.' });
        setSelectedFile(null);
        setCurrentFileName('');
        setUploading(false);
        return;
      }
      
      setAllPreviewData(vehicles);
      setPreviewData(vehicles.slice(0, 50));
      setCurrentUploadTitle(sheetName);
      
      setUploadMessage({
        type: 'success',
        text: `Found ${vehicles.length} vehicles from "${sheetName}". Review and click "Save to Database" to store all records.`
      });
    } catch (error) {
      setUploadMessage({ type: 'error', text: error.message || 'Failed to parse file' });
      setSelectedFile(null);
      setCurrentFileName('');
    }
    
    setUploading(false);
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    if (allPreviewData.length === 0) {
      setUploadMessage({ type: 'error', text: 'No data to save. Please select a file first.' });
      return;
    }
    
    setSaving(true);
    setUploadMessage({ type: '', text: '' });
    
    try {
      const result = await saveCRSPData(allPreviewData);
      
      setUploadMessage({
        type: 'success',
        text: `Successfully saved "${currentUploadTitle}"! Created: ${result.created || 0}, Updated: ${result.updated || 0} vehicles.`
      });
      
      // Reset form
      setSelectedFile(null);
      setCurrentFileName('');
      setPreviewData([]);
      setAllPreviewData([]);
      setCurrentUploadTitle('');
      
      // Clear file input
      document.getElementById('crsp-file-input').value = '';
      
      // Refresh the CRSP data
      loadCRSPData();
    } catch (error) {
      setUploadMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to save CRSP data'
      });
    }
    
    setSaving(false);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setCurrentFileName('');
    setPreviewData([]);
    setAllPreviewData([]);
    setCurrentUploadTitle('');
    setUploadMessage({ type: '', text: '' });
    document.getElementById('crsp-file-input').value = '';
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(value).replace('KES', 'KSh ');
  };

  return (
    <div className="my-crsp-page">
      <div className="page-header">
        <h1>My CRSP</h1>
        <p>Manage Kenya Revenue Authority (KRA) customs reference pricing data</p>
      </div>

      {/* Error/Success Message */}
      {error && <div className="alert alert-error">{error}</div>}
      {uploadMessage.text && (
        <div className={`alert alert-${uploadMessage.type}`}>
          {uploadMessage.type === 'success' && <span className="alert-icon">✓</span>}
          {uploadMessage.type === 'error' && <span className="alert-icon">✕</span>}
          {uploadMessage.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-header">
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="upload-title">
              <h2>Upload CRSP File</h2>
              <p>Import vehicle pricing data from Excel or CSV files</p>
            </div>
          </div>

          <div className="upload-area">
            <input
              type="file"
              id="crsp-file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={uploading || saving}
              className="file-input"
            />
            <label htmlFor="crsp-file-input" className="file-drop-zone">
              {currentFileName ? (
                <div className="selected-file">
                  <div className="file-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name">{currentFileName}</span>
                    <span className="file-size">
                      {selectedFile ? (selectedFile.size / 1024).toFixed(2) + ' KB' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="drop-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="drop-text">Click to browse or drag and drop</p>
                  <p className="drop-hint">Supports .xlsx, .xls, .csv files up to 10MB</p>
                </>
              )}
            </label>
          </div>

          {/* Action Buttons */}
          {previewData.length > 0 && (
            <div className="upload-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveToDatabase}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save to Database
                  </>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClear}
                disabled={saving}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Format Requirements */}
        <div className="format-info">
          <h3>Expected File Format</h3>
          <div className="format-grid">
            <div className="format-item">
              <span className="format-label">Required Columns:</span>
              <span className="format-value">Make, Model, Year, Retail Price (CRSP)</span>
            </div>
            <div className="format-item">
              <span className="format-label">Optional Columns:</span>
              <span className="format-value">Engine Capacity, Fuel Type, Transmission, Body Type</span>
            </div>
            <div className="format-item">
              <span className="format-label">Supported Formats:</span>
              <span className="format-value">.xlsx, .xls, .csv</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewData.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h2>Data Preview - {currentUploadTitle}</h2>
            <span className="preview-count">
              Showing {previewData.length} of {allPreviewData.length} records
            </span>
          </div>
          
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Engine</th>
                  <th>Body Type</th>
                  <th>Fuel</th>
                  <th>Transmission</th>
                  <th>Month</th>
                  <th>Retail Price</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((vehicle, index) => (
                  <tr key={index}>
                    <td>{vehicle.make}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.engineCC} cc</td>
                    <td className="capitalize">{vehicle.bodyType}</td>
                    <td className="capitalize">{vehicle.fuelType}</td>
                    <td className="capitalize">{vehicle.transmission}</td>
                    <td>{vehicle.month || '-'}</td>
                    <td className="price">{formatCurrency(vehicle.retailPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {allPreviewData.length > 50 && (
            <p className="preview-note">
              <em>Only showing first 50 rows. All {allPreviewData.length} records will be saved.</em>
            </p>
          )}
        </div>
      )}

      {/* CRSP Data List Section */}
      <div className="crsp-list-section">
        <div className="section-header">
          <h2>Saved CRSP Data</h2>
          <div className="section-actions">
            {invalidCount > 0 && (
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteInvalidEntries}
                disabled={deleting === 'all-invalid'}
                title={`Delete ${invalidCount} entries with missing Make/Model`}
              >
                {deleting === 'all-invalid' ? 'Deleting...' : `Delete Invalid (${invalidCount})`}
              </button>
            )}
            <button className="btn btn-secondary" onClick={loadCRSPData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading CRSP data...</div>
        ) : crspData.filter(crsp => {
          // Filter out entries without valid Make and Model
          const make = crsp.vehicle ? crsp.vehicle.make : (crsp.vehicleDetails?.make || '');
          const model = crsp.vehicle ? crsp.vehicle.model : (crsp.vehicleDetails?.model || '');
          return make && make !== '-' && model && model !== '-';
        }).length > 0 ? (
          <div className="crsp-table-container">
            <table className="crsp-table">
              <thead>
                <tr>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th>Retail Price</th>
                  <th>Customs Value</th>
                  <th>Source</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {crspData
                  .filter(crsp => {
                    // Filter out entries without valid Make and Model
                    const make = crsp.vehicle ? crsp.vehicle.make : (crsp.vehicleDetails?.make || '');
                    const model = crsp.vehicle ? crsp.vehicle.model : (crsp.vehicleDetails?.model || '');
                    return make && make !== '-' && model && model !== '-';
                  })
                  .map((crsp) => (
                  <tr key={crsp._id}>
                    <td>{crsp.vehicle ? crsp.vehicle.make : (crsp.vehicleDetails?.make || '-')}</td>
                    <td>{crsp.vehicle ? crsp.vehicle.model : (crsp.vehicleDetails?.model || '-')}</td>
                    <td>{crsp.vehicle ? crsp.vehicle.year : (crsp.vehicleDetails?.year || '-')}</td>
                    <td>{crsp.month || '-'}</td>
                    <td>{formatCurrency(crsp.retailPrice)}</td>
                    <td>{formatCurrency(crsp.customsValue)}</td>
                    <td><span className={'source-badge source-' + crsp.source}>{crsp.source}</span></td>
                    <td>{crsp.createdAt ? new Date(crsp.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleLookupVehicle(crsp)}>
                        Lookup
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteCRSP(crsp._id)}
                        disabled={deleting === crsp._id}
                      >
                        {deleting === crsp._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No CRSP data available. Upload a file to get started.</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {uploading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Parsing file...</p>
        </div>
      )}
    </div>
  );
};

export default MyCRSP;
