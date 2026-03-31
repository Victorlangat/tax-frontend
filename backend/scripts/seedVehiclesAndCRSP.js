// Standalone seed script to create proper vehicles and CRSP data
// Run with: node backend/scripts/seedVehiclesAndCRSP.js

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const Vehicle = require('../models/Vehicle');
const CRSP = require('../models/CRSP');
const User = require('../models/User');

const sampleVehicles = [
  { make: 'Toyota', model: 'Vitz', year: 2023, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'hatchback', retail: 1850000, customs: 1200000 },
  { make: 'Toyota', model: 'Corolla', year: 2022, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', retail: 2200000, customs: 1500000 },
  { make: 'Toyota', model: 'Prado', year: 2023, engineCC: 3000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', retail: 8500000, customs: 5500000 },
  { make: 'Nissan', model: 'Note', year: 2022, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'hatchback', retail: 1650000, customs: 1050000 },
  { make: 'Mazda', model: 'Demio', year: 2021, engineCC: 1300, fuelType: 'petrol', transmission: 'automatic', bodyType: 'hatchback', retail: 1350000, customs: 850000 },
  { make: 'Honda', model: 'Civic', year: 2022, engineCC: 1800, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', retail: 2400000, customs: 1600000 },
  { make: 'Ford', model: 'Ranger', year: 2023, engineCC: 2500, fuelType: 'diesel', transmission: 'manual', bodyType: 'pickup', retail: 4500000, customs: 2900000 },
  { make: 'Mercedes', model: 'C200', year: 2022, engineCC: 1500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', retail: 5500000, customs: 3500000 },
  { make: 'BMW', model: '3 Series', year: 2021, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', retail: 4800000, customs: 3100000 },
  { make: 'Volkswagen', model: 'Golf', year: 2022, engineCC: 1400, fuelType: 'petrol', transmission: 'automatic', bodyType: 'hatchback', retail: 2100000, customs: 1350000 },
  { make: 'Toyota', model: 'Hilux', year: 2023, engineCC: 2800, fuelType: 'diesel', transmission: 'manual', bodyType: 'pickup', retail: 3800000, customs: 2470000 },
  { make: 'Toyota', model: 'Landcruiser', year: 2022, engineCC: 4500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv', retail: 12000000, customs: 7800000 },
  { make: 'Mitsubishi', model: 'Pajero', year: 2022, engineCC: 3000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', retail: 5500000, customs: 3575000 },
  { make: 'Subaru', model: 'Forester', year: 2021, engineCC: 2500, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv', retail: 3200000, customs: 2080000 },
  { make: 'Kia', model: 'Sportage', year: 2022, engineCC: 2000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv', retail: 2800000, customs: 1820000 }
];

async function seed() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarttax';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await CRSP.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('🗑️ Cleared existing CRSP and Vehicle data');

    // Find or create system user
    let systemUser = await User.findOne({ role: 'admin' });
    if (!systemUser) {
      systemUser = await User.findOne();
    }
    
    if (!systemUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      systemUser = await User.create({
        name: 'System Admin',
        email: 'admin@smarttax.go.ke',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('👤 Created system admin user');
    }

    // Create vehicles first
    const createdVehicles = [];
    for (const v of sampleVehicles) {
      const vehicle = await Vehicle.create({
        make: v.make,
        model: v.model,
        year: v.year,
        engineCC: v.engineCC,
        fuelType: v.fuelType,
        transmission: v.transmission,
        bodyType: v.bodyType
      });
      createdVehicles.push({ vehicle, retail: v.retail, customs: v.customs });
      console.log(`🚗 Created vehicle: ${v.make} ${v.model} ${v.year}`);
    }

    // Create CRSP entries for each vehicle
    for (const { vehicle, retail, customs } of createdVehicles) {
      await CRSP.create({
        vehicle: vehicle._id,
        month: '2024-01',
        retailPrice: retail,
        wholesalePrice: Math.floor(retail * 0.9),
        customsValue: customs,
        depreciation: { year1: 10, year2_3: 30, year4_6: 50, year7_8: 65 },
        taxRates: { importDuty: 35, exciseDuty: 20, vat: 16, idf: 2.5, rdl: 2 },
        source: 'kra',
        confidenceScore: 95,
        verification: { verified: true },
        uploadedBy: systemUser._id
      });
      console.log(`💰 Created CRSP: ${vehicle.make} ${vehicle.model} - KES ${retail.toLocaleString()}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`📊 Created ${createdVehicles.length} vehicles with CRSP data`);
    
    // Verify the data
    const vehicleCount = await Vehicle.countDocuments();
    const crspCount = await CRSP.countDocuments();
    console.log(`\n📈 Database status:`);
    console.log(`   Vehicles: ${vehicleCount}`);
    console.log(`   CRSP entries: ${crspCount}`);

    // Show sample of what was created
    const sampleCRSP = await CRSP.find().populate('vehicle', 'make model year engineCC fuelType').limit(5);
    console.log('\n📋 Sample CRSP data:');
    sampleCRSP.forEach(c => {
      console.log(`   ${c.vehicle.make} ${c.vehicle.model} ${c.vehicle.year} - KES ${c.retailPrice.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
