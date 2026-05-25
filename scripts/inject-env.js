const { writeFileSync } = require('fs');

const apiUrl = process.env.VOCA_API_URL || 'http://localhost:3001';
const gaId = process.env.GA_MEASUREMENT_ID || '';

const escape = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

let content = `window.VOCA_API_URL = '${escape(apiUrl)}';\n`;
if (gaId) {
  content += `window.GA_MEASUREMENT_ID = '${escape(gaId)}';\n`;
}

writeFileSync('config.js', content);

console.log(`Generated config.js with API URL: ${apiUrl}`);
if (gaId) console.log(`Google Analytics enabled: ${gaId}`);
