const fs = require('fs');

let htmlCode = fs.readFileSync('d:/Students/index.html', 'utf8');

// Replace "الوضع الفاتح" with "الوضع النهاري"
htmlCode = htmlCode.replaceAll('الوضع الفاتح', 'الوضع النهاري');

// Replace specific hardcoded empty emojis inside buttons
htmlCode = htmlCode.replace(
  '<button class="btn success hidden" id="syncNowBtn" style="padding:12px; flex:0.3;" title="Manual Sync">️</button>',
  '<button class="btn success hidden" id="syncNowBtn" style="padding:12px; flex:0.3;" title="Manual Sync"><i class="fa-solid fa-rotate"></i></button>'
);

htmlCode = htmlCode.replace(
  '<button class="btn danger" id="removeBgBtn" title="إزالة الخلفية" style="padding: 10px 15px;">️</button>',
  '<button class="btn danger" id="removeBgBtn" title="إزالة الخلفية" style="padding: 10px 15px;"><i class="fa-solid fa-trash-can"></i></button>'
);

htmlCode = htmlCode.replace(
  '<span class="nav-icon">️</span>',
  '<span class="nav-icon"><i class="fa-solid fa-circle-dot" style="font-size:0.5em; opacity:0.5;"></i></span>'
);
htmlCode = htmlCode.replace(
  '<span class="nav-icon">️</span>',
  '<span class="nav-icon"><i class="fa-solid fa-circle-dot" style="font-size:0.5em; opacity:0.5;"></i></span>'
);
htmlCode = htmlCode.replace(
  '<span class="nav-icon">️</span>',
  '<span class="nav-icon"><i class="fa-solid fa-circle-dot" style="font-size:0.5em; opacity:0.5;"></i></span>'
);

// Delete all remaining invisible ️ variant selectors
htmlCode = htmlCode.replaceAll('️', '');

fs.writeFileSync('d:/Students/index.html', htmlCode, 'utf8');

// Append new CSS icons to icons.css
let cssCode = `

/* Extra Settings & General System Icons */
[data-i18n="btn_export_ex"]::before { content: "\\f1c3"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_import_ex"]::before { content: "\\f56f"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_drive_login"]::before { content: "\\f3aa"; font-family: "Font Awesome 6 Brands"; font-weight: 400; margin-inline-end: 8px; }
[data-i18n="btn_drive_restore"]::before { content: "\\f0ed"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_recycle"]::before { content: "\\f2ed"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_change_bg"]::before { content: "\\f03e"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_change_lang"]::before { content: "\\f0ac"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="btn_group_fees"]::before { content: "\\f53a"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="lbl_theme"]::before { content: "\\f53f"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="set_data_title"]::before { content: "\\f0c7"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--success); }
[data-i18n="set_ui_title"]::before { content: "\\f53f"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="set_fin_title"]::before { content: "\\f53a"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--warning); }
[data-i18n="set_danger_title"]::before { content: "\\f071"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--danger); }
[data-i18n="btn_export_colored"]::before { content: "\\f1c3"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="lbl_last_scan"]::before { content: "\\f017"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--text-secondary); }
[data-i18n="wait_scan"]::before { content: "\\f029"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; }
[data-i18n="search_title"]::before { content: "\\f002"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="add_title"]::before { content: "\\f234"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="quick_title"]::before { content: "\\f0e7"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="st_details"]::before { content: "\\f2bb"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="rank_warn"]::before { content: "\\f071"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
[data-i18n="rank_normal"]::before { content: "\\f00c"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
[data-i18n="lbl_remaining"]::before { content: "\\f53a"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
[data-i18n="flt_partial"]::before { content: "\\f542"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
[data-i18n="syll_update_title"]::before { content: "\\f02d"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="settings_title"]::before { content: "\\f013"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }
[data-i18n="debtors_list_title"]::before { content: "\\f071"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--danger); }
[data-i18n="btn_confirm"]::before { content: "\\f00c"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
[data-i18n="modal_grp_fees"]::before { content: "\\f53a"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 8px; color: var(--primary); }

/* Quick fix for table cloud status */
th[style*="font-weight:700"]::before { content: "\\f0c2"; font-family: "Font Awesome 6 Free"; font-weight: 900; margin-inline-end: 5px; }
`;
fs.appendFileSync('d:/Students/icons.css', cssCode, 'utf8');
console.log('Fixed Light Mode text and added all missing icons.');
