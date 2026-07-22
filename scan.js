const fs = require('fs');
const html = fs.readFileSync('d:/Students/index.html', 'utf8');
const regex = /data-i18n="([^"]+)"/g;
let match;
const htmlKeys = new Set();
while ((match = regex.exec(html)) !== null) {
  htmlKeys.add(match[1]);
}

const css = fs.readFileSync('d:/Students/icons.css', 'utf8');
const cssRegex = /\[data-i18n="([^"]+)"\]/g;
const cssKeys = new Set();
while ((match = cssRegex.exec(css)) !== null) {
  cssKeys.add(match[1]);
}

// Ignore options (e.g., mkt_opt_, flt_, opt_, theme_, sess_class_opt)
const missing = [...htmlKeys].filter(k => !cssKeys.has(k) && !k.startsWith('opt_') && !k.startsWith('flt_') && !k.startsWith('mkt_opt_') && !k.startsWith('theme_') && k !== 'sess_class_opt');

console.log('Missing keys:', missing);
