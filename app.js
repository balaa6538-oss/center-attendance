/***************
  مركز الحضور - بدون سيرفر
  تخزين على الجهاز: localStorage
****************/

// ====== إعدادات الدخول ======
const ADMIN_USER = "Admin";
const ADMIN_PASS = "####1111";

// ====== مفاتيح التخزين ======
const LS_KEY = "CENTER_DATA_V1";

// ====== أدوات مساعدة ======
function todayISO() {
  // yyyy-mm-dd
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeNumber(v) {
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : NaN;
}

function isFilledStudent(s) {
  // يعتبر "مليان" لو عنده اسم أو موبايل أو مدفوع
  return !!(s.name || s.phone || (s.paid && String(s.paid).trim() !== ""));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ====== حالة البرنامج ======
let state = {
  students: {}, // { "1": {id, name, grade, phone, paid, attendance: ["2026-02-05"] } ... }
  session: { isLogged: false }
};

// ====== تحميل / حفظ ======
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return false;
    if (!data.students || typeof data.students !== "object") return false;
    state.students = data.students;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify({ students: state.students }));
}

// ====== إنشاء 500 طالب ======
function ensureDefault500() {
  // لو مفيش داتا: اعمل 500
  if (Object.keys(state.students).length > 0) return;

  for (let i = 1; i <= 500; i++) {
    state.students[String(i)] = {
      id: i,
      name: "",
      grade: "",
      phone: "",
      paid: "",
      attendance: [] // تواريخ yyyy-mm-dd
    };
  }
  saveState();
}

// ====== فحص وجود طالب ======
function getStudentById(id) {
  return state.students[String(id)] || null;
}

function ensureIdExistsOrMsg(id, msgEl) {
  const s = getStudentById(id);
  if (!s) {
    if (msgEl) msgEl.innerHTML = `❌ هذا الـ ID غير موجود في قاعدة البيانات: <b>${esc(id)}</b>`;
    return null;
  }
  return s;
}

// ====== واجهة الدخول / الخروج ======
const loginBox = document.getElementById("loginBox");
const appBox = document.getElementById("appBox");

const userInp = document.getElementById("user");
const passInp = document.getElementById("pass");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const togglePass = document.getElementById("togglePass");

const exportExcelBtn = document.getElementById("exportExcelBtn");
const importExcelInput = document.getElementById("importExcelInput");
const logoutBtn = document.getElementById("logoutBtn");
const appContent = document.getElementById("appContent");

// زر العين
togglePass?.addEventListener("click", () => {
  if (passInp.type === "password") {
    passInp.type = "text";
    togglePass.textContent = "🙈";
  } else {
    passInp.type = "password";
    togglePass.textContent = "👁";
  }
});

// الدخول
loginBtn?.addEventListener("click", () => {
  const u = (userInp.value || "").trim();
  const p = (passInp.value || "").trim();

  if (u === ADMIN_USER && p === ADMIN_PASS) {
    state.session.isLogged = true;
    loginMsg.innerHTML = "✅ تم الدخول";
    showApp();
  } else {
    loginMsg.innerHTML = "❌ بيانات الدخول غير صحيحة";
  }
});

// خروج
logoutBtn?.addEventListener("click", () => {
  state.session.isLogged = false;
  showLogin();
});

// ====== بناء الواجهة ======
function showLogin() {
  loginBox.classList.remove("hidden");
  appBox.classList.add("hidden");
}

function showApp() {
  loginBox.classList.add("hidden");
  appBox.classList.remove("hidden");
  renderApp();
}

