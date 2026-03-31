// Quick MongoDB connection test
const mongoose = require('mongoose');

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarttax';

console.log('Testing MongoDB connection...');
console.log('URI:', mongoURI);

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  console.log('Port:', mongoose.connection.port);
  return mongoose.disconnect();
})
.then(() => {
  console.log('🔌 Disconnected');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

