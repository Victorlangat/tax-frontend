import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { uploadCRSP, getAllCRSP } from '../services/crspService';
import './CRSPUpload.css';

const CRSPUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // File validation
  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.' });
      return false;
    }
    
    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Maximum size is 10MB.' });
      return false;
    }
    
    return true;
  };

  // Parse Excel/CSV file
  const parseFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Find the first sheet with vehicle data
          let sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('vehicle') || 
            name.toLowerCase().includes('motor') ||
            name.toLowerCase().includes('crsp')
          ) || workbook.SheetNames[0];
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('No data found in the file'));
            return;
          }
          
          // Find header row
          const headerKeywords = ['make', 'model', 'year', 'engine', 'fuel', 'body', 'price', 'crsp', 'transmission'];
          let headerRowIndex = -1;
          
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
            const matchCount = headerKeywords.filter(keyword => rowStr.includes(keyword)).length;
            
            if (matchCount >= 3) {
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            headerRowIndex = 0; // Default to first row
          }
          
          const headers = jsonData[headerRowIndex].map(h => 
            String(h || '').trim().toLowerCase()
          );
          
          // Map columns
          const columnMap = {
            make: headers.findIndex(h => h.includes('make') || h.includes('manufacturer') || h.includes('brand')),
            model: headers.findIndex(h => h.includes('model') && !h.includes('number')),
            year: headers.findIndex(h => h.includes('year') || h.includes('yom')),
            engineCC: headers.findIndex(h => h.includes('engine') || h.includes('capacity') || h.includes('cc')),
            fuelType: headers.findIndex(h => h.includes('fuel')),
            transmission: headers.findIndex(h => h.includes('transmission') || h.includes('gear')),
            bodyType: headers.findIndex(h => h.includes('body') || h.includes('type')),
            retailPrice: headers.findIndex(h => h.includes('crsp') || h.includes('price') || h.includes('retail'))
          };
          
          // Parse data rows
          const vehicles = [];
          const dataRows = jsonData.slice(headerRowIndex + 1);
          
          dataRows.forEach((row, index) => {
            if (!row || row.length === 0) return;
            
            const make = columnMap.make >= 0 ? String(row[columnMap.make] || '').trim() : '';
            const model = columnMap.model >= 0 ? String(row[columnMap.model] || '').trim() : '';
            
            if (!make || !model) return;
            
            const parseNum = (val) => {
              if (!val) return 0;
              if (typeof val === 'number') return val;
              return parseFloat(String(val).replace(/[,$\sKES]/g, '')) || 0;
            };
            
            const year = columnMap.year >= 0 ? parseInt(row[columnMap.year]) : new Date().getFullYear();
            const engineCC = columnMap.engineCC >= 0 ? parseNum(row[columnMap.engineCC]) : 1500;
            const fuelType = columnMap.fuelType >= 0 ? String(row[columnMap.fuelType] || 'petrol').toLowerCase() : 'petrol';
            const transmission = columnMap.transmission >= 0 ? String(row[columnMap.transmission] || 'automatic').toLowerCase() : 'automatic';
            const bodyType = columnMap.bodyType >= 0 ? String(row[columnMap.bodyType] || 'sedan').toLowerCase() : 'sedan';
            const retailPrice = columnMap.retailPrice >= 0 ? parseNum(row[columnMap.retailPrice]) : 0;
            
            if (retailPrice > 0) {
              vehicles.push({
                make,
                model,
                year: isNaN(year) ? new Date().getFullYear() : year,
                engineCC,
                fuelType,
                transmission,
                bodyType,
                retailPrice,
                customsValue: retailPrice * 0.8, // Estimate customs value
                month: new Date().toISOString().slice(0, 7)
              });
            }
          });
          
          if (vehicles.length === 0) {
            reject(new Error('No valid vehicle data found in the file'));
            return;
          }
          
          resolve({ vehicles, sheetName });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    setMessage({ type: '', text: '' });
    setPreviewData([]);
    setAllData([]);
    
    if (!file) return;
    
    if (!validateFile(file)) {
      return;
    }
    
    setSelectedFile(file);
    setFileName(file.name);
    
    // Preview the file
    previewFile(file);
  };

  // Preview file data
  const previewFile = async (file) => {
    setIsLoading(true);
    
    try {
      const { vehicles, sheetName } = await parseFile(file);
      
      setAllData(vehicles);
      setPreviewData(vehicles.slice(0, 50));
      
      setMessage({
        type: 'success',
        text: `Found ${vehicles.length} vehicles in "${sheetName}". Review the data below and click "Upload to Database" to save.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to parse file' });
      setSelectedFile(null);
      setFileName('');
    }
    
    setIsLoading(false);
  };

  // Upload to database
  const handleUpload = async () => {
    if (allData.length === 0) {
      setMessage({ type: 'error', text: 'No data to upload. Please select a file first.' });
      return;
    }
    
    setIsUploading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await uploadCRSP(selectedFile);
      
      setMessage({
        type: 'success',
        text: `Successfully uploaded ${result.results?.created || allData.length} vehicles to the database!`
      });
      
      // Reset form
      setSelectedFile(null);
      setFileName('');
      setPreviewData([]);
      setAllData([]);
      
      // Clear file input
      document.getElementById('crsp-file-input').value = '';
      
      // Refresh the latest CRSP data
      loadLatestCRSP();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to upload CRSP data'
      });
    }
    
    setIsUploading(false);
  };

  // Load latest CRSP data
  const loadLatestCRSP = async () => {
    try {
      const result = await getAllCRSP(20);
      if (result.success) {
        // Could display recent uploads here if needed
      }
    } catch (error) {
      console.error('Failed to load latest CRSP:', error);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setFileName('');
    setPreviewData([]);
    setAllData([]);
    setMessage({ type: '', text: '' });
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
    <div className="crsp-upload-page">
      <div className="page-header">
        <h1>CRSP Upload</h1>
        <p>Upload and manage Kenya Revenue Authority (KRA) customs reference pricing data</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' && <span className="alert-icon">✓</span>}
          {message.type === 'error' && <span className="alert-icon">✕</span>}
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-header">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              disabled={isLoading || isUploading}
              className="file-input"
            />
            <label htmlFor="crsp-file-input" className="file-drop-zone">
              {fileName ? (
                <div className="selected-file">
                  <div className="file-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name">{fileName}</span>
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
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload to Database
                  </>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClear}
                disabled={isUploading}
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
            <div className="format-item">
              <span className="format-label">Note:</span>
              <span className="format-value">You need to be logged in to upload files</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewData.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h2>Data Preview</h2>
            <span className="preview-count">
              Showing {previewData.length} of {allData.length} records
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
                  <th>CRSP Price</th>
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
                    <td className="price">{formatCurrency(vehicle.retailPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {allData.length > 50 && (
            <p className="preview-note">
              <em>Only showing first 50 rows. All {allData.length} records will be uploaded.</em>
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Parsing file...</p>
        </div>
      )}
    </div>
  );
};

export default CRSPUpload;