function renderApp() {
  const tdy = todayISO();

  appContent.innerHTML = `
    <div class="grid">

      <div class="card">
        <h2>سريع</h2>
        <p class="muted">
          لو بتشتغل بالموبايل: QR يفتح الموقع على طول بـ <b>?id=25</b> (لو إنت داخل)،
          ويسجل حضور تلقائي (لو اخترنا كده).<br>
          أو تسجل حضور يدوي من هنا.
        </p>

        <div class="row">
          <button id="quickAttendBtn" class="btn primary">سجل حضور</button>
          <input id="quickAttendId" class="inp" type="number" placeholder="اكتب ID هنا">
        </div>

        <hr>

        <h3>بحث فقط</h3>
        <p class="muted">يفتح بيانات الطالب بدون تسجيل حضور.</p>
        <div class="row">
          <button id="openOnlyBtn" class="btn">فتح</button>
          <input id="openOnlyId" class="inp" type="number" placeholder="اكتب ID هنا">
        </div>

        <hr>

        <div class="row">
          <button id="addStudentBtn" class="btn">+ إضافة طالب جديد (ID جديد)</button>
        </div>

        <div id="quickMsg" class="msg"></div>
      </div>

      <div class="card">
        <h2>حضور بتاريخ</h2>
        <p class="muted">اليوم تلقائي. تقدر تختار تاريخ تاني للعرض.</p>

        <div class="row">
          <button id="showAttendanceBtn" class="btn">عرض</button>
          <input id="attendanceDate" class="inp" type="date" value="${esc(tdy)}">
        </div>

        <div class="pillRow">
          <div class="pill" id="attDateLabel">التاريخ: ${esc(tdy)}</div>
          <div class="pill" id="attCountLabel">عدد الحضور: 0</div>
        </div>

        <div id="attList"></div>
      </div>

      <div class="card">
        <h2>بحث سريع</h2>
        <p class="muted">ابحث بالاسم أو الموبايل أو الـ ID</p>
        <input id="searchBox" class="inp" type="text" placeholder="ابحث بالاسم أو الموبايل أو ID">

        <div id="searchResults" class="list"></div>

        <hr>

        <h2>بيانات الطالب</h2>
        <div id="studentPanel">
          <p class="muted">افتح طالب من اليسار علشان تظهر بياناته هنا</p>
        </div>
      </div>

      <div class="card">
        <h2>إدارة البيانات</h2>
        <p class="muted">
          التصدير يطلع ملف Excel فيه شيتين (الطلاب + حضور اليوم).<br>
          الاستيراد يرجّع الداتا من Excel على نفس الجهاز.<br>
          <b>إعادة ضبط</b> تمسح كل الداتا من الجهاز (تحتاج كلمة المرور).
        </p>

        <div class="row">
          <button id="resetBtn" class="btn danger">🗑 إعادة ضبط / مسح كل البيانات</button>
        </div>

        <div id="adminMsg" class="msg"></div>
      </div>

    </div>
  `;

  // Events
  document.getElementById("quickAttendBtn").addEventListener("click", quickAttend);
  document.getElementById("openOnlyBtn").addEventListener("click", openOnly);

  document.getElementById("addStudentBtn").addEventListener("click", addStudent);
  document.getElementById("showAttendanceBtn").addEventListener("click", showAttendanceReport);

  document.getElementById("searchBox").addEventListener("input", onSearch);

  document.getElementById("resetBtn").addEventListener("click", resetAllData);

  // أول عرض تقرير اليوم
  showAttendanceReport();

  // دعم فتح من لينك QR: ?id=25
  handleQueryIdAuto();
}

// ====== فتح من QR: ?id=25 ======
function handleQueryIdAuto() {
  const params = new URLSearchParams(location.search);
  const idParam = params.get("id");
  if (!idParam) return;

  const id = safeNumber(idParam);
  const quickMsg = document.getElementById("quickMsg");
  if (!Number.isFinite(id)) return;

  // لو مش داخل: خليه يفتح صفحة الدخول فقط (بدون كشف بيانات)
  if (!state.session.isLogged) {
    return;
  }

  // لو داخل: افتح الطالب وسجل حضور تلقائي
  const s = ensureIdExistsOrMsg(id, quickMsg);
  if (!s) return;

  openStudentPanel(s.id);
  // حضور تلقائي
  const ok = markAttendanceToday(s.id);
  if (ok === "already") {
    quickMsg.innerHTML = `ℹ️ الطالب ID <b>${esc(id)}</b> مسجل حضور اليوم بالفعل.`;
  } else if (ok === true) {
    quickMsg.innerHTML = `✅ تم تسجيل حضور اليوم تلقائيًا للطالب ID <b>${esc(id)}</b>`;
    showAttendanceReport();
  }
}

// ====== حضور سريع ======
function quickAttend() {
  const id = safeNumber(document.getElementById("quickAttendId").value);
  const msg = document.getElementById("quickMsg");

  if (!Number.isFinite(id)) {
    msg.innerHTML = "❌ اكتب رقم ID صحيح";
    return;
  }

  const s = ensureIdExistsOrMsg(id, msg);
  if (!s) return;

  openStudentPanel(id);

  const res = markAttendanceToday(id);
  if (res === "already") {
    msg.innerHTML = `ℹ️ الطالب ID <b>${esc(id)}</b> مسجل حضور اليوم بالفعل`;
  } else {
    msg.innerHTML = `✅ تم تسجيل حضور اليوم للطالب ID <b>${esc(id)}</b>`;
    showAttendanceReport();
  }
}

