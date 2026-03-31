const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'vehicles.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix syntax errors
content = content.replace(/vehiclesWithCRSP\.slice\(0, 20\),/g, 'vehiclesWithCRSP.slice(0, 20)');
content = content.replace(/\.limit\(10\);/g, '.limit(20);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed syntax errors in vehicles.js');
console.log('Backend ready - run "npm run dev"');
