const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');
const Vehicle = require('../models/Vehicle');
const CRSP = require('../models/CRSP');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST /api/tax/calculate
// @desc    Calculate import taxes for a vehicle
// @access  Private
router.post('/calculate', protect, async (req, res) => {
  try {
    const {
      vehicleId,
      crspId,
      vehicleValue,
      shippingCost = 0,
      insuranceCost = 0,
      additionalCosts = 0,
      age,
      fuelType,
      engineCC,
      name,
      description,
      tags
    } = req.body;

    // Validate required fields
    if (!vehicleValue || vehicleValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle value is required and must be greater than 0'
      });
    }

    let vehicle, crsp;

    // Get vehicle and CRSP data
    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Get latest CRSP for the vehicle
      crsp = await CRSP.findOne({
        vehicle: vehicleId,
        isActive: true
      }).sort({ month: -1 });
    } else if (crspId) {
      crsp = await CRSP.findById(crspId).populate('vehicle');
      if (!crsp) {
        return res.status(404).json({
          success: false,
          message: 'CRSP data not found'
        });
      }
      vehicle = crsp.vehicle;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either vehicleId or crspId is required'
      });
    }

    // Calculate CIF value
    const cifValue = parseFloat(vehicleValue) +
      parseFloat(shippingCost) +
      parseFloat(insuranceCost) +
      parseFloat(additionalCosts);

    // Get tax rates from CRSP or use defaults
    const taxRates = crsp?.taxRates || {
      importDuty: 35,
      exciseDuty: 20,
      vat: 16,
      idf: 2.5,
      rdl: 2
    };

    // Calculate depreciation factor based on age
    const vehicleAge = age || (new Date().getFullYear() - vehicle.year);
    let depreciationFactor = 1;

    if (crsp?.depreciation) {
      if (vehicleAge === 0) depreciationFactor = 1 - (crsp.depreciation.year1 / 100);
      else if (vehicleAge <= 3) depreciationFactor = 1 - (crsp.depreciation.year2_3 / 100);
      else if (vehicleAge <= 6) depreciationFactor = 1 - (crsp.depreciation.year4_6 / 100);
      else depreciationFactor = 1 - (crsp.depreciation.year7_8 / 100);
    }

    // Adjust customs value based on depreciation
    const customsValue = cifValue * depreciationFactor;

    // Calculate taxes
    const importDuty = customsValue * (taxRates.importDuty / 100);
    const exciseBase = customsValue + importDuty;

    // Excise duty rate varies by engine capacity
    const exciseRate = (engineCC || vehicle.engineCC) > 2500 ?
      (taxRates.exciseDuty + 15) : taxRates.exciseDuty;
    const exciseDuty = exciseBase * (exciseRate / 100);

    const vatBase = customsValue + importDuty + exciseDuty;
    const vat = vatBase * (taxRates.vat / 100);

    const idf = customsValue * (taxRates.idf / 100);
    const rdl = customsValue * (taxRates.rdl / 100);

    const totalTax = importDuty + exciseDuty + vat + idf + rdl;
    const totalCost = cifValue + totalTax;

    // Calculate summary
    const taxToValueRatio = (totalTax / cifValue * 100);
    const totalTaxPercentage = (totalTax / totalCost * 100);

    // Create calculation record
    const calculationData = {
      user: req.user.id,
      vehicle: vehicle._id,
      crsp: crsp?._id,
      name: name || `${vehicle.make} ${vehicle.model} Tax Calculation`,
      description,
      tags,
      inputs: {
        vehicleValue: parseFloat(vehicleValue),
        shippingCost: parseFloat(shippingCost),
        insuranceCost: parseFloat(insuranceCost),
        additionalCosts: parseFloat(additionalCosts),
        cifValue,
        age: vehicleAge,
        fuelType: fuelType || vehicle.fuelType,
        engineCC: engineCC || vehicle.engineCC
      },
      results: {
        customsValue,
        depreciationFactor: (depreciationFactor * 100),
        importDuty,
        exciseDuty,
        vat,
        idf,
        rdl,
        totalTax,
        totalCost
      },
      rates: {
        importDuty: taxRates.importDuty,
        exciseDuty: exciseRate,
        vat: taxRates.vat,
        idf: taxRates.idf,
        rdl: taxRates.rdl
      },
      summary: {
        taxToValueRatio,
        totalTaxPercentage
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        calculationTime: Date.now() - req.startTime
      }
    };

    const calculation = await Calculation.create(calculationData);

    // Prepare response
    const response = {
      success: true,
      message: 'Tax calculation completed successfully',
      calculationId: calculation._id,
      referenceId: calculation.referenceId,
      vehicle: {
        id: vehicle._id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        engineCC: vehicle.engineCC,
        fuelType: vehicle.fuelType,
        age: vehicleAge
      },
      inputs: calculation.inputs,
      calculations: calculation.results,
      rates: calculation.rates,
      summary: calculation.summary,
      createdAt: calculation.createdAt
    };

    res.json(response);
  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tax/calculations