// ====== فتح فقط ======
function openOnly() {
  const id = safeNumber(document.getElementById("openOnlyId").value);
  const msg = document.getElementById("quickMsg");

  if (!Number.isFinite(id)) {
    msg.innerHTML = "❌ اكتب رقم ID صحيح";
    return;
  }

  const s = ensureIdExistsOrMsg(id, msg);
  if (!s) return;

  openStudentPanel(id);
  msg.innerHTML = `✅ تم فتح الطالب ID <b>${esc(id)}</b>`;
}

// ====== إضافة طالب جديد ======
function addStudent() {
  const msg = document.getElementById("quickMsg");

  // اختار ID جديد: أكبر ID + 1
  const ids = Object.keys(state.students).map(x => parseInt(x, 10)).filter(Number.isFinite);
  const maxId = ids.length ? Math.max(...ids) : 0;
  const newId = maxId + 1;

  // أنشئ الطالب
  state.students[String(newId)] = {
    id: newId,
    name: "",
    grade: "",
    phone: "",
    paid: "",
    attendance: []
  };

  saveState();
  msg.innerHTML = `✅ تم إضافة طالب جديد بـ ID <b>${esc(newId)}</b>`;
  openStudentPanel(newId);
  showAttendanceReport();
  onSearch(); // يحدث البحث
}

// ====== لوحة بيانات الطالب ======
function openStudentPanel(id) {
  const panel = document.getElementById("studentPanel");
  const s = getStudentById(id);
  if (!s) {
    panel.innerHTML = `<p class="muted">❌ الطالب غير موجود</p>`;
    return;
  }

  const tdy = todayISO();
  const isTodayPresent = (s.attendance || []).includes(tdy);

  panel.innerHTML = `
    <div class="kv">
      <div><b>ID:</b> ${esc(s.id)}</div>
      <div><b>حضور اليوم:</b> ${isTodayPresent ? "✅ حاضر" : "❌ غير حاضر"}</div>
      <div><b>عدد أيام الحضور:</b> ${(s.attendance || []).length}</div>
    </div>

    <hr>

    <label class="lbl">الاسم</label>
    <input id="stName" class="inp" type="text" placeholder="اسم الطالب" value="${esc(s.name)}">

    <label class="lbl">الصف</label>
    <input id="stGrade" class="inp" type="text" placeholder="مثال: تمريض / الصف الأول..." value="${esc(s.grade)}">

    <label class="lbl">رقم الموبايل</label>
    <input id="stPhone" class="inp" type="text" placeholder="01xxxxxxxxx" value="${esc(s.phone)}">

    <label class="lbl">المدفوع</label>
    <input id="stPaid" class="inp" type="text" placeholder="مثال: 1500" value="${esc(s.paid)}">

    <div class="row">
      <button id="saveStudentBtn" class="btn primary">💾 حفظ بيانات الطالب</button>
      <button id="toggleTodayBtn" class="btn">${isTodayPresent ? "إلغاء حضور اليوم" : "تسجيل حضور اليوم"}</button>
    </div>

    <div id="studentMsg" class="msg"></div>

    <hr>

    <h3>سجل الحضور (آخر 25 تاريخ)</h3>
    <div class="list">
      ${(s.attendance || []).slice().reverse().slice(0, 25).map(d => `<div class="item">📅 ${esc(d)}</div>`).join("") || `<div class="muted">— لا يوجد —</div>`}
    </div>
  `;

  document.getElementById("saveStudentBtn").addEventListener("click", () => saveStudentData(id));
  document.getElementById("toggleTodayBtn").addEventListener("click", () => toggleTodayAttendance(id));
}

// حفظ بيانات الطالب
function saveStudentData(id) {
  const msg = document.getElementById("studentMsg");
  const s = getStudentById(id);
  if (!s) {
    msg.innerHTML = "❌ الطالب غير موجود";
    return;
  }

  s.name = (document.getElementById("stName").value || "").trim();
  s.grade = (document.getElementById("stGrade").value || "").trim();
  s.phone = (document.getElementById("stPhone").value || "").trim();
  s.paid = (document.getElementById("stPaid").value || "").trim();

  saveState();
  msg.innerHTML = "✅ تم حفظ البيانات";
  onSearch(); // تحديث البحث
}

