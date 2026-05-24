const { writeFileSync } = require('fs');

const apiUrl = process.env.VOCA_API_URL || 'http://localhost:3001';

writeFileSync(
  'config.js',
  `window.VOCA_API_URL = '${apiUrl.replace(/'/g, "\\'")}';\n`
);

console.log(`Generated config.js with API URL: ${apiUrl}`);
