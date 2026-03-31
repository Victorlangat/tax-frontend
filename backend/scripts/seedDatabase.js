const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const CRSP = require('../models/CRSP');
require('dotenv').config();

const sampleVehicles = [
  {
    make: 'Toyota',
    model: 'Vitz',
    year: 2023,
    trim: 'Hybrid F',
    engineCC: 1300,
    fuelType: 'hybrid',
    transmission: 'CVT',
    bodyType: 'hatchback',
    doors: 5,
    seats: 5,
    driveType: 'FWD',
    color: 'White',
    features: ['Power Steering', 'Air Conditioning', 'Power Windows', 'Keyless Entry', 'Backup Camera'],
    specifications: {
      length: 3995,
      width: 1695,
      height: 1520,
      weight: 1080,
      fuelTank: 36,
      fuelConsumption: 25,
      emissions: 95,
      power: 98,
      torque: 120
    },
    status: 'active',
    sourceCountry: 'Japan',
    isPopular: true
  },
  {
    make: 'Suzuki',
    model: 'Swift',
    year: 2023,
    trim: 'GL',
    engineCC: 1200,
    fuelType: 'petrol',
    transmission: 'manual',
    bodyType: 'hatchback',
    doors: 5,
    seats: 5,
    driveType: 'FWD',
    color: 'Gray',
    features: ['Power Steering', 'Air Conditioning', 'Power Windows', 'USB Port', 'Radio'],
    specifications: {
      length: 3840,
      width: 1695,
      height: 1500,
      weight: 950,
      fuelTank: 37,
      fuelConsumption: 22,
      emissions: 110,
      power: 82,
      torque: 113
    },
    status: 'active',
    sourceCountry: 'Japan',
    isPopular: true
  },
  {
    make: 'Mazda',
    model: 'Demio',
    year: 2022,
    trim: 'Deluxe',
    engineCC: 1500,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'hatchback',
    doors: 5,
    seats: 5,
    driveType: 'FWD',
    color: 'Red',
    features: ['Power Steering', 'Air Conditioning', 'Power Windows', 'Keyless Entry', 'Touchscreen', 'Rear Camera'],
    specifications: {
      length: 4060,
      width: 1695,
      height: 1525,
      weight: 1100,
      fuelTank: 44,
      fuelConsumption: 20,
      emissions: 115,
      power: 108,
      torque: 141
    },
    status: 'active',
    sourceCountry: 'Japan',
    isPopular: true
  },
  {
    make: 'Toyota',
    model: 'Premio',
    year: 2021,
    trim: '2.0G',
    engineCC: 2000,
    fuelType: 'petrol',
    transmission: 'automatic',
    bodyType: 'sedan',
    doors: 4,
    seats: 5,
    driveType: 'FWD',
    color: 'Black',
    features: ['Leather Seats', 'Sunroof', 'Navigation', 'Climate Control', 'Power Seats', 'Premium Audio'],
    specifications: {
      length: 4600,
      width: 1770,
      height: 1475,
      weight: 1450,
      fuelTank: 60,
      fuelConsumption: 15,
      emissions: 140,
      power: 152,
      torque: 193
    },
    status: 'active',
    sourceCountry: 'Japan',
    isPopular: true
  },
  {
    make: 'Honda',
    model: 'Fit',
    year: 2023,
    trim: 'Hybrid',
    engineCC: 1300,
    fuelType: 'hybrid',
    transmission: 'CVT',
    bodyType: 'hatchback',
    doors: 5,
    seats: 5,
    driveType: 'FWD',
    color: 'Blue',
    features: ['Power Steering', 'Air Conditioning', 'Power Windows', 'Keyless Entry', 'Touchscreen', 'Lane Assist'],
    specifications: {
      length: 3995,
      width: 1695,
      height: 1525,
      weight: 1120,
      fuelTank: 40,
      fuelConsumption: 26,
      emissions: 92,
      power: 109,
      torque: 134
    },
    status: 'active',
    sourceCountry: 'Japan',
    isPopular: true
  }
];

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@smarttax.com',
    password: 'admin123',
    role: 'admin',
    company: 'SmartTax System',
    phone: '+254700000000',
    kraPin: 'P000000000A',
    address: {
      street: 'Admin Street',
      city: 'Nairobi',
      country: 'Kenya'
    },
    emailVerified: true,
    isActive: true
  },
  {
    name: 'Demo Importer',
    email: 'importer@smarttax.com',
    password: 'importer123',
    role: 'importer',
    company: 'Demo Importers Ltd',
    phone: '+254711111111',
    kraPin: 'P111111111I',
    address: {
      street: 'Importer Avenue',
      city: 'Mombasa',
      country: 'Kenya'
    },
    emailVerified: true,
    isActive: true
  },
  {
    name: 'Test Agent',
    email: 'agent@smarttax.com',
    password: 'agent123',
    role: 'agent',
    company: 'Vehicle Agents Co.',
    phone: '+254722222222',
    kraPin: 'P222222222G',
    address: {
      street: 'Agent Road',
      city: 'Kisumu',
      country: 'Kenya'
    },
    emailVerified: true,
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttax');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await CRSP.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.name} (${user.email})`);
    }

    // Create vehicles
    const createdVehicles = [];
    for (const vehicleData of sampleVehicles) {
      vehicleData.createdBy = createdUsers[0]._id;
      vehicleData.lastUpdatedBy = createdUsers[0]._id;
      const vehicle = await Vehicle.create(vehicleData);
      createdVehicles.push(vehicle);
      console.log(`🚗 Created vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
    }

    // Create CRSP data for vehicles
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];
    for (const vehicle of createdVehicles) {
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const retailPrice = vehicle.engineCC * 2500 * (1 - i * 0.02); // Slight decrease each month
        const customsValue = retailPrice * 0.8;
        
        await CRSP.create({
          vehicle: vehicle._id,
          month,
          retailPrice,
          wholesalePrice: retailPrice * 0.85,
          customsValue,
          depreciation: {
            year1: 10,
            year2_3: 30,
            year4_6: 50,
            year7_8: 65
          },
          taxRates: {
            importDuty: 35,
            exciseDuty: vehicle.engineCC > 1500 ? 35 : 20,
            vat: 16,
            idf: 2.5,
            rdl: 2
          },
          source: 'kra',
          confidenceScore: 95,
          isActive: true,
          uploadedBy: createdUsers[0]._id,
          verification: {
            verified: true,
            verifiedBy: createdUsers[0]._id,
            verifiedAt: new Date(),
            verificationNotes: 'Automatically verified during seed'
          }
        });
      }
      console.log(`📊 Created CRSP data for: ${vehicle.make} ${vehicle.model}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${createdUsers.length} users`);
    console.log(`🚗 Created ${createdVehicles.length} vehicles`);
    console.log(`📈 Created ${createdVehicles.length * months.length} CRSP entries`);

    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@smarttax.com / admin123');
    console.log('Importer: importer@smarttax.com / importer123');
    console.log('Agent: agent@smarttax.com / agent123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
seedDatabase();