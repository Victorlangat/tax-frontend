
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');

// Configure multer for document upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf|jpg|jpeg|png|xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, and Excel files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { documentType, vehicleId, calculationId, description } = req.body;

    // Validate document type
    const validTypes = ['invoice', 'bill_of_lading', 'export_certificate', 'inspection_certificate', 'crsp_sheet', 'other'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document type' 
      });
    }

    const document = await Document.create({
      user: req.user.id,
      documentType,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      vehicle: vehicleId || null,
      calculation: calculationId || null,
      description: description || '',
      status: 'uploaded'
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/documents/upload-multiple
// @desc    Upload multiple documents
// @access  Private
router.post('/upload-multiple', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const { vehicleId, calculationId } = req.body;
    const documents = [];

    for (const file of req.files) {
      // Determine document type based on filename or other logic
      let documentType = 'other';
      const filename = file.originalname.toLowerCase();
      
      if (filename.includes('invoice')) documentType = 'invoice';
      else if (filename.includes('lading')) documentType = 'bill_of_lading';
      else if (filename.includes('export')) documentType = 'export_certificate';
      else if (filename.includes('inspection')) documentType = 'inspection_certificate';
      else if (filename.includes('crsp')) documentType = 'crsp_sheet';

      const document = await Document.create({
        user: req.user.id,
        documentType,
        filename: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/documents/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        vehicle: vehicleId || null,
        calculation: calculationId || null,
        status: 'uploaded'
      });

      documents.push(document);
    }

    res.status(201).json({
      success: true,
      message: `${documents.length} documents uploaded successfully`,
      documents
    });
  } catch (error) {
    console.error('Multiple document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/documents
// @desc    Get user's documents
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      documentType, 
      vehicleId, 
      calculationId,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = { user: req.user.id };
    
    if (documentType) query.documentType = documentType;
    if (vehicleId) query.vehicle = vehicleId;
    if (calculationId) query.calculation = calculationId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Document.countDocuments(query);

    const documents = await Document.find(query)
      .populate('vehicle', 'make model year')
      .populate('calculation', 'referenceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('vehicle', 'make model year')
      .populate('calculation', 'referenceId')
      .populate('user', 'name email');

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user owns this document (unless admin)
    if (document.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this document' 
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { description, documentType, status } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user owns this document
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this document' 
      });
    }

    if (description !== undefined) document.description = description;
    if (documentType) document.documentType = documentType;
    if (status) document.status = status;

    await document.save();

    res.json({
      success: true,
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user owns this document
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this document' 
      });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await document.remove();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/documents/:id/verify
// @desc    Verify document (admin only)
// @access  Private/Admin
router.post('/:id/verify', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { isVerified, verificationNotes, discrepancies } = req.body;

    document.verification = {
      isVerified: isVerified !== undefined ? isVerified : true,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      verificationNotes: verificationNotes || 'Verified by admin',
      discrepancies: discrepancies || []
    };

    document.status = isVerified === false ? 'rejected' : 'verified';
    await document.save();

    res.json({
      success: true,
      message: 'Document verification updated',
      document
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/documents/stats/summary
// @desc    Get document statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get document counts
    const totalDocuments = await Document.countDocuments({ user: req.user.id });
    const recentDocuments = await Document.countDocuments({ 
      user: req.user.id,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get documents by type
    const documentsByType = await Document.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: {
        _id: '$documentType',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }},
      { $sort: { count: -1 } }
    ]);

    // Get verification status
    const verificationStats = await Document.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      stats: {
        totalDocuments,
        recentDocuments,
        documentsByType,
        verificationStats,
        totalSize: documentsByType.reduce((sum, type) => sum + type.totalSize, 0)
      }
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
