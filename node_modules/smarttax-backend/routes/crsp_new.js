const express = require('express');
const router = express.Router();
const CRSP = require('../models/CRSP');
const Vehicle = require('../models/Vehicle');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/crsp';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'crsp-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, fileFilter: (req, file, cb) => cb(null, true), limits: { fileSize: 10 * 1024 * 1024 } });

const parsePrice = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[,$sKES]/g, '').trim();
  return parseFloat(cleaned) || 0;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Value normalization functions to map incoming data to valid enum values
const normalizeTransmission = (value) => {
  if (!value) return 'automatic';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'at': 'automatic',
    'aut': 'automatic',
    'auto': 'automatic',
    'automatique': 'automatic',
    'mt': 'manual',
    'man': 'manual',
    'manual': 'manual',
    'cvt': 'CVT',
    'semi-auto': 'semi-automatic',
    'semi automatic': 'semi-automatic',
    'tiptronic': 'semi-automatic'
  };
  return mapping[val] || 'automatic';
};

const normalizeFuelType = (value) => {
  if (!value) return 'petrol';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'gasoline': 'petrol',
    'gas': 'petrol',
    'petrol': 'petrol',
    'diesel': 'diesel',
    'electric': 'electric',
    'hybrid': 'hybrid',
    'plug-in hybrid': 'hybrid',
    'plugin hybrid': 'hybrid',
    'phev': 'hybrid',
    'full hybrid': 'hybrid',
    'mild hybrid': 'hybrid',
    'other': 'other'
  };
  return mapping[val] || 'petrol';
};

const normalizeBodyType = (value) => {
  if (!value) return 'sedan';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'sedan': 'sedan',
    'saloon': 'sedan',
    'hatchback': 'hatchback',
    'hatch': 'hatchback',
    'suv': 'SUV',
    'jeep': 'SUV',
    'crossover': 'SUV',
    'mpv': 'van',
    'van': 'van',
    'wagon': 'van',
    'estate': 'van',
    's. wagon': 'van',
    'station wagon': 'van',
    'coupe': 'other',
    'coupé': 'other',
    'convertible': 'other',
    'cabrio': 'other',
    'roadster': 'other',
    'truck': 'truck',
    'pickup': 'truck',
    'bus': 'bus',
    'minibus': 'bus',
    'other': 'other'
  };
  return mapping[val] || 'sedan';
};

