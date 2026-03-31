require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarttax';

mongoose.connect(mongoURI)
  .then(async () => {
    const Vehicle = require('./models/Vehicle');
    const CRSP = require('./models/CRSP');
    
    const vehicleCount = await Vehicle.countDocuments();
    const crspCount = await CRSP.countDocuments();
    
    console.log('Vehicles:', vehicleCount);
    console.log('CRSP:', crspCount);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
