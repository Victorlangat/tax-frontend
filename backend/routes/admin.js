const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Calculation = require('../models/Calculation');
const CRSP = require('../models/CRSP');
const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCalculations = await Calculation.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    const totalCRSP = await CRSP.countDocuments({ isActive: true });
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');
    
    // Get recent calculations
    const recentCalculations = await Calculation.find()
      .populate('user', 'name email')
      .populate('vehicle', 'make model year')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get system status
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalCalculations,
        totalVehicles,
        totalCRSP,
        recentUsers,
        recentCalculations
      }
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user by admin
// @access  Private/Admin
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role, company, phone, kraPin, isActive, emailVerified } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
    }
    
    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (company !== undefined) user.company = company;
    if (phone !== undefined) user.phone = phone;
    if (kraPin !== undefined) user.kraPin = kraPin;
    if (isActive !== undefined) user.isActive = isActive;
    if (emailVerified !== undefined) user.emailVerified = emailVerified;
    
    await user.save();
    
    // Log the action
    await AuditLog.create({
      user: req.user.id,
      action: 'user_management',
      entity: 'User',
      entityId: user._id,
      description: `Updated user ${user.name} (${user.email})`,
      ipAddress: req.ip,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user by admin
// @access  Private/Admin
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user has calculations
    const calculationCount = await Calculation.countDocuments({ user: user._id });
    if (calculationCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete user with existing calculations' 
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // Log the action
    await AuditLog.create({
      user: req.user.id,
      action: 'user_management',
      entity: 'User',
      entityId: user._id,
      description: `Deleted user ${user.name} (${user.email})`,
      ipAddress: req.ip,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/admin/users/:id/reset-password
// @desc    Reset user password by admin
// @access  Private/Admin
router.post('/users/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Log the action
    await AuditLog.create({
      user: req.user.id,
      action: 'user_management',
      entity: 'User',
      entityId: user._id,
      description: `Reset password for user ${user.name}`,
      ipAddress: req.ip,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs with filters
// @access  Private/Admin
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      action,
      userId,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(query);
    
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/audit-logs/stats
// @desc    Get audit log statistics
// @access  Private/Admin
router.get('/audit-logs/stats', protect, adminOnly, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Total logs
    const totalLogs = await AuditLog.countDocuments();
    
    // Recent logs
    const recentLogs = await AuditLog.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Logs by action type
    const logsByAction = await AuditLog.aggregate([
      { $group: {
        _id: '$action',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);
    
    // Logs by status
    const logsByStatus = await AuditLog.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    // Top users by activity
    const topUsers = await AuditLog.aggregate([
      { $group: {
        _id: '$user',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        count: 1,
        _id: 0
      }}
    ]);
    
    res.json({
      success: true,
      stats: {
        totalLogs,
        recentLogs,
        logsByAction,
        logsByStatus,
        topUsers
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/system-stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/system-stats', protect, adminOnly, async (req, res) => {
  try {
    // Database statistics
    const dbStats = await mongoose.connection.db.stats();
    
    // Collection sizes
    const usersSize = await User.countDocuments();
    const calculationsSize = await Calculation.countDocuments();
    const vehiclesSize = await Vehicle.countDocuments();
    const crspSize = await CRSP.countDocuments({ isActive: true });
    
    // Recent system activity
    const recentActivity = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // System uptime (simplified)
    const uptime = process.uptime();
    
    res.json({
      success: true,
      stats: {
        database: {
          collections: dbStats.collections,
          objects: dbStats.objects,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize
        },
        collections: {
          users: usersSize,
          calculations: calculationsSize,
          vehicles: vehiclesSize,
          crsp: crspSize
        },
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime)
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}

module.exports = router;