// @route   POST /api/crsp/upload
// @desc    Upload CRSP Excel/CSV file with smart column detection
// @access  Public
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    let sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'No data found' });
    }

    // Find header row
    const headerKeywords = ['make', 'model', 'year', 'price', 'crsp', 'engine', 'fuel', 'body', 'transmission'];
    let headerRowIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
      const matchCount = headerKeywords.filter(keyword => rowStr.includes(keyword)).length;
      if (matchCount >= 2) {
        headerRowIndex = i;
        headers = row.map(h => String(h || '').trim().toLowerCase());
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
    }
    
    // Smart column detection
    const findCol = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
    const columnMap = {
      make: findCol(['make', 'manufacturer', 'brand', 'brand name', 'mfr']) || headers.findIndex(h => h.includes('brand')),
      model: findCol(['model', 'model name']) || headers.findIndex(h => h.includes('model')),
      year: findCol(['year', 'yom', 'yr', 'year of mfr']) || headers.findIndex(h => /year/i.test(h)),
      retailPrice: findCol(['crsp', 'price', 'retail', 'kes', 'value', 'retail value']) || headers.findIndex(h => /price|value|kes/i.test(h)),
      engineCC: findCol(['engine', 'capacity', 'cc', 'engine cc']) || headers.findIndex(h => h.includes('cc') || h.includes('engine')),
      fuelType: findCol(['fuel', 'fuel type']) || headers.findIndex(h => h.includes('fuel')),
      transmission: findCol(['transmission', 'gear', 'trans']) || -1,
      bodyType: findCol(['body', 'type', 'body type', 'body style']) || -1
    };
    
    // Log for debug
    console.log('Enhanced column mapping:', columnMap);
    
    // Return preview if ?preview=true
    if (req.query.preview === 'true') {
      const previewVehicles = [];
      dataRows.slice(0, 5).forEach((row) => {
        if (!row || row.length < 1) return;
        const preview = {};
        Object.keys(columnMap).forEach(key => {
          const col = columnMap[key];
          preview[key] = col >= 0 ? String(row[col] || '').trim() : 'MISSING';
        });
        previewVehicles.push(preview);
      });
      return res.json({ success: true, preview: previewVehicles, headers, columnMap });
    }

    console.log('Detected headers:', headers);
    console.log('Column mapping:', columnMap);

    const vehicles = [];
    const currentYear = new Date().getFullYear();
    const dataRows = jsonData.slice(headerRowIndex + 1);
    
    dataRows.forEach((row) => {
      if (!row || row.length < 1) return;
      
      const make = columnMap.make >= 0 ? String(row[columnMap.make] || '').trim() : '';
      const model = columnMap.model >= 0 ? String(row[columnMap.model] || '').trim() : '';
      
      if (!make || !model) return;
      
      // Parse year - must be between 1990 and current year + 1
      let year = currentYear;
      if (columnMap.year >= 0 && row[columnMap.year]) {
        const parsedYear = parseInt(row[columnMap.year]);
        if (!isNaN(parsedYear) && parsedYear >= 1990 && parsedYear <= currentYear + 1) {
          year = parsedYear;
        }
      }
      
      // Parse retail price
      let retailPrice = 0;
      if (columnMap.retailPrice >= 0 && row[columnMap.retailPrice]) {
        retailPrice = parseFloat(String(row[columnMap.retailPrice]).replace(/[,$KES\s]/g, ''));
      }
      if (isNaN(retailPrice) || retailPrice <= 0) return;
      
      const engineCC = columnMap.engineCC >= 0 ? parseInt(row[columnMap.engineCC]) || 1500 : 1500;
      // Normalize values to match the Vehicle model enum
      const fuelTypeRaw = columnMap.fuelType >= 0 ? String(row[columnMap.fuelType] || 'petrol').toLowerCase() : 'petrol';
      const transmissionRaw = columnMap.transmission >= 0 ? String(row[columnMap.transmission] || 'automatic').toLowerCase() : 'automatic';
      const bodyTypeRaw = columnMap.bodyType >= 0 ? String(row[columnMap.bodyType] || 'sedan').toLowerCase() : 'sedan';

      const fuelType = normalizeFuelType(fuelTypeRaw);
      const transmission = normalizeTransmission(transmissionRaw);
      const bodyType = normalizeBodyType(bodyTypeRaw);

      vehicles.push({
        make, model, year, retailPrice, 
        customsValue: retailPrice * 0.65, 
        month: new Date().toISOString().slice(0, 7), 
        engineCC, fuelType, transmission, bodyType 
      });
    });

    fs.unlinkSync(filePath);

    if (vehicles.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid vehicle data found. Please check your Excel file has columns: Make, Model, Year, Price/CRSP' });
    }

    console.log('Parsed ' + vehicles.length + ' vehicles from uploaded file');

    const User = require('../models/User');
    let systemUser = await User.findOne({ role: 'admin' }).maxTimeMS(5000);
    if (!systemUser) systemUser = await User.findOne();
    if (!systemUser) { 
      systemUser = await User.create({ name: 'System Admin', email: 'admin@smarttax.go.ke', password: 'admin123', role: 'admin' }); 
    }
    const systemUserId = systemUser ? systemUser._id : null;
    
    const results = { created: 0, updated: 0, skipped: 0 };
    
    for (const v of vehicles) {
      let vehicle = await Vehicle.findOne({ 
        make: { $regex: new RegExp('^' + escapeRegex(v.make) + '$', 'i') }, 
        model: { $regex: new RegExp('^' + escapeRegex(v.model) + '$', 'i') }, 
        year: v.year 
      });
      
      if (!vehicle) { 
        try {
          vehicle = await Vehicle.create({ 
            make: v.make, model: v.model, year: v.year, 
            engineCC: v.engineCC, fuelType: v.fuelType, 
            transmission: v.transmission, bodyType: v.bodyType 
          });
        } catch (vehError) {
          console.log('Vehicle creation error:', vehError.message);
          results.skipped++;
          continue;
        }
      }
      
      const existingCRSP = await CRSP.findOne({ vehicle: vehicle._id, month: v.month, isActive: true });
      
      const crspData = {
        vehicleDetails: { 
          make: v.make, model: v.model, year: v.year, 
          engineCC: v.engineCC, fuelType: v.fuelType, 
          transmission: v.transmission, bodyType: v.bodyType 
        },
        vehicle: vehicle._id,
        month: v.month,
        retailPrice: v.retailPrice,
        wholesalePrice: v.retailPrice * 0.9,
        customsValue: v.customsValue,
        depreciation: { year1: 10, year2_3: 30, year4_6: 50, year7_8: 65 },
        taxRates: { importDuty: 35, exciseDuty: 20, vat: 16, idf: 2.5, rdl: 2 },
        source: 'kra',
        confidenceScore: 95,
        verification: { verified: true },
        uploadedBy: systemUserId
      };
      
      if (existingCRSP) { 
        await CRSP.findByIdAndUpdate(existingCRSP._id, crspData); 
        results.updated++; 
      } else { 
        await CRSP.create(crspData); 
        results.created++; 
      }
    }
    
    res.json({ 
      success: true, 
      message: `CRSP Upload Complete! Parsed: ${vehicles.length}, Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}. Column mapping: ${JSON.stringify(columnMap)}. Check console for details.`,
      results,
      stats: {
        parsedRows: dataRows.length,
        validVehicles: vehicles.length,
        columnMap
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) { 
      fs.unlinkSync(req.file.path); 
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crsp/all
// @desc    Get all CRSP data (public endpoint for vehicle lookup)
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const month = req.query.month; // Optional month filter (e.g., 2025-07)
    
    let query = { isActive: true };
    if (month) {
      query.month = month;
    }
    
    const crspData = await CRSP.find(query)
      .populate('vehicle')
      .sort({ month: -1, createdAt: -1 }) // Sort by month (newest first), then by createdAt
      .limit(limit);
    
    res.json({
      success: true,
      crspData,
      count: crspData.length,
      monthFilter: month || null
    });
  } catch (error) {
    console.error('Get all CRSP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crsp/sample
// @desc    Get sample CRSP data for testing
// @access  Public
router.get('/sample', async (req, res) => {
  try {
    const sampleData = [
      { make: 'Toyota', model: 'Corolla', year: 2024, retailPrice: 2500000, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Toyota', model: 'RAV4', year: 2024, retailPrice: 4200000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Honda', model: 'Civic', year: 2024, retailPrice: 2800000, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Nissan', model: 'X-Trail', year: 2024, retailPrice: 3800000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Mazda', model: 'CX-5', year: 2024, retailPrice: 3500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Volkswagen', model: 'Tiguan', year: 2024, retailPrice: 3600000, engineCC: 1400, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Ford', model: 'Explorer', year: 2024, retailPrice: 4500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'BMW', model: 'X3', year: 2024, retailPrice: 6500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Mercedes-Benz', model: 'GLC', year: 2024, retailPrice: 7000000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Audi', model: 'Q5', year: 2024, retailPrice: 5800000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' }
    ];
    
    res.json({
      success: true,
      data: sampleData,
      message: 'Sample CRSP data retrieved successfully'
    });
  } catch (error) {
    console.error('Get sample error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crsp/load-sample
// @desc    Load sample CRSP data into database
// @access  Public
router.post('/load-sample', async (req, res) => {
  try {
    const User = require('../models/User');
    let systemUser = await User.findOne({ role: 'admin' }).maxTimeMS(5000);
    if (!systemUser) systemUser = await User.findOne();
    if (!systemUser) {
      systemUser = await User.create({
        name: 'System Admin',
        email: 'admin@smarttax.go.ke',
        password: 'admin123',
        role: 'admin'
      });
    }
    const systemUserId = systemUser._id;

    const sampleVehicles = [
      { make: 'Toyota', model: 'Corolla', year: 2024, retailPrice: 2500000, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Toyota', model: 'RAV4', year: 2024, retailPrice: 4200000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Honda', model: 'Civic', year: 2024, retailPrice: 2800000, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Nissan', model: 'X-Trail', year: 2024, retailPrice: 3800000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Mazda', model: 'CX-5', year: 2024, retailPrice: 3500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Volkswagen', model: 'Tiguan', year: 2024, retailPrice: 3600000, engineCC: 1400, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Ford', model: 'Explorer', year: 2024, retailPrice: 4500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'BMW', model: 'X3', year: 2024, retailPrice: 6500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Mercedes-Benz', model: 'GLC', year: 2024, retailPrice: 7000000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Audi', model: 'Q5', year: 2024, retailPrice: 5800000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Toyota', model: 'Corolla', year: 2023, retailPrice: 2200000, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Toyota', model: 'Camry', year: 2023, retailPrice: 3000000, engineCC: 2500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Honda', model: 'Accord', year: 2023, retailPrice: 3200000, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Nissan', model: 'Altima', year: 2023, retailPrice: 2600000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan' },
      { make: 'Hyundai', model: 'Tucson', year: 2023, retailPrice: 3100000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Kia', model: 'Sportage', year: 2023, retailPrice: 2900000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Mitsubishi', model: 'Outlander', year: 2023, retailPrice: 3300000, engineCC: 2400, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Subaru', model: 'Forester', year: 2023, retailPrice: 3400000, engineCC: 2500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Volvo', model: 'XC60', year: 2023, retailPrice: 5500000, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' },
      { make: 'Lexus', model: 'RX', year: 2023, retailPrice: 7500000, engineCC: 3500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv' }
    ];

    const results = { created: 0, updated: 0 };
    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const v of sampleVehicles) {
      let vehicle = await Vehicle.findOne({
        make: { $regex: new RegExp('^' + escapeRegex(v.make) + '$', 'i') },
        model: { $regex: new RegExp('^' + escapeRegex(v.model) + '$', 'i') },
        year: v.year
      });

      if (!vehicle) {
        try {
          vehicle = await Vehicle.create({
            make: v.make,
            model: v.model,
            year: v.year,
            engineCC: v.engineCC,
            fuelType: v.fuelType,
            transmission: v.transmission,
            bodyType: v.bodyType
          });
        } catch (err) {
          console.log('Vehicle creation error:', err.message);
          continue;
        }
      }

      const existingCRSP = await CRSP.findOne({
        vehicle: vehicle._id,
        month: currentMonth,
        isActive: true
      });

      const crspData = {
        vehicleDetails: {
          make: v.make,
          model: v.model,
          year: v.year,
          engineCC: v.engineCC,
          fuelType: v.fuelType,
          transmission: v.transmission,
          bodyType: v.bodyType
        },
        vehicle: vehicle._id,
        month: currentMonth,
        retailPrice: v.retailPrice,
        wholesalePrice: v.retailPrice * 0.9,
        customsValue: v.retailPrice * 0.65,
        depreciation: { year1: 10, year2_3: 30, year4_6: 50, year7_8: 65 },
        taxRates: { importDuty: 35, exciseDuty: 20, vat: 16, idf: 2.5, rdl: 2 },
        source: 'kra',
        confidenceScore: 95,
        verification: { verified: true },
        uploadedBy: systemUserId
      };

      if (existingCRSP) {
        await CRSP.findByIdAndUpdate(existingCRSP._id, crspData);
        results.updated++;
      } else {
        await CRSP.create(crspData);
        results.created++;
      }
    }

    res.json({
      success: true,
      message: `Loaded sample data! Created: ${results.created}, Updated: ${results.updated}`,
      results
    });
  } catch (error) {
    console.error('Load sample error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crsp/save-json
// @desc    Save CRSP data from JSON (public endpoint)
// @access  Public
router.post('/save-json', async (req, res) => {
  try {
    // DEBUG: Log raw request body
    console.log('=== SAVE JSON REQUEST ===');
    console.log('Body keys:', Object.keys(req.body));
    console.log('vehicles in body:', 'vehicles' in req.body);
    console.log('req.body:', JSON.stringify(req.body).substring(0, 500));
    
    const { vehicles } = req.body;
    
    console.log('Extracted vehicles:', vehicles);
    console.log('vehicles type:', typeof vehicles);
    console.log('vehicles is array:', Array.isArray(vehicles));
    
    if (!vehicles) {
      console.log('ERROR: No vehicles in request body!');
      return res.status(400).json({ success: false, message: 'No vehicles provided - check request format' });
    }
    
    if (!Array.isArray(vehicles)) {
      console.log('ERROR: vehicles is not an array! Type:', typeof vehicles);
      return res.status(400).json({ success: false, message: 'Invalid format - vehicles must be an array' });
    }
    
    if (vehicles.length === 0) {
      return res.status(400).json({ success: false, message: 'No vehicles provided - array is empty' });
    }

    const User = require('../models/User');
    let systemUser = await User.findOne({ role: 'admin' }).maxTimeMS(5000);
    if (!systemUser) systemUser = await User.findOne();
    if (!systemUser) {
      systemUser = await User.create({
        name: 'System Admin',
        email: 'admin@smarttax.go.ke',
        password: 'admin123',
        role: 'admin'
      });
    }
    const systemUserId = systemUser._id;

    const results = { created: 0, updated: 0 };
    
    // Initialize skipped counter
    results.skipped = 0;
    
    console.log('=== SAVE JSON DEBUG ===');
    console.log('Total vehicles to save:', vehicles.length);
    console.log('First vehicle sample:', vehicles[0]);
    
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      console.log(`\nProcessing vehicle ${i + 1}:`, JSON.stringify(v));
      
      // Skip if no make or model
      if (!v.make || !v.model) {
        console.log('  SKIPPED: No make or model');
        results.skipped++;
        continue;
      }

      // Use the month from the uploaded data, or fall back to current month
      const month = v.month && /^\d{4}-\d{2}$/.test(v.month) ? v.month : new Date().toISOString().slice(0, 7);
      
      // Use default year if not provided
      const year = v.year ? parseInt(v.year) : new Date().getFullYear();
      if (isNaN(year) || year < 1990) {
        results.skipped++;
        continue;
      }

      // Use default retail price if not provided
      const retailPrice = v.retailPrice ? parseFloat(v.retailPrice) : 1000000;
      if (isNaN(retailPrice) || retailPrice <= 0) {
        results.skipped++;
        continue;
      }

      try {
        // Try to find existing vehicle - use case-insensitive exact match first
        let vehicle = await Vehicle.findOne({
          make: { $regex: new RegExp('^' + escapeRegex(v.make) + '$', 'i') },
          model: { $regex: new RegExp('^' + escapeRegex(v.model) + '$', 'i') }
        });

        // If not found, try more flexible matching (partial match)
        if (!vehicle) {
          vehicle = await Vehicle.findOne({
            make: { $regex: new RegExp(escapeRegex(v.make), 'i') },
            model: { $regex: new RegExp(escapeRegex(v.model), 'i') }
          });
        }

        if (!vehicle) {
          // Normalize values before creating the vehicle
          const normalizedFuelType = normalizeFuelType(v.fuelType);
          const normalizedTransmission = normalizeTransmission(v.transmission);
          const normalizedBodyType = normalizeBodyType(v.bodyType);
          
          // Create new vehicle
          vehicle = await Vehicle.create({
            make: v.make,
            model: v.model,
            year: year,
            engineCC: v.engineCC || 1500,
            fuelType: normalizedFuelType,
            transmission: normalizedTransmission,
            bodyType: normalizedBodyType
          });
          console.log(`Created new vehicle: ${v.make} ${v.model}`);
        }

        // Check if CRSP exists for this vehicle this month (use the month from the data)
        // Also check by vehicleDetails to catch any existing CRSP
        let existingCRSP = await CRSP.findOne({
          vehicle: vehicle._id,
          month: month,
          isActive: true
        });
        
        // If not found by vehicle ID, try finding by vehicleDetails make/model/month
        if (!existingCRSP) {
          existingCRSP = await CRSP.findOne({
            'vehicleDetails.make': { $regex: new RegExp('^' + escapeRegex(v.make) + '$', 'i') },
            'vehicleDetails.model': { $regex: new RegExp('^' + escapeRegex(v.model) + '$', 'i') },
            month: month,
            isActive: true
          });
          
          // If found by vehicleDetails, link it to the vehicle
          if (existingCRSP) {
            existingCRSP.vehicle = vehicle._id;
            await existingCRSP.save();
          }
        }

        const crspData = {
          vehicleDetails: {
            make: v.make,
            model: v.model,
            year: year,
            engineCC: v.engineCC || 1500,
            fuelType: v.fuelType || 'petrol',
            transmission: v.transmission || 'automatic',
            bodyType: v.bodyType || 'sedan'
          },
          vehicle: vehicle._id,
          month: month,
          retailPrice: retailPrice,
          wholesalePrice: retailPrice * 0.9,
          customsValue: v.customsValue || retailPrice * 0.65,
          depreciation: { year1: 10, year2_3: 30, year4_6: 50, year7_8: 65 },
          taxRates: { importDuty: 35, exciseDuty: 20, vat: 16, idf: 2.5, rdl: 2 },
          source: 'kra',
          confidenceScore: 95,
          verification: { verified: true },
          uploadedBy: systemUserId
        };

        if (existingCRSP) {
          await CRSP.findByIdAndUpdate(existingCRSP._id, crspData);
          results.updated++;
        } else {
          await CRSP.create(crspData);
          results.created++;
        }
      } catch (err) {
        console.log('Error saving vehicle:', v.make, v.model, err.message);
        results.skipped++;
      }
    }

    res.json({
      success: true,
      message: `Saved! Created: ${results.created}, Updated: ${results.updated}`,
      results
    });
  } catch (error) {
    console.error('Save JSON error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crsp/makes
// @desc    Get unique vehicle makes for dropdown (fast)
// @access  Public
router.get('/makes', async (req, res) => {
  try {
    // Fast aggregation for unique makes from vehicleDetails.make OR vehicle.make
    const makes = await CRSP.aggregate([
      {
        $addFields: {
          make: {
            $ifNull: ['$vehicleDetails.make', {
              $ifNull: ['$vehicle.make', 'Unknown']
            }]
          }
        }
      },
      {
        $match: {
          isActive: true,
          make: { $nin: [null, '', 'Unknown'] }
        }
      },
      {
        $group: {
          _id: '$make'
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $limit: 100
      }
    ]);

    const uniqueMakes = makes.map(m => m._id).sort();

    res.json({
      success: true,
      makes: uniqueMakes,
      count: uniqueMakes.length
    });
  } catch (error) {
    console.error('Get makes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crsp/health
// @desc    CRSP health check with stats
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const stats = await CRSP.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          makes: { $addToSet: '$vehicleDetails.make' },
          months: { $addToSet: '$month' }
        }
      }
    ]);

    res.json({
      success: true,
      status: stats.length > 0 ? 'healthy' : 'empty',
      totalCRSP: stats[0]?.total || 0,
      uniqueMakes: stats[0]?.makes?.length || 0,
      uniqueMonths: stats[0]?.months?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
