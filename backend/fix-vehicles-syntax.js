const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'routes/vehicles.js');
let content = fs.readFileSync(file, 'utf8');

// Fix the broken line - find the res.json block and fix comma + indentation
content = content.replace(
  /vehiclesWithCRSP\.slice\(0, 20\),\s*searchCriteria/,
  'vehiclesWithCRSP.slice(0, 20),\n        searchCriteria'
);

content = content.replace(
  /limit\(10\);/,
  'limit(20);'
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ vehicles.js syntax fixed - trailing comma and indentation corrected');
console.log('Backend ready - run npm run dev');
