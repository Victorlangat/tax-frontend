const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load local overrides (for development) - this will override the MONGODB_URI
dotenv.config({ path: '.env.local', override: true });

// Import routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const crspRoutes = require('./routes/crsp_new');
const taxRoutes = require('./routes/tax');
const documentRoutes = require('./routes/documents');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection with enhanced options
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarttax';
    
    console.log(`🔌 Attempting to connect to MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    console.log(`🔗 Port: ${mongoose.connection.port}`);
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Auto-seed if CRSP empty
    setTimeout(async () => {
      try {
        const CRSP = require('./models/CRSP');
        const count = await CRSP.countDocuments({ isActive: true });
        if (count === 0) {
          console.log('🛢️  CRSP empty, auto-loading samples...');
          const response = await fetch('http://localhost:' + PORT + '/api/crsp/load-sample', { method: 'POST' });
          const data = await response.json();
          console.log('✅ Auto-seed complete:', data);
        } else {
          console.log('✅ CRSP already has data (', count, 'records)');
        }
      } catch (seedError) {
        console.log('⚠️  Auto-seed failed (normal if backend not ready):', seedError.message);
      }
    }, 5000); // Wait 5s for routes
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if MongoDB service is running:');
    console.log('   - Open Services (services.msc)');
    console.log('   - Find "MongoDB Server (MongoDB)"');
    console.log('   - Ensure it\'s "Running"');
    console.log('\n2. Test connection with mongo shell:');
    console.log('   - Open Command Prompt as Administrator');
    console.log('   - Run: mongo --host 127.0.0.1:27017');
    console.log('\n3. Restart MongoDB service:');
    console.log('   - net stop MongoDB');
    console.log('   - net start MongoDB');
    console.log('\n4. Check if port 27017 is in use:');
    console.log('   - netstat -ano | findstr :27017');
    
    // Don't exit in development, allow auto-reconnect
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Basic route
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = 'unknown';
  switch (dbStatus) {
    case 0: dbStatusText = 'disconnected'; break;
    case 1: dbStatusText = 'connected'; break;
    case 2: dbStatusText = 'connecting'; break;
    case 3: dbStatusText = 'disconnecting'; break;
  }
  
  res.json({ 
    message: 'SmartTax API Server',
    version: '1.0.0',
    status: 'running',
    database: dbStatusText,
    endpoints: {
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      crsp: '/api/crsp',
      tax: '/api/tax',
      documents: '/api/documents',
      reports: '/api/reports',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: dbStatus,
    databaseState: dbState
  });
});

// Test database endpoint
app.get('/test-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    res.json({
      success: true,
      database: mongoose.connection.name,
      collections: collectionNames,
      totalCollections: collectionNames.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database test failed'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/crsp', crspRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SmartTax server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
});

module.exports = app;