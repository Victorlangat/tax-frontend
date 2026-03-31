const CRSP = require('./models/CRSP');
const Vehicle = require('./models/Vehicle');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/smarttax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Test data
  const testVehicle = {
    make: 'TOYOTA',
    model: 'COROLLA', 
    year: 2025,
    retailPrice: 2500000,
    month: '2025-07'
  };
  
  // Check if vehicle exists
  let vehicle = await Vehicle.findOne({
    make: { $regex: new RegExp('^' + testVehicle.make + '$', 'i') },
    model: { $regex: new RegExp('^' + testVehicle.model + '$', 'i') }
  });
  
  console.log('Vehicle found:', vehicle);
  
  // Check if CRSP exists for this month
  let crsp = await CRSP.findOne({
    'vehicleDetails.make': { $regex: new RegExp('^' + testVehicle.make + '$', 'i') },
    'vehicleDetails.model': { $regex: new RegExp('^' + testVehicle.model + '$', 'i') },
    month: testVehicle.month,
    isActive: true
  });
  
  console.log('CRSP found:', crsp);
  
  // Check ALL CRSP for this make/model
  const allCRSP = await CRSP.find({
    'vehicleDetails.make': { $regex: new RegExp('^' + testVehicle.make + '$', 'i') },
    'vehicleDetails.model': { $regex: new RegExp('^' + testVehicle.model + '$', 'i') },
    isActive: true
  }).limit(5);
  
  console.log('All CRSP for this make/model:', allCRSP.length);
  allCRSP.forEach(c => console.log('  -', c.month, c.vehicleDetails?.make, c.vehicleDetails?.model));
  
  await mongoose.disconnect();
  console.log('Disconnected');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
