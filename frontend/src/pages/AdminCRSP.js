import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { 
  getAllCRSP, 
  saveCRSPData, 
  deleteCRSP,
  loadSampleCRSP 
} from '../services/crspService';
import '../styles/pages/admin.css';

const AdminCRSP = () => {
  const [crspData, setCrspData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engineCC: '',
    fuelType: 'petrol',
    transmission: 'automatic',
    retailPrice: '',
    bodyType: 'sedan',
    trim: ''
  });

  // Bulk import state
  const [bulkData, setBulkData] = useState('');
  const [importing, setImporting] = useState(false);

  // Load CRSP data on mount
  useEffect(() => {
    loadCRSPData();
  }, []);

  // Filter data when search term changes
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = crspData.filter(v => {
        const vehicle = v.vehicle || v.vehicleDetails || {};
        return (
          (vehicle.make || '').toLowerCase().includes(term) ||
          (vehicle.model || '').toLowerCase().includes(term) ||
          (vehicle.year || '').toString().includes(term) ||
          (v.month || '').includes(term) ||
          (v.retailPrice || 0).toString().includes(term)
        );
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(crspData);
    }
  }, [searchTerm, crspData]);

  const loadCRSPData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllCRSP(1000);
      if (response.success) {
        setCrspData(response.crspData || []);
        setFilteredData(response.crspData || []);
      }
    } catch (err) {
      console.error('Error loading CRSP:', err);
      setError('Failed to load CRSP data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddVehicle = async () => {
    // Validation
    if (!formData.make || !formData.model || !formData.retailPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = [{
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || new Date().getFullYear(),
        engineCC: parseInt(formData.engineCC) || 1500,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        bodyType: formData.bodyType,
        retailPrice: parseFloat(formData.retailPrice),
        month: new Date().toISOString().slice(0, 7),
        trim: formData.trim
      }];

      const response = await saveCRSPData(vehicleData);
      
      if (response.success) {
        setSuccessMessage(`Added ${response.results?.created || 1} vehicle(s) successfully!`);
        setShowAddModal(false);
        resetForm();
        loadCRSPData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      alert('Error adding vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    const v = vehicle.vehicle || vehicle.vehicleDetails || {};
    setFormData({
      id: vehicle._id,
      make: v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      engineCC: v.engineCC || '',
      fuelType: v.fuelType || 'petrol',
      transmission: v.transmission || 'automatic',
      bodyType: v.bodyType || 'sedan',
      retailPrice: vehicle.retailPrice || '',
      trim: v.trim || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateVehicle = async () => {
    if (!formData.make || !formData.model || !formData.retailPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = [{
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || new Date().getFullYear(),
        engineCC: parseInt(formData.engineCC) || 1500,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        bodyType: formData.bodyType,
        retailPrice: parseFloat(formData.retailPrice),
        month: new Date().toISOString().slice(0, 7),
        trim: formData.trim
      }];

      const response = await saveCRSPData(vehicleData);
      
      if (response.success) {
        setSuccessMessage('Vehicle updated successfully!');
        setShowEditModal(false);
        resetForm();
        loadCRSPData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      alert('Error updating vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedVehicle || !selectedVehicle._id) return;

    setLoading(true);
    try {
      await deleteCRSP(selectedVehicle._id);
      setSuccessMessage('Vehicle deleted successfully!');
      setShowDeleteModal(false);
      loadCRSPData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert('Error deleting vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      alert('Please paste CSV data');
      return;
    }

    setImporting(true);
    try {
      // Parse CSV data
      const lines = bulkData.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const vehicles = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 4) continue;

        const vehicle = {};
        headers.forEach((h, idx) => {
          vehicle[h] = values[idx];
        });

        // Map to our format
        if (vehicle.make && vehicle.model && vehicle.retailprice) {
          vehicles.push({
            make: vehicle.make,
            model: vehicle.model,
            year: parseInt(vehicle.year) || new Date().getFullYear(),
            engineCC: parseInt(vehicle.enginecc) || 1500,
            fuelType: vehicle.fueltype || 'petrol',
            transmission: vehicle.transmission || 'automatic',
            bodyType: vehicle.bodytype || 'sedan',
            retailPrice: parseFloat(vehicle.retailprice.replace(/[^0-9.]/g, '')),
            month: vehicle.month || new Date().toISOString().slice(0, 7)
          });
        }
      }

      if (vehicles.length === 0) {
        alert('No valid vehicles found in the data');
        return;
      }

      const response = await saveCRSPData(vehicles);
      
      if (response.success) {
        setSuccessMessage(`Imported ${vehicles.length} vehicles successfully!`);
        setShowBulkModal(false);
        setBulkData('');
        loadCRSPData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      alert('Error importing data: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (crspData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Make', 'Model', 'Year', 'Engine CC', 'Fuel Type', 'Transmission', 'Body Type', 'Retail Price', 'Month'];
    const rows = crspData.map(v => {
      const vehicle = v.vehicle || v.vehicleDetails || {};
      return [
        vehicle.make || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.engineCC || '',
        vehicle.fuelType || '',
        vehicle.transmission || '',
        vehicle.bodyType || '',
        v.retailPrice || '',
        v.month || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crsp-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = 'make,model,year,enginecc,fueltype,transmission,bodytype,retailprice,month\nToyota,Vitz,2025,1500,petrol,automatic,hatchback,1850000,2025-07';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crsp-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLoadSample = async () => {
    if (!confirm('This will load sample CRSP data. Continue?')) return;
    
    setLoading(true);
    try {
      const response = await loadSampleCRSP();
      setSuccessMessage(response.message || 'Sample data loaded!');
      loadCRSPData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert('Error loading sample: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      engineCC: '',
      fuelType: 'petrol',
      transmission: 'automatic',
      retailPrice: '',
      bodyType: 'sedan',
      trim: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Get unique months for stats
  const uniqueMonths = [...new Set(crspData.map(v => v.month).filter(Boolean))];
  const latestMonth = uniqueMonths.sort().reverse()[0] || 'N/A';

  return (
    <div className="admin-crsp-page">
      <Header 
        title="CRSP Administration"
        subtitle="Manage Current Retail Selling Price database"
        searchEnabled={true}
        onSearch={setSearchTerm}
        breadcrumbs={['Dashboard', 'Admin', 'CRSP Management']}
      />
      
      <Sidebar />
      
      <main className="main-content">
        <div className="content-container">
          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
              <Button variant="secondary" size="small" onClick={loadCRSPData}>
                Retry
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="crsp-stats">
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">🚗</div>
                <div className="stat-info">
                  <h3>Total Vehicles</h3>
                  <div className="stat-value">{crspData.length}</div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Latest Month</h3>
                  <div className="stat-value">{latestMonth}</div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <h3>Data Sources</h3>
                  <div className="stat-value">{uniqueMonths.length}</div>
                </div>
              </div>
            </Card>
            
            <Card className="stat-card" padding>
              <div className="stat-content">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Filtered Results</h3>
                  <div className="stat-value">{filteredData.length}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="action-bar">
            <div className="action-group">
              <Button variant="primary" icon="➕" onClick={openAddModal}>
                Add Vehicle
              </Button>
              <Button variant="secondary" icon="📋" onClick={() => setShowBulkModal(true)}>
                Bulk Import
              </Button>
              <Button variant="secondary" icon="📤" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
            <div className="action-group">
              <Button variant="info" icon="🔄" onClick={handleLoadSample} loading={loading}>
                Load Sample Data
              </Button>
              <Button variant="secondary" icon="🔄" onClick={loadCRSPData} loading={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {/* CRSP Table */}
          <div className="crsp-table-section">
            <Card title={`CRSP Database (${filteredData.length} vehicles)`} icon="📋" padding>
              {loading ? (
                <div className="loading-data">
                  <div className="loading-spinner"></div>
                  <p>Loading CRSP data...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">🚗</div>
                  <h3>No Vehicles Found</h3>
                  <p>Add vehicles manually or import from CSV</p>
                  <Button variant="primary" onClick={openAddModal}>Add First Vehicle</Button>
                </div>
              ) : (
                <div className="crsp-table">
                  <div className="table-header">
                    <div className="table-cell">Make & Model</div>
                    <div className="table-cell">Year</div>
                    <div className="table-cell">Engine</div>
                    <div className="table-cell">Fuel</div>
                    <div className="table-cell">Transmission</div>
                    <div className="table-cell">Retail Price</div>
                    <div className="table-cell">Month</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  
                  {filteredData.slice(0, 100).map((vehicle, index) => {
                    const v = vehicle.vehicle || vehicle.vehicleDetails || {};
                    return (
                      <div key={vehicle._id || index} className="table-row">
                        <div className="table-cell cell-vehicle">
                          <span className="vehicle-icon">🚗</span>
                          <div className="vehicle-info">
                            <span className="vehicle-make">{v.make}</span>
                            <span className="vehicle-model">{v.model} {v.trim || ''}</span>
                          </div>
                        </div>
                        
                        <div className="table-cell">{v.year}</div>
                        
                        <div className="table-cell">{v.engineCC} cc</div>
                        
                        <div className="table-cell">
                          <span className="fuel-badge">{v.fuelType}</span>
                        </div>
                        
                        <div className="table-cell">{v.transmission}</div>
                        
                        <div className="table-cell cell-crsp">
                          KES {(vehicle.retailPrice || 0).toLocaleString()}
                        </div>
                        
                        <div className="table-cell">{vehicle.month}</div>
                        
                        <div className="table-cell cell-actions">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleEditVehicle(vehicle)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteClick(vehicle)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
        
        <Footer />
      </main>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vehicle"
        size="large"
      >
        <div className="vehicle-form">
          <div className="form-grid">
            <Input
              label="Make *"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              placeholder="e.g., Toyota"
              required
            />
            <Input
              label="Model *"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g., Vitz"
              required
            />
            <Input
              label="Year *"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="2025"
              required
            />
            <Input
              label="Engine CC"
              name="engineCC"
              type="number"
              value={formData.engineCC}
              onChange={handleInputChange}
              placeholder="1500"
            />
            <div className="form-col">
              <label className="form-label">Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">Body Type</label>
              <select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="pickup">Pickup</option>
                <option value="van">Van</option>
                <option value="wagon">Wagon</option>
                <option value="coupe">Coupe</option>
                <option value="convertible">Convertible</option>
              </select>
            </div>
            <Input
              label="CRSP Value (KES) *"
              name="retailPrice"
              type="number"
              value={formData.retailPrice}
              onChange={handleInputChange}
              placeholder="1850000"
              required
            />
            <Input
              label="Trim Level"
              name="trim"
              value={formData.trim}
              onChange={handleInputChange}
              placeholder="e.g., GL, GLS"
            />
          </div>
          
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddVehicle} loading={loading}>
              Add Vehicle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Vehicle"
        size="large"
      >
        <div className="vehicle-form">
          <div className="form-grid">
            <Input
              label="Make *"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Model *"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Year *"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Engine CC"
              name="engineCC"
              type="number"
              value={formData.engineCC}
              onChange={handleInputChange}
            />
            <div className="form-col">
              <label className="form-label">Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">Body Type</label>
              <select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleInputChange}
                className="smarttax-select"
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="pickup">Pickup</option>
                <option value="van">Van</option>
                <option value="wagon">Wagon</option>
                <option value="coupe">Coupe</option>
                <option value="convertible">Convertible</option>
              </select>
            </div>
            <Input
              label="CRSP Value (KES) *"
              name="retailPrice"
              type="number"
              value={formData.retailPrice}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Trim Level"
              name="trim"
              value={formData.trim}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateVehicle} loading={loading}>
              Update Vehicle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Vehicle"
        size="small"
      >
        <div className="delete-modal">
          <div className="warning-icon">⚠️</div>
          <h3>Are you sure?</h3>
          <p>
            This will permanently delete this vehicle from the CRSP database.
            This action cannot be undone.
          </p>
          {selectedVehicle && (
            <div className="delete-preview">
              {(selectedVehicle.vehicle || selectedVehicle.vehicleDetails)?.make} {' '}
              {(selectedVehicle.vehicle || selectedVehicle.vehicleDetails)?.model}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={loading}>
            Delete Permanently
          </Button>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Import Vehicles"
        size="large"
      >
        <div className="bulk-import-modal">
          <div className="bulk-instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Download the CSV template below</li>
              <li>Fill in your vehicle data following the same format</li>
              <li>Copy and paste the CSV data into the text area</li>
              <li>Click Import to add all vehicles</li>
            </ol>
            <Button variant="secondary" icon="📥" onClick={downloadTemplate}>
              Download CSV Template
            </Button>
          </div>
          
          <div className="bulk-data-input">
            <label className="form-label">Paste CSV Data:</label>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="make,model,year,enginecc,fueltype,transmission,bodytype,retailprice,month&#10;Toyota,Vitz,2025,1500,petrol,automatic,hatchback,1850000,2025-07"
              rows={10}
              className="bulk-textarea"
            />
          </div>
          
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkImport} loading={importing}>
              Import {bulkData ? bulkData.split('\n').length - 1 : 0} Vehicles
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCRSP;
