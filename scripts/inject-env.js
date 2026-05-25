const { writeFileSync, copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const apiUrl = process.env.VOCA_API_URL || process.env.NEXT_PUBLIC_VOCA_API_URL || 'http://localhost:3001';
const gaId = process.env.GA_MEASUREMENT_ID || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const escape = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Landing page config (static index.html)
let content = `window.VOCA_API_URL = '${escape(apiUrl)}';\n`;
if (gaId) content += `window.GA_MEASUREMENT_ID = '${escape(gaId)}';\n`;
if (supabaseUrl) content += `window.SUPABASE_URL = '${escape(supabaseUrl)}';\n`;
if (supabaseAnonKey) content += `window.SUPABASE_ANON_KEY = '${escape(supabaseAnonKey)}';\n`;

const nextEnv = [
  `NEXT_PUBLIC_VOCA_API_URL=${apiUrl}`,
  supabaseUrl ? `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}` : '',
  supabaseAnonKey ? `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}` : '',
].filter(Boolean).join('\n') + '\n';

writeFileSync('.env.local', nextEnv);

const publicDir = join(process.cwd(), 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

writeFileSync(join(publicDir, 'config.js'), content);
writeFileSync('config.js', content);

if (existsSync('index.html')) {
  copyFileSync('index.html', join(publicDir, 'index.html'));
}

console.log(`Generated config.js (API: ${apiUrl})`);
if (gaId) console.log(`Google Analytics: ${gaId}`);
