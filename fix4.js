const fs = require('fs');

let cssCode = `
/* Danger Zone Buttons */
[data-i18n="btn_reset_term"]::before { content: "\\f1da"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_factory_reset"]::before { content: "\\f071"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
`;
fs.appendFileSync('d:/Students/icons.css', cssCode, 'utf8');
console.log('Added danger zone icons.');
