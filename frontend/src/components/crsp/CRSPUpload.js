import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CRSPUpload = ({ onUploadComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sampleData, setSampleData] = useState([]);
  const [url, setUrl] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState(null);

  // Load data from database on component mount
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const dbResponse = await axios.get('http://localhost:5000/api/crsp/all');
        if (dbResponse.data.success && dbResponse.data.crspData.length > 0) {
          setSampleData(dbResponse.data.crspData);
        }
      } catch (error) {
        console.log('No existing CRSP data found');
      }
    };
    fetchExistingData();
  }, []);

  const loadSampleData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Call the endpoint that ACTUALLY saves to MongoDB
      const response = await axios.post('http://localhost:5000/api/crsp/load-sample');
      
      if (response.data.success) {
        const results = response.data.results;
        setMessage({ 
          type: 'success', 
          text: `Successfully loaded ${results.created + results.updated} vehicles into the database! You can now use these for vehicle lookup and tax calculations.`
        });
        
        // Also fetch the data from database to display (using the new /all endpoint)
        const dbResponse = await axios.get('http://localhost:5000/api/crsp/all');
        if (dbResponse.data.success) {
          setSampleData(dbResponse.data.crspData);
        }
        
        if (onUploadComplete) {
          onUploadComplete(dbResponse.data.crspData);
        }
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to load sample data' });
      }
    } catch (error) {
      console.error('Load sample error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load sample data';
      setMessage({ type: 'error', text: errorMsg });
    }
    
    setLoading(false);
  };

  const fetchFromURL = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setMessage({ type: 'error', text: 'Please enter a URL' });
      return;
    }
    
    if (!year) {
      setMessage({ type: 'error', text: 'Please select a year' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('smarttax_token');
      
      const response = await axios.post('http://localhost:5000/api/crsp/fetch', 
        { url: url, year: parseInt(year) },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? 'Bearer ' + token : ''
          }
        }
      );
      
      if (response.data.success) {
        const results = response.data.results;
        setMessage({ 
          type: 'success', 
          text: 'Successfully imported CRSP data for ' + year + '! Created: ' + results.created + ', Updated: ' + results.updated 
        });
        
        setUrl('');
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to fetch CRSP data' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch CRSP data';
      setMessage({ type: 'error', text: errorMsg });
    }
    
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please select a valid Excel (.xlsx, .xls) or CSV file' });
        return;
      }
      setSelectedFile(file);
      setMessage({ type: '', text: '' });
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('smarttax_token');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post('http://localhost:5000/api/crsp/upload', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? 'Bearer ' + token : ''
          }
        }
      );
      
      if (response.data.success) {
        const results = response.data.results;
        setMessage({ 
          type: 'success', 
          text: `Successfully uploaded CRSP data! Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}`
        });
        
        // Clear the file input
        setSelectedFile(null);
        document.getElementById('crsp-file-input').value = '';
        
        // Refresh the sample data from database if callback provided
        if (onUploadComplete) {
          const dbResponse = await axios.get('http://localhost:5000/api/crsp/all');
          if (dbResponse.data.success) {
            onUploadComplete(dbResponse.data.crspData);
          }
        }
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to upload CRSP data' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to upload CRSP data';
      setMessage({ type: 'error', text: errorMsg });
    }
    
    setLoading(false);
  };

  // Helper function to get vehicle info from either vehicle ref or vehicleDetails
  const getVehicleInfo = (item) => {
    if (item.vehicle) {
      return {
        make: item.vehicle.make,
        model: item.vehicle.model,
        year: item.vehicle.year
      };
    }
    if (item.vehicleDetails) {
      return {
        make: item.vehicleDetails.make,
        model: item.vehicleDetails.model,
        year: item.vehicleDetails.year
      };
    }
    return { make: '-', model: '-', year: '-' };
  };

  const renderSampleItems = () => {
    if (sampleData.length === 0) return null;
    
    return (
      <div className="sample-items">
        <h5>Available Sample Vehicles:</h5>
        <div className="sample-grid">
          {sampleData.map((item, index) => {
            const vehicleInfo = getVehicleInfo(item);
            return (
              <div key={index} className="sample-item">
                <strong>{vehicleInfo.make} {vehicleInfo.model}</strong>
                <span>{vehicleInfo.year}</span>
                <span className="price">KES {item.retailPrice?.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="crsp-upload">
      <div className="page-header">
        <h1>CRSP Data Management</h1>
        <p>Import and manage Kenya Revenue Authority (KRA) customs reference pricing data</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="upload-options">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Processing...</p>
          </div>
        )}
        
        <div className="crsp-option">
          <h4>Quick Start - Load Sample Data</h4>
          <p>Load sample Kenya vehicle customs data instantly for testing.</p>
          <button 
            className="btn btn-primary"
            onClick={loadSampleData}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load Sample Data'}
          </button>
          
          {renderSampleItems()}
        </div>
        
        <hr />
        
        <div className="crsp-option">
          <h4>Upload Excel File</h4>
          <p>Upload your CRSP Excel file (.xlsx or .xls) directly from your computer.</p>
          
          <form onSubmit={uploadFile} className="upload-form">
            <div className="form-group">
              <label>Select File:</label>
              <input
                id="crsp-file-input"
                type="file"
                className="form-input"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !selectedFile}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
          
          <div className="help-text">
            <small>
              <strong>Supported formats:</strong> Excel (.xlsx, .xls) or CSV files<br/>
              <strong>Expected columns:</strong> Make, Model, Model number, Year, Engine Capacity, Transmission, Body Type, Fuel, CRSP (KES.)<br/>
              <strong>Note:</strong> You need to be logged in to upload files.
            </small>
          </div>
        </div>
        
        <hr />
        
        <div className="crsp-option">
          <h4>Fetch from URL</h4>
          <p>Import CRSP data from an external Excel or CSV file URL.</p>
          
          <form onSubmit={fetchFromURL} className="fetch-form">
            <div className="form-group">
              <label>CRSP File URL:</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/crsp-2024.xlsx"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Year:</label>
              <select 
                className="form-input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !url}
            >
              {loading ? 'Importing...' : 'Import from URL'}
            </button>
          </form>
          
          <div className="help-text">
            <small>
              <strong>Supported formats:</strong> Excel (.xlsx) or CSV files<br/>
              <strong>Expected columns:</strong> make, model, year, retailPrice, customsValue<br/>
              <strong>Note:</strong> You need to be logged in to use this feature.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRSPUpload;
