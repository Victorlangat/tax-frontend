const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'routes/vehicles.js');
let content = fs.readFileSync(file, 'utf8');

// Find the res.json block around line 132 and fix exactly
const brokenLine = '      vehiclesWithCRSP.slice(0, 20),';
const fixedLine = '        vehicles: vehiclesWithCRSP.slice(0, 20),';

content = content.replace(brokenLine, fixedLine);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Line 132 fixed precisely');
console.log('Run npm run dev');
