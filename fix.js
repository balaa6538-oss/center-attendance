const fs = require('fs');

let code = fs.readFileSync('d:/Students/app.js', 'utf8');

const replacements = [
  { search: '<span>️ ${msg}</span>', replace: '<span><i class="fa-solid fa-circle-info"></i> ${msg}</span>' },
  { search: 'window.deleteStudentPayment(${i})" title="${t(\'btn_del_payment\')}">️</button>', replace: 'window.deleteStudentPayment(${i})" title="${t(\'btn_del_payment\')}"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: 'window.deleteSyllabus(${i})">️</button>', replace: 'window.deleteSyllabus(${i})"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: 'edit-note-btn" data-index="${i}" title="${t(\'btn_edit_note\')}">️</button>', replace: 'edit-note-btn" data-index="${i}" title="${t(\'btn_edit_note\')}"><i class="fa-solid fa-pen-to-square"></i></button>' },
  { search: 'delete-note-btn" data-index="${i}" title="${t(\'btn_del_note\')}">️</button>', replace: 'delete-note-btn" data-index="${i}" title="${t(\'btn_del_note\')}"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: 'addNewPkgBtn">إضافة</button>', replace: 'addNewPkgBtn"><i class="fa-solid fa-plus"></i> إضافة</button>' },
  { search: 'delete-pkg-btn" data-group="${g}" title="حذف الباقة">️</button>', replace: 'delete-pkg-btn" data-group="${g}" title="حذف الباقة"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: '"window.deleteAssistant(\'${key}\')" style="display:flex;align-items:center;gap:5px;">', replace: '"window.deleteAssistant(\'${key}\')" style="display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-trash-can"></i> ' },
  { search: '"window.extOpen(\'${r.st.id}\')">فتح</button>', replace: '"window.extOpen(\'${r.st.id}\')"><i class="fa-solid fa-folder-open"></i> فتح</button>' },
  { search: '"window.approveRequest(\'${r.id}\')">قبول</button>', replace: '"window.approveRequest(\'${r.id}\')"><i class="fa-solid fa-check"></i> قبول</button>' },
  { search: '"window.rejectRequest(\'${r.id}\')">رفض</button>', replace: '"window.rejectRequest(\'${r.id}\')"><i class="fa-solid fa-xmark"></i> رفض</button>' },
  { search: 'msgTabMessages" onclick="window.switchMsgTab(\'messages\')">الرسائل</button>', replace: 'msgTabMessages" onclick="window.switchMsgTab(\'messages\')"><i class="fa-solid fa-envelope"></i> الرسائل</button>' },
  { search: 'msgTabActivity" onclick="window.switchMsgTab(\'activity\')">سجل العمليات</button>', replace: 'msgTabActivity" onclick="window.switchMsgTab(\'activity\')"><i class="fa-solid fa-clock-rotate-left"></i> سجل العمليات</button>' },
  { search: 'window.open(\'https://wa.me/20${item.phone}\', \'_blank\')"></button>', replace: 'window.open(\'https://wa.me/20${item.phone}\', \'_blank\')"><i class="fa-brands fa-whatsapp"></i></button>' },
  { search: 'delete-sess-btn" data-date="${d}" data-index="${i}" title="حذف وإلغاء الدفعة">️</button>', replace: 'delete-sess-btn" data-date="${d}" data-index="${i}" title="حذف وإلغاء الدفعة"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: 'sellBookletCopy(\'${id}\')">', replace: 'sellBookletCopy(\'${id}\')"><i class="fa-solid fa-cart-shopping"></i> ' },
  { search: 'returnBookletCopy(\'${id}\')"></button>', replace: 'returnBookletCopy(\'${id}\')"><i class="fa-solid fa-rotate-left"></i></button>' },
  { search: 'editBookletQty(\'${id}\')">️</button>', replace: 'editBookletQty(\'${id}\')"><i class="fa-solid fa-pen-to-square"></i></button>' },
  { search: 'deleteBooklet(\'${id}\')">️</button>', replace: 'deleteBooklet(\'${id}\')"><i class="fa-solid fa-trash-can"></i></button>' },
  { search: '"window.restoreSt(\'${id}\')">استرجاع</button>', replace: '"window.restoreSt(\'${id}\')"><i class="fa-solid fa-rotate-left"></i> استرجاع</button>' }
];

let changed = 0;
for (let r of replacements) {
    if (code.includes(r.search)) {
        code = code.split(r.search).join(r.replace);
        changed++;
    } else {
        console.log('Could not find:', r.search);
    }
}
fs.writeFileSync('d:/Students/app.js', code, 'utf8');
console.log('Replaced', changed, 'items in app.js');

// Fix index.html eye buttons
let indexHtml = fs.readFileSync('d:/Students/index.html', 'utf8');
const indexReplacements = [
  { search: '<button id="toggleManagerPass" class="eyeBtn" type="button" onclick="togglePassword(\'managerPass\')">️</button>', replace: '<button id="toggleManagerPass" class="eyeBtn" type="button" onclick="togglePassword(\'managerPass\')"><i class="fa-solid fa-eye"></i></button>' },
  { search: '<button id="toggleAssistantPass" class="eyeBtn" type="button" onclick="togglePassword(\'assistantPass\')">️</button>', replace: '<button id="toggleAssistantPass" class="eyeBtn" type="button" onclick="togglePassword(\'assistantPass\')"><i class="fa-solid fa-eye"></i></button>' },
  { search: '<div style="text-align:center;color:#888;padding:10px;">لا توجد رسائل</div>', replace: '<div style="text-align:center;color:#888;padding:10px;"><i class="fa-solid fa-comment-slash" style="font-size:24px;margin-bottom:8px;"></i><br>لا توجد رسائل</div>' }
];
let idxChanged = 0;
for (let r of indexReplacements) {
    if (indexHtml.includes(r.search)) {
        indexHtml = indexHtml.split(r.search).join(r.replace);
        idxChanged++;
    } else {
        console.log('Could not find in index.html:', r.search);
    }
}
// Also update the app.js "لا توجد رسائل"
code = code.split('<div style="text-align:center;color:#888;padding:10px;">لا توجد رسائل</div>').join('<div style="text-align:center;color:#888;padding:10px;"><i class="fa-solid fa-comment-slash" style="font-size:24px;margin-bottom:8px;"></i><br>لا توجد رسائل</div>');
fs.writeFileSync('d:/Students/app.js', code, 'utf8');

fs.writeFileSync('d:/Students/index.html', indexHtml, 'utf8');
console.log('Replaced', idxChanged, 'items in index.html');
