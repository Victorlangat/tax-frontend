const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const CRSP = require('../models/CRSP');
const { protect, roleBased } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST /api/vehicles/lookup
// @desc    Lookup vehicle – searches CRSP data directly to find vehicles
// @access  Public (no auth required)
router.post('/lookup', async (req, res) => {
  try {
    const { make, model, year, engineCC, fuelType, transmission, trim } = req.body;

    // FIRST: Search directly in CRSP data - this is what the user wants!
    // Build search criteria for vehicleDetails (the most reliable source)
    const vehicleDetailsSearch = { isActive: true };
    if (make) vehicleDetailsSearch['vehicleDetails.make'] = new RegExp(make, 'i');
    if (model) vehicleDetailsSearch['vehicleDetails.model'] = new RegExp(model, 'i');
    if (year) vehicleDetailsSearch['vehicleDetails.year'] = parseInt(year);
    if (engineCC) vehicleDetailsSearch['vehicleDetails.engineCC'] = parseInt(engineCC);
    if (fuelType) vehicleDetailsSearch['vehicleDetails.fuelType'] = fuelType;
    if (transmission) vehicleDetailsSearch['vehicleDetails.transmission'] = transmission;

    // Search CRSP with vehicleDetails criteria (this is more reliable)
    let crspResults = await CRSP.find(vehicleDetailsSearch)
      .sort({ createdAt: -1, month: -1 })
      .populate('vehicle')
      .limit(10000);

    // Also search for CRSP records with Vehicle references that match
    const vehicleRefSearch = { isActive: true };
    if (make) vehicleRefSearch['vehicle.make'] = new RegExp(make, 'i');
    if (model) vehicleRefSearch['vehicle.model'] = new RegExp(model, 'i');
    if (year) vehicleRefSearch['vehicle.year'] = parseInt(year);
    
    let crspWithVehicleRef = await CRSP.find(vehicleRefSearch)
      .sort({ createdAt: -1, month: -1 })
      .populate('vehicle')
      .limit(10000);

    // Merge results (avoid duplicates)
    const mergedResults = [...crspResults];
    for (const crsp of crspWithVehicleRef) {
      if (!mergedResults.find(r => r._id.toString() === crsp._id.toString())) {
        mergedResults.push(crsp);
      }
    }

    // Filter results to ensure they match the search criteria
    const filteredResults = mergedResults.filter(crsp => {
      // Check vehicleDetails first
      if (crsp.vehicleDetails) {
        let detailsMatch = true;
        if (make && !new RegExp(make, 'i').test(crsp.vehicleDetails.make || '')) detailsMatch = false;
        if (model && !new RegExp(model, 'i').test(crsp.vehicleDetails.model || '')) detailsMatch = false;
        if (year && crsp.vehicleDetails.year !== parseInt(year)) detailsMatch = false;
        if (detailsMatch) return true;
      }
      // Also check vehicle reference
      if (crsp.vehicle) {
        let vehicleMatch = true;
        if (make && !new RegExp(make, 'i').test(crsp.vehicle.make || '')) vehicleMatch = false;
        if (model && !new RegExp(model, 'i').test(crsp.vehicle.model || '')) vehicleMatch = false;
        if (year && crsp.vehicle.year !== parseInt(year)) vehicleMatch = false;
        return vehicleMatch;
      }
      return false;
    });

    if (filteredResults.length > 0) {
      const vehicleMap = new Map();
      for (const crsp of filteredResults) {
        // Use vehicleDetails if available, otherwise use vehicle reference
        const vehicleInfo = crsp.vehicleDetails || (crsp.vehicle ? crsp.vehicle.toObject() : null);
        
        if (!vehicleInfo) continue;

        // Create a unique key based on make + model + year
        const key = `${vehicleInfo.make}-${vehicleInfo.model}-${vehicleInfo.year}-${vehicleInfo.engineCC}-${vehicleInfo.fuelType}`;
        
        if (!vehicleMap.has(key)) {
          let matchScore = 0;
          let matchFields = 0;
          
          // Require at least make + model match to be considered a valid match
          const makeMatch = make && vehicleInfo.make && 
            (vehicleInfo.make.toLowerCase() === make.toLowerCase() || 
             vehicleInfo.make.toLowerCase().includes(make.toLowerCase()));
          const modelMatch = model && vehicleInfo.model && 
            (vehicleInfo.model.toLowerCase() === model.toLowerCase() ||
             model.toLowerCase().includes(vehicleInfo.model.toLowerCase()) ||
             vehicleInfo.model.toLowerCase().includes(model.toLowerCase()));
          
          if (makeMatch) { matchScore += 30; matchFields++; }
          if (modelMatch) { matchScore += 30; matchFields++; }
          if (year && vehicleInfo.year === parseInt(year)) { matchScore += 20; matchFields++; }
          if (engineCC && vehicleInfo.engineCC === parseInt(engineCC)) { matchScore += 10; matchFields++; }
          if (fuelType && vehicleInfo.fuelType === fuelType) { matchScore += 10; matchFields++; }
          
          // Keep ALL vehicles - no filtering
          vehicleMap.set(key, {
            _id: vehicleInfo._id || crsp._id,
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            year: vehicleInfo.year,
            engineCC: vehicleInfo.engineCC,
            fuelType: vehicleInfo.fuelType,
            transmission: vehicleInfo.transmission,
            bodyType: vehicleInfo.bodyType,
            crsp: {
              retailPrice: crsp.retailPrice,
              customsValue: crsp.customsValue,
              wholesalePrice: crsp.wholesalePrice,
              month: crsp.month,
              source: crsp.source,
              taxRates: crsp.taxRates,
              depreciation: crsp.depreciation
            },
            matchScore: Math.min(matchScore, 100)
          });
        }
      }

      const vehiclesWithCRSP = Array.from(vehicleMap.values());
      vehiclesWithCRSP.sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        success: true,
        message: 'Vehicle lookup successful',
        count: vehiclesWithCRSP.length,
        vehicles: vehiclesWithCRSP.slice(0, 20),
        searchCriteria: { make, model, year, engineCC, fuelType }
      });
    }

    // SECOND: If no CRSP match, try searching Vehicle collection as fallback
    const searchCriteria = {};
    if (make) searchCriteria.make = new RegExp(make, 'i');
    if (model) searchCriteria.model = new RegExp(model, 'i');
    if (year) searchCriteria.year = parseInt(year);
    if (engineCC) searchCriteria.engineCC = parseInt(engineCC);
    if (fuelType) searchCriteria.fuelType = fuelType;
    if (transmission) searchCriteria.transmission = transmission;
    if (trim) searchCriteria.trim = new RegExp(trim, 'i');

    let vehicles = await Vehicle.find(searchCriteria)
      .sort({ year: -1, searchCount: -1 })
        .limit(20);

    // Fuzzy search if no exact matches
    if (vehicles.length === 0 && (make || model)) {
      const fuzzyCriteria = {};
      if (make) fuzzyCriteria.make = new RegExp('^' + make, 'i');
      if (model) fuzzyCriteria.model = new RegExp('^' + model, 'i');

      vehicles = await Vehicle.find(fuzzyCriteria)
        .sort({ searchCount: -1 })
        .limit(5);
    }

    // If still no vehicles, get ALL vehicles with CRSP data to show as suggestions
    if (vehicles.length === 0) {
      const allCRSP = await CRSP.find({ isActive: true })
        .sort({ month: -1 })
        .limit(1000)
        .populate('vehicle');

      const vehicleMap = new Map();
      for (const crsp of allCRSP) {
        if (crsp.vehicle && !vehicleMap.has(crsp.vehicle._id.toString())) {
          vehicleMap.set(crsp.vehicle._id.toString(), {
            ...crsp.vehicle.toObject(),
            crsp: {
              retailPrice: crsp.retailPrice,
              customsValue: crsp.customsValue,
              wholesalePrice: crsp.wholesalePrice,
              month: crsp.month,
              source: crsp.source,
              taxRates: crsp.taxRates,
              depreciation: crsp.depreciation
            },
            matchScore: 50
          });
        }
      }
      const allVehiclesWithCRSP = Array.from(vehicleMap.values());

      if (allVehiclesWithCRSP.length > 0) {
        return res.json({
          success: true,
          message: 'No exact match found. Here are available vehicles with CRSP data:',
          count: allVehiclesWithCRSP.length,
          vehicles: allVehiclesWithCRSP.slice(0, 10),
          suggestions: true,
          searchCriteria,
          searchTerm: { make, model, year }
        });
      }
    }

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No vehicles found matching "${make} ${model}". Please load CRSP data or try a different search.`
      });
    }

    // Update search count
    await Vehicle.updateMany(
      { _id: { $in: vehicles.map(v => v._id) } },
      { $inc: { searchCount: 1 } }
    );

    // For each vehicle, fetch the most recent CRSP
    const vehiclesWithCRSP = [];
    for (const vehicle of vehicles) {
      const crsp = await CRSP.findOne({
        vehicle: vehicle._id,
        isActive: true
      }).sort({ month: -1 });

      if (crsp) {
        vehiclesWithCRSP.push({
          ...vehicle.toObject(),
          crsp: {
            retailPrice: crsp.retailPrice,
            customsValue: crsp.customsValue,
            wholesalePrice: crsp.wholesalePrice,
            month: crsp.month,
            source: crsp.source,
            taxRates: crsp.taxRates,
            depreciation: crsp.depreciation
          },
          matchScore: 100
        });
      }
    }

    // If vehicles found but none have CRSP, show all available with CRSP
    if (vehiclesWithCRSP.length === 0) {
      const allCRSP = await CRSP.find({ isActive: true })
        .sort({ month: -1 })
        .limit(1000)
        .populate('vehicle');

      const vehicleMap = new Map();
      for (const crsp of allCRSP) {
        if (crsp.vehicle && !vehicleMap.has(crsp.vehicle._id.toString())) {
          vehicleMap.set(crsp.vehicle._id.toString(), {
            ...crsp.vehicle.toObject(),
            crsp: {
              retailPrice: crsp.retailPrice,
              customsValue: crsp.customsValue,
              wholesalePrice: crsp.wholesalePrice,
              month: crsp.month,
              source: crsp.source,
              taxRates: crsp.taxRates,
              depreciation: crsp.depreciation
            },
            matchScore: 50
          });
        }
      }
      const availableWithCRSP = Array.from(vehicleMap.values());

      if (availableWithCRSP.length > 0) {
        return res.json({
          success: true,
          message: 'Your search had no CRSP data. Here are available vehicles:',
          count: availableWithCRSP.length,
          vehicles: availableWithCRSP.slice(0, 10),
          suggestions: true,
          searchCriteria
        });
      }

      return res.status(404).json({
        success: false,
        message: 'No vehicles with CRSP data found. Please load CRSP data first from My CRSP page.'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle lookup successful',
      count: vehiclesWithCRSP.length,
      vehicles: vehiclesWithCRSP,
      searchCriteria
    });

  } catch (error) {
    console.error('Vehicle lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/vehicles/popular
// @desc    Get popular vehicles
// @access  Private
router.get('/popular', protect, async (req, res) => {
  try {
    const popularVehicles = await Vehicle.find({
      isPopular: true,
      status: 'active'
    })
      .sort({ searchCount: -1 })
      .limit(20);

    const popularWithCRSP = await Promise.all(
      popularVehicles.map(async (vehicle) => {
        const crsp = await CRSP.findOne({
          vehicle: vehicle._id,
          isActive: true
        }).sort({ month: -1 });

        return {
          ...vehicle.toObject(),
          crsp: crsp ? {
            retailPrice: crsp.retailPrice,
            customsValue: crsp.customsValue,
            wholesalePrice: crsp.wholesalePrice,
            month: crsp.month,
            source: crsp.source,
            taxRates: crsp.taxRates,
            depreciation: crsp.depreciation
          } : null
        };
      })
    );

    const filtered = popularWithCRSP.filter(v => v.crsp !== null);

    res.json({
      success: true,
      count: filtered.length,
      vehicles: filtered
    });
  } catch (error) {
    console.error('Get popular vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const crspHistory = await CRSP.find({
      vehicle: vehicle._id,
      isActive: true
    })
      .sort({ month: -1 })
      .limit(12)
      .populate('uploadedBy', 'name email')
      .populate('verification.verifiedBy', 'name email');

    vehicle.searchCount += 1;
    await vehicle.save();

    res.json({
      success: true,
      vehicle: {
        ...vehicle.toObject(),
        crspHistory: crspHistory.map(crsp => ({
          ...crsp.toObject(),
          taxRates: crsp.taxRates,
          depreciation: crsp.depreciation
        }))
      }
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/vehicles
// @desc    Create new vehicle (admin only)
// @access  Private/Admin
router.post('/', protect, roleBased('admin'), async (req, res) => {
  // ... (existing code)
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle (admin only)
// @access  Private/Admin
router.put('/:id', protect, roleBased('admin'), async (req, res) => {
  // ... (existing code)
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle (admin only)
// @access  Private/Admin
router.delete('/:id', protect, roleBased('admin'), async (req, res) => {
  // ... (existing code)
});

// @route   GET /api/vehicles/search/suggestions
// @desc    Get search suggestions
// @access  Private
router.get('/search/suggestions', protect, async (req, res) => {
  // ... (existing code)
});

// @route   GET /api/vehicles
// @desc    Get all vehicles with pagination (admin only)
// @access  Private/Admin
router.get('/', protect, roleBased('admin'), async (req, res) => {
  // ... (existing code)
});

// @route   GET /api/vehicles/stats/summary
// @desc    Get vehicle statistics summary
// @access  Private/Admin
router.get('/stats/summary', protect, roleBased('admin'), async (req, res) => {
  // ... (existing code)
});

// @route   GET /api/vehicles/suggestions
// @desc    Get vehicle suggestions for autocomplete (sorted alphabetically)
// @access  Public (no auth required)
router.get('/suggestions', async (req, res) => {
  try {
    const { type, query, make } = req.query;
    
    // Get unique makes or models from CRSP data, sorted alphabetically
    const crspData = await CRSP.find({ isActive: true })
      .limit(10000)
      .select('vehicleDetails vehicle')
      .populate('vehicle', 'make model');

    // Extract unique makes
    const makesSet = new Set();
    const modelsByMake = {};
    
    for (const crsp of crspData) {
      let vehicleMake = null;
      let vehicleModel = null;
      
      // Get make from vehicleDetails or vehicle reference
      if (crsp.vehicleDetails && crsp.vehicleDetails.make) {
        vehicleMake = crsp.vehicleDetails.make;
        vehicleModel = crsp.vehicleDetails.model;
      } else if (crsp.vehicle && crsp.vehicle.make) {
        vehicleMake = crsp.vehicle.make;
        vehicleModel = crsp.vehicle.model;
      }
      
      if (vehicleMake) {
        makesSet.add(vehicleMake);
        
        // Group models by make
        if (vehicleModel) {
          if (!modelsByMake[vehicleMake]) {
            modelsByMake[vehicleMake] = new Set();
          }
          modelsByMake[vehicleMake].add(vehicleModel);
        }
      }
    }

    // Convert to sorted arrays
    const allMakes = Array.from(makesSet).sort();
    
    // Convert models by make to sorted arrays
    const modelsByMakeSorted = {};
    for (const makeKey in modelsByMake) {
      modelsByMakeSorted[makeKey] = Array.from(modelsByMake[makeKey]).sort();
    }

    // Also add default makes if not present
    const defaultMakes = ['Toyota', 'Suzuki', 'Mazda', 'Honda', 'Nissan', 'Mitsubishi', 'Subaru', 'Lexus', 'Volkswagen', 'BMW', 'Mercedes', 'Ford', 'Hyundai', 'Kia'];
    for (const defaultMake of defaultMakes) {
      if (!allMakes.includes(defaultMake)) {
        allMakes.push(defaultMake);
      }
    }
    allMakes.sort();

    // Filter based on type and query
    if (type === 'make' && query) {
      const filteredMakes = allMakes.filter(m => m.toLowerCase().includes(query.toLowerCase()));
      return res.json({ success: true, suggestions: filteredMakes });
    }
    
    if (type === 'model' && make && query) {
      const models = modelsByMakeSorted[make] || [];
      const filteredModels = models.filter(m => m.toLowerCase().includes(query.toLowerCase()));
      return res.json({ success: true, suggestions: filteredModels });
    }
    
    if (type === 'model' && make && !query) {
      const models = modelsByMakeSorted[make] || [];
      return res.json({ success: true, suggestions: models });
    }

    // Return all makes by default
    res.json({ 
      success: true, 
      makes: allMakes,
      modelsByMake: modelsByMakeSorted
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