// تسجيل حضور اليوم مع منع التكرار
function markAttendanceToday(id) {
  const s = getStudentById(id);
  if (!s) return false;

  const tdy = todayISO();
  s.attendance = s.attendance || [];

  if (s.attendance.includes(tdy)) return "already";
  s.attendance.push(tdy);

  saveState();
  return true;
}

// إلغاء حضور اليوم
function unmarkAttendanceToday(id) {
  const s = getStudentById(id);
  if (!s) return false;

  const tdy = todayISO();
  s.attendance = (s.attendance || []).filter(d => d !== tdy);

  saveState();
  return true;
}

function toggleTodayAttendance(id) {
  const msg = document.getElementById("studentMsg");
  const s = getStudentById(id);
  if (!s) {
    msg.innerHTML = "❌ الطالب غير موجود";
    return;
  }

  const tdy = todayISO();
  const isPresent = (s.attendance || []).includes(tdy);

  if (isPresent) {
    unmarkAttendanceToday(id);
    msg.innerHTML = "✅ تم إلغاء حضور اليوم";
  } else {
    markAttendanceToday(id);
    msg.innerHTML = "✅ تم تسجيل حضور اليوم";
  }

  openStudentPanel(id);
  showAttendanceReport();
}

// ====== تقرير الحضور ======
function getAttendanceForDate(dateISO) {
  const list = [];
  for (const k of Object.keys(state.students)) {
    const s = state.students[k];
    const att = s.attendance || [];
    if (att.includes(dateISO)) {
      list.push(s);
    }
  }
  // ترتيب حسب ID
  list.sort((a, b) => a.id - b.id);
  return list;
}

function showAttendanceReport() {
  const dateInp = document.getElementById("attendanceDate");
  const dateISO = (dateInp.value || todayISO()).trim();

  const attList = document.getElementById("attList");
  const attDateLabel = document.getElementById("attDateLabel");
  const attCountLabel = document.getElementById("attCountLabel");

  const list = getAttendanceForDate(dateISO);

  attDateLabel.textContent = `التاريخ: ${dateISO}`;
  attCountLabel.textContent = `عدد الحضور: ${list.length}`;

  if (!list.length) {
    attList.innerHTML = `<p class="muted">— لا يوجد حضور في هذا التاريخ —</p>`;
    return;
  }

  attList.innerHTML = `
    <div class="list">
      ${list.map(s => `
        <div class="item clickable" data-id="${esc(s.id)}">
          <b>${esc(s.name || "بدون اسم")}</b> — ID: ${esc(s.id)} — ${esc(s.phone || "بدون موبايل")}
        </div>
      `).join("")}
    </div>
  `;

  attList.querySelectorAll(".clickable").forEach(el => {
    el.addEventListener("click", () => {
      const id = safeNumber(el.getAttribute("data-id"));
      if (Number.isFinite(id)) openStudentPanel(id);
    });
  });
}

// ====== البحث السريع ======
function onSearch() {
  const q = (document.getElementById("searchBox")?.value || "").trim().toLowerCase();
  const out = document.getElementById("searchResults");
  if (!out) return;

  // لو فاضي: اعرض آخر 15 طالب "مليانين"
  let candidates = Object.values(state.students);

  if (q) {
    candidates = candidates.filter(s => {
      const idStr = String(s.id);
      const name = (s.name || "").toLowerCase();
      const phone = (s.phone || "").toLowerCase();
      const grade = (s.grade || "").toLowerCase();
      return idStr.includes(q) || name.includes(q) || phone.includes(q) || grade.includes(q);
    });
  } else {
    candidates = candidates.filter(isFilledStudent).slice().reverse();
  }

  candidates.sort((a, b) => a.id - b.id);

  const show = candidates.slice(0, 30);

  if (!show.length) {
    out.innerHTML = `<p class="muted">— لا يوجد نتائج —</p>`;
    return;
  }

  out.innerHTML = `
    <div class="list">
      ${show.map(s => `
        <div class="item clickable" data-id="${esc(s.id)}">
          <b>${esc(s.name || "بدون اسم")}</b>
          <div class="muted">ID: ${esc(s.id)} — ${esc(s.phone || "بدون موبايل")} — ${esc(s.grade || "")}</div>
        </div>
      `).join("")}
    </div>
  `;

  out.querySelectorAll(".clickable").forEach(el => {
    el.addEventListener("click", () => {
      const id = safeNumber(el.getAttribute("data-id"));
      if (Number.isFinite(id)) openStudentPanel(id);
    });
  });
}

