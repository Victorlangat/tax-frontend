// Python API URL - runs on port 5001
const PYTHON_API_BASE = 'http://localhost:5001/api/crsp';
const API_BASE = '/api/crsp';

// Helper to get auth headers - uses consistent key 'smarttax_token'
const getAuthHeaders = () => {
  const token = localStorage.getItem('smarttax_token');
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Handle response and extract error messages
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(data.message || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

// Upload CRSP Excel file - public endpoint (no auth required)
export const uploadCRSP = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to upload CRSP data');
  }
  return response.json();
};

// Get current user's own CRSP entries
export const getMyCRSP = async () => {
  const response = await fetch(`${API_BASE}/my`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Get latest CRSP data (official + user's own, filtered by backend) - requires auth
export const getLatestCRSP = async (limit = 20) => {
  const response = await fetch(`${API_BASE}?limit=${limit}&sortBy=month&sortOrder=desc`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// NEW: Get all CRSP data from database WITHOUT auth (public endpoint)
export const getAllCRSP = async (limit = 50) => {
  const response = await fetch(`${API_BASE}/all?limit=${limit}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to fetch CRSP data');
  }
  return response.json();
};

// NEW: Load sample CRSP data to database - public endpoint
export const loadSampleCRSP = async () => {
  const response = await fetch(`${API_BASE}/load-sample`, {
    method: 'POST'
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to load sample data');
  }
  return response.json();
};

// NEW: Fetch CRSP from URL - requires auth
export const fetchCRSPFromUrl = async (url, year) => {
  const token = localStorage.getItem('smarttax_token');
  const response = await fetch(`${API_BASE}/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ url, year })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to fetch data from URL');
  }
  return response.json();
};

// ==================== Python API Functions ====================
// These use Python's pandas for better Excel/CSV handling

// Upload CRSP using Python API
export const uploadCRSPPython = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${PYTHON_API_BASE}/upload-python`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload CRSP via Python');
  }
  return data;
};

// Load sample data using Python API
export const loadSampleCRSPPython = async () => {
  const response = await fetch(`${PYTHON_API_BASE}/load-sample-python`, {
    method: 'POST'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load sample data via Python');
  }
  return data;
};

// Get a single CRSP entry by ID
export const getCRSPById = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Delete a CRSP entry (soft delete)
export const deleteCRSP = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// NEW: Save preview data (JSON) directly to database - public endpoint
export const saveCRSPData = async (data) => {
  const response = await fetch(`${API_BASE}/save-json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ vehicles: data })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to save CRSP data');
  }
  return response.json();
};