// @desc    Get user's tax calculations with filters
// @access  Private
router.get('/calculations', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      saved,
      search,
      startDate,
      endDate,
      vehicleId,
      tag
    } = req.query;

    // Build query
    const query = { user: req.user.id };

    // Apply filters
    if (status) query.status = status;
    if (saved !== undefined) query.isSaved = saved === 'true';
    if (vehicleId) query.vehicle = vehicleId;
    if (tag) query.tags = tag;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Calculation.countDocuments(query);

    // Determine sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const calculations = await Calculation.find(query)
      .populate('vehicle', 'make model year engineCC fuelType')
      .populate('crsp', 'month customsValue')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: calculations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      calculations
    });
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tax/calculations/:id
// @desc    Get calculation by ID
// @access  Private
router.get('/calculations/:id', protect, async (req, res) => {
  try {
    const calculation = await Calculation.findById(req.params.id)
      .populate('vehicle')
      .populate('crsp')
      .populate('user', 'name email company')
      .populate('sharing.sharedWith', 'name email');

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }

    // Check if user owns this calculation or has access through sharing
    const canAccess = calculation.user._id.toString() === req.user.id ||
      req.user.role === 'admin' ||
      calculation.sharing.sharedWith.some(shared => shared._id.toString() === req.user.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this calculation'
      });
    }

    res.json({
      success: true,
      calculation
    });
  } catch (error) {
    console.error('Get calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/tax/calculations/:id
// @desc    Update calculation
// @access  Private
router.put('/calculations/:id', protect, async (req, res) => {
  try {
    const { name, description, tags, notes, status } = req.body;

    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }

    // Check if user owns this calculation
    if (calculation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this calculation'
      });
    }

    // Update fields
    if (name !== undefined) calculation.name = name;
    if (description !== undefined) calculation.description = description;
    if (tags !== undefined) calculation.tags = tags;
    if (notes !== undefined) calculation.notes = notes;
    if (status !== undefined) calculation.status = status;

    await calculation.save();

    res.json({
      success: true,
      message: 'Calculation updated successfully',
      calculation
    });
  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/tax/calculations/:id/save
// @desc    Save calculation with custom name
// @access  Private
router.post('/calculations/:id/save', protect, async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }

    // Check if user owns this calculation
    if (calculation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to save this calculation'
      });
    }

    calculation.name = name || calculation.name;
    calculation.description = description || calculation.description;
    calculation.tags = tags || calculation.tags;
    calculation.isSaved = true;
    calculation.savedAt = new Date();
    calculation.status = 'saved';

    await calculation.save();

    res.json({
      success: true,
      message: 'Calculation saved successfully',
      calculation
    });
  } catch (error) {
    console.error('Save calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/tax/calculations/:id
// @desc    Delete calculation
// @access  Private
router.delete('/calculations/:id', protect, async (req, res) => {
  try {
    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }

    // Check if user owns this calculation
    if (calculation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this calculation'
      });
    }

    await calculation.deleteOne();

    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tax/stats
// @desc    Get user's tax calculation statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get calculation counts
    const totalCalculations = await Calculation.countDocuments({ user: req.user.id });
    const savedCalculations = await Calculation.countDocuments({
      user: req.user.id,
      isSaved: true
    });
    const recentCalculations = await Calculation.countDocuments({
      user: req.user.id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get average tax amount
    const avgTaxResult = await Calculation.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          avgTax: { $avg: '$results.totalTax' },
          totalTax: { $sum: '$results.totalTax' },
          avgTotalCost: { $avg: '$results.totalCost' }
        }
      }
    ]);

    // Get calculations by vehicle make
    const calculationsByMake = await Calculation.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $group: {
          _id: '$vehicle.make',
          count: { $sum: 1 },
          avgTax: { $avg: '$results.totalTax' },
          totalTax: { $sum: '$results.totalTax' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get calculations by status
    const calculationsByStatus = await Calculation.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalCalculations,
        savedCalculations,
        recentCalculations,
        avgTax: avgTaxResult[0]?.avgTax || 0,
        totalTaxAmount: avgTaxResult[0]?.totalTax || 0,
        avgTotalCost: avgTaxResult[0]?.avgTotalCost || 0,
        calculationsByMake,
        calculationsByStatus
      }
    });
  } catch (error) {
    console.error('Get tax stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/tax/calculations/:id/share
// @desc    Share calculation with other users
// @access  Private
router.post('/calculations/:id/share', protect, async (req, res) => {
  try {
    const { userIds, permission = 'view' } = req.body;

    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Calculation not found'
      });
    }

    // Check if user owns this calculation
    if (calculation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this calculation'
      });
    }

    // Add users to sharing list
    if (userIds && Array.isArray(userIds)) {
      for (const userId of userIds) {
        // Check if user is already shared
        const alreadyShared = calculation.sharing.sharedWith.some(
          shared => shared.user.toString() === userId
        );

        if (!alreadyShared) {
          calculation.sharing.sharedWith.push({
            user: userId,
            permission,
            sharedAt: new Date()
          });
        }
      }

      calculation.sharing.isShared = true;
      await calculation.save();
    }

    res.json({
      success: true,
      message: 'Calculation shared successfully',
      calculation
    });
  } catch (error) {
    console.error('Share calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tax/compare
// @desc    Compare multiple calculations
// @access  Private
router.get('/compare', protect, async (req, res) => {
  try {
    const { calculationIds } = req.query;

    if (!calculationIds) {
      return res.status(400).json({
        success: false,
        message: 'Calculation IDs are required'
      });
    }

    const ids = calculationIds.split(',');

    const calculations = await Calculation.find({
      _id: { $in: ids },
      $or: [
        { user: req.user.id },
        { 'sharing.sharedWith.user': req.user.id }
      ]
    })
      .populate('vehicle', 'make model year engineCC fuelType')
      .populate('crsp', 'month customsValue');

    if (calculations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No calculations found'
      });
    }

    // Prepare comparison data
    const comparison = calculations.map(calc => ({
      id: calc._id,
      referenceId: calc.referenceId,
      name: calc.name,
      vehicle: calc.vehicle,
      date: calc.createdAt,
      inputs: calc.inputs,
      results: calc.results,
      rates: calc.rates,
      summary: calc.summary
    }));

    // Calculate comparison summary
    const totalTaxes = comparison.map(c => c.results.totalTax);
    const totalCosts = comparison.map(c => c.results.totalCost);

    const summary = {
      highestTax: Math.max(...totalTaxes),
      lowestTax: Math.min(...totalTaxes),
      avgTax: totalTaxes.reduce((sum, tax) => sum + tax, 0) / totalTaxes.length,
      highestCost: Math.max(...totalCosts),
      lowestCost: Math.min(...totalCosts),
      avgCost: totalCosts.reduce((sum, cost) => sum + cost, 0) / totalCosts.length,
      taxRange: Math.max(...totalTaxes) - Math.min(...totalTaxes),
      costRange: Math.max(...totalCosts) - Math.min(...totalCosts)
    };

    res.json({
      success: true,
      count: calculations.length,
      comparison,
      summary
    });
  } catch (error) {
    console.error('Compare calculations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/tax/recent
// @desc    Get recent calculations for dashboard
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    const calculations = await Calculation.find({ user: req.user.id })
      .populate('vehicle', 'make model year')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      calculations
    });
  } catch (error) {
    console.error('Get recent calculations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;