// ====== التصدير Excel ======
exportExcelBtn?.addEventListener("click", () => {
  if (!window.XLSX) {
    alert("مكتبة Excel غير موجودة. تأكد أنك حاطط XLSX في index.html");
    return;
  }

  // شيت الطلاب: نصدر فقط اللي "مليان" + كمان نضمن وجود IDs كلها؟ (B: كل اللي مليان فقط)
  const filled = Object.values(state.students).filter(isFilledStudent);

  const studentsRows = [
    ["ID", "الاسم", "الصف", "الموبايل", "المدفوع", "عدد أيام الحضور", "آخر حضور"]
  ];

  filled.sort((a, b) => a.id - b.id).forEach(s => {
    const att = s.attendance || [];
    const last = att.length ? att.slice().sort().slice(-1)[0] : "";
    studentsRows.push([
      s.id,
      s.name || "",
      s.grade || "",
      s.phone || "",
      s.paid || "",
      att.length,
      last
    ]);
  });

  // شيت حضور اليوم
  const tdy = todayISO();
  const todayList = getAttendanceForDate(tdy);

  const attendanceRows = [
    ["التاريخ", tdy],
    [],
    ["ID", "الاسم", "الموبايل"]
  ];

  todayList.forEach(s => {
    attendanceRows.push([s.id, s.name || "", s.phone || ""]);
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(studentsRows);
  const ws2 = XLSX.utils.aoa_to_sheet(attendanceRows);

  XLSX.utils.book_append_sheet(wb, ws1, "الطلاب");
  XLSX.utils.book_append_sheet(wb, ws2, "الحضور");

  const fileName = `center-data-${tdy}.xlsx`;
  XLSX.writeFile(wb, fileName);
});

// ====== الاستيراد Excel ======
importExcelInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!window.XLSX) {
    alert("مكتبة Excel غير موجودة. تأكد أنك حاطط XLSX في index.html");
    return;
  }

  const pass = prompt("اكتب كلمة المرور للاستيراد:");
  if (pass !== ADMIN_PASS) {
    alert("❌ كلمة المرور غلط");
    importExcelInput.value = "";
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // نقرأ شيت "الطلاب" لو موجود، أو أول شيت
    const sheetName = wb.SheetNames.includes("الطلاب") ? "الطلاب" : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // نتوقع: header في أول صف
    // ["ID","الاسم","الصف","الموبايل","المدفوع",...]
    // نبني داتا جديدة مع الحفاظ على اللي مش موجود؟ (هنا: ندمج)
    let importedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 1) continue;
      const id = safeNumber(r[0]);
      if (!Number.isFinite(id)) continue;

      // لو الطالب مش موجود، ننشئه
      if (!state.students[String(id)]) {
        state.students[String(id)] = {
          id,
          name: "",
          grade: "",
          phone: "",
          paid: "",
          attendance: []
        };
      }

      const s = state.students[String(id)];
      s.name = String(r[1] ?? "").trim();
      s.grade = String(r[2] ?? "").trim();
      s.phone = String(r[3] ?? "").trim();
      s.paid = String(r[4] ?? "").trim();

      importedCount++;
    }

    saveState();
    alert(`✅ تم استيراد/تحديث ${importedCount} طالب`);
    renderApp();
  } catch (err) {
    console.error(err);
    alert("❌ حصل خطأ في الاستيراد. تأكد إن الملف هو نفس ملف التصدير.");
  } finally {
    importExcelInput.value = "";
  }
});

// ====== Reset ======
function resetAllData() {
  const pass = prompt("⚠️ اكتب كلمة المرور لمسح كل البيانات:");
  const adminMsg = document.getElementById("adminMsg");

  if (pass !== ADMIN_PASS) {
    adminMsg.innerHTML = "❌ كلمة المرور غلط";
    return;
  }

  const ok = confirm("متأكد؟ سيتم مسح كل البيانات من هذا الجهاز نهائيًا.");
  if (!ok) return;

  localStorage.removeItem(LS_KEY);
  state.students = {};
  ensureDefault500();
  adminMsg.innerHTML = "✅ تم مسح البيانات وإعادة إنشاء 500 ID";
  renderApp();
}

// ====== تشغيل أول مرة ======
(function init() {
  loadState();
  ensureDefault500();

  // لو عايز تبقى جلسة الدخول كل مرة لا، خليها false دائمًا
  // (حاليًا لازم تسجل دخول كل مرة تفتح الصفحة)
  state.session.isLogged = false;

  // عرض Login
  showLogin();
})();
