const fs = require('fs');

// 1. Fix app.js soundIcon and toggleRevBtn
let appCode = fs.readFileSync('d:/Students/app.js', 'utf8');

appCode = appCode.replaceAll(
  '$("soundIcon").innerText = window.isMuted ? "" : "";',
  '$("soundIcon").innerHTML = window.isMuted ? \'<i class="fa-solid fa-volume-xmark"></i>\' : \'<i class="fa-solid fa-volume-high"></i>\';'
);

appCode = appCode.replaceAll(
  '$("toggleRevBtn").textContent = isRevHidden ? "️‍️" : "️";',
  '$("toggleRevBtn").innerHTML = isRevHidden ? \'<i class="fa-solid fa-eye-slash"></i>\' : \'<i class="fa-solid fa-eye"></i>\';'
);

fs.writeFileSync('d:/Students/app.js', appCode, 'utf8');


// 2. Fix index.html topbar buttons and revenue stat card
let htmlCode = fs.readFileSync('d:/Students/index.html', 'utf8');

// Notifications Toggle Icon
htmlCode = htmlCode.replace(
  '<div id="notificationsToggleBtn" class="topbar-icon-btn" title="رسائل وإشعارات" style="position: relative; cursor: pointer;">\r\n        ️\r\n',
  '<div id="notificationsToggleBtn" class="topbar-icon-btn" title="رسائل وإشعارات" style="position: relative; cursor: pointer;">\r\n        <i class="fa-regular fa-bell"></i>\r\n'
);
// In case line endings are \n only
htmlCode = htmlCode.replace(
  '<div id="notificationsToggleBtn" class="topbar-icon-btn" title="رسائل وإشعارات" style="position: relative; cursor: pointer;">\n        ️\n',
  '<div id="notificationsToggleBtn" class="topbar-icon-btn" title="رسائل وإشعارات" style="position: relative; cursor: pointer;">\n        <i class="fa-regular fa-bell"></i>\n'
);

// User Profile / Quick Controls Toggle Icon
htmlCode = htmlCode.replace(
  '<button id="userProfileToggleBtn" class="topbar-icon-btn" title="قائمة النظام والخروج">️</button>',
  '<button id="userProfileToggleBtn" class="topbar-icon-btn" title="قائمة النظام والخروج"><i class="fa-solid fa-sliders"></i></button>'
);

// Quick Controls Title (remove the empty variant selector)
htmlCode = htmlCode.replace(
  'data-i18n="quick_controls_title">️ قائمة التحكم السريعة</div>',
  'data-i18n="quick_controls_title">قائمة التحكم السريعة</div>'
);

// Notifications Dropdown Title
htmlCode = htmlCode.replace(
  '<span>️ رسائل وإشعارات</span>',
  '<span><i class="fa-regular fa-bell"></i> رسائل وإشعارات</span>'
);

// Make Revenue stat card clickable like the others
htmlCode = htmlCode.replace(
  '<span class="stat-pill adminOnly">',
  '<span class="stat-pill adminOnly clickable" onclick="window.switchTab(\'finance\')">'
);

fs.writeFileSync('d:/Students/index.html', htmlCode, 'utf8');
console.log('Fixed topbar, icons and revenue stat card.');
