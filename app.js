/* ================================
   Center Attendance - app.js
   - LocalStorage DB
   - 500 default IDs (1..500)
   - Add new ID (501+)
   - Attendance today (auto) + cancel
   - Attendance report by date
   - Export/Import Excel (Students + Attendance sheets)
   - Smart Search with suggestions (name/mobile/id)
================================== */

(() => {
  "use strict";

  /* ---------- CONFIG ---------- */
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111";

  const DB_KEY = "center_attendance_db_v1";
  const LAST_LOGIN_KEY = "center_attendance_logged_in_v1";

  const DEFAULT_MAX_ID = 500;

  /* ---------- HELPERS ---------- */
  const $ = (id) => document.getElementById(id);

  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // 2026-02-06
  };

  const formatHumanDate = (iso) => {
    // iso: YYYY-MM-DD -> DD-MM-YYYY
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  };

  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalize = (s) =>
    String(s || "")
      .trim()
      .toLowerCase();

  const isFilledStudent = (st) => {
    if (!st) return false;
    return !!(st.name || st.grade || st.mobile || st.paid);
  };

  const showMsg = (el, text, ok = true) => {
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("ok", !!ok);
    el.classList.toggle("err", !ok);
  };

  const confirmPass = () => {
    const p = prompt("اكتب كلمة المرور لتأكيد العملية:");
    return p === ADMIN_PASS;
  };

  /* ---------- DB ---------- */
  const makeEmptyStudent = (id) => ({
    id,
    name: "",
    grade: "",
    mobile: "",
    paid: "",
    lastAttendance: "", // last attendance date ISO
    attendanceCount: 0, // number of attendance days
  });

  const makeEmptyDB = () => {
    const students = {};
    for (let i = 1; i <= DEFAULT_MAX_ID; i++) {
      students[i] = makeEmptyStudent(i);
    }
    return {
      version: 1,
      students, // { "1": {...}, ... }
      attendanceByDate: {}, // { "YYYY-MM-DD": [id, id, ...] }
    };
  };

  const loadDB = () => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const fresh = makeEmptyDB();
        saveDB(fresh);
        return fresh;
      }
      const db = JSON.parse(raw);

      // basic repair
      if (!db.students) db.students = {};
      if (!db.attendanceByDate) db.attendanceByDate = {};

      // ensure default IDs exist
      for (let i = 1; i <= DEFAULT_MAX_ID; i++) {
        if (!db.students[i]) db.students[i] = makeEmptyStudent(i);
      }

      return db;
    } catch (e) {
      const fresh = makeEmptyDB();
      saveDB(fresh);
      return fresh;
    }
  };

  const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  };

  let DB = loadDB();

  /* ---------- LOGIN ---------- */
  function isLoggedIn() {
    return localStorage.getItem(LAST_LOGIN_KEY) === "1";
  }

  function setLoggedIn(v) {
    localStorage.setItem(LAST_LOGIN_KEY, v ? "1" : "0");
  }

  function initLoginUI() {
    const loginBox = $("loginBox");
    const appBox = $("appBox");
    const loginBtn = $("loginBtn");
    const userInp = $("user");
    const passInp = $("pass");
    const loginMsg = $("loginMsg");
    const logoutBtn = $("logoutBtn");

    const showApp = () => {
      if (loginBox) loginBox.classList.add("hidden");
      if (appBox) appBox.classList.remove("hidden");
    };
    const showLogin = () => {
      if (appBox) appBox.classList.add("hidden");
      if (loginBox) loginBox.classList.remove("hidden");
    };

    if (isLoggedIn()) showApp();
    else showLogin();

    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        const u = (userInp?.value || "").trim();
        const p = (passInp?.value || "").trim();

        if (u === ADMIN_USER && p === ADMIN_PASS) {
          setLoggedIn(true);
          showMsg(loginMsg, "تم الدخول بنجاح ✅", true);
          showApp();
        } else {
          showMsg(loginMsg, "بيانات الدخول غير صحيحة ❌", false);
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        setLoggedIn(false);
        if (userInp) userInp.value = "";
        if (passInp) passInp.value = "";
        showMsg(loginMsg, "");
        showLogin();
      });
    }
  }

  /* ---------- STUDENT OPEN / EDIT ---------- */
  function getStudentById(id) {
    const sid = String(id);
    return DB.students[sid] || null;
  }

  function upsertStudent(st) {
    DB.students[String(st.id)] = st;
    saveDB(DB);
  }

  function ensureStudentExists(id) {
    const sid = String(id);
    if (!DB.students[sid]) DB.students[sid] = makeEmptyStudent(Number(id));
  }

  /* ---------- ATTENDANCE ---------- */
  function ensureDateList(dateISO) {
    if (!DB.attendanceByDate[dateISO]) DB.attendanceByDate[dateISO] = [];
  }

  function isPresentOn(dateISO, id) {
    ensureDateList(dateISO);
    return DB.attendanceByDate[dateISO].includes(Number(id));
  }

  function markPresent(dateISO, id) {
    ensureDateList(dateISO);
    const nid = Number(id);
    if (DB.attendanceByDate[dateISO].includes(nid)) return { ok: false, msg: "مسجل بالفعل" };

    DB.attendanceByDate[dateISO].push(nid);

    // update student stats
    const st = getStudentById(nid);
    if (st) {
      st.lastAttendance = dateISO;
      st.attendanceCount = safeNum(st.attendanceCount) + 1;
      upsertStudent(st);
    }
    saveDB(DB);
    return { ok: true, msg: "تم تسجيل الحضور ✅" };
  }

  function unmarkPresent(dateISO, id) {
    ensureDateList(dateISO);
    const nid = Number(id);
    const arr = DB.attendanceByDate[dateISO];
    const idx = arr.indexOf(nid);
    if (idx === -1) return { ok: false, msg: "غير مسجل في هذا التاريخ" };
    arr.splice(idx, 1);

    const st = getStudentById(nid);
    if (st) {
      // decrease count (best-effort)
      st.attendanceCount = Math.max(0, safeNum(st.attendanceCount) - 1);
      // lastAttendance: recompute latest date for this student
      st.lastAttendance = findLastAttendanceForStudent(nid) || "";
      upsertStudent(st);
    }
    saveDB(DB);
    return { ok: true, msg: "تم إلغاء حضور اليوم ✅" };
  }

  function findLastAttendanceForStudent(id) {
    const nid = Number(id);
    const dates = Object.keys(DB.attendanceByDate || {});
    dates.sort(); // ISO sort works
    let last = "";
    for (const d of dates) {
      if ((DB.attendanceByDate[d] || []).includes(nid)) last = d;
    }
    return last;
  }

  /* ---------- UI: STUDENT CARD ---------- */
  function renderStudentCard(st) {
    const box = $("studentBox");
    if (!box) return;

    if (!st) {
      box.innerHTML = `<div class="muted">افتح طالب علشان تظهر بياناته هنا</div>`;
      return;
    }

    const t = todayISO();
    const presentToday = isPresentOn(t, st.id);

    box.innerHTML = `
      <div class="studentCard">
        <div class="row head">
          <div><b>ID:</b> ${st.id}</div>
          <div><b>حضور اليوم:</b> ${presentToday ? "✅ حاضر" : "❌ غير حاضر"}</div>
          <div><b>عدد أيام الحضور:</b> ${safeNum(st.attendanceCount)}</div>
        </div>

        <div class="grid">
          <div>
            <label>الاسم</label>
            <input id="stName" class="inp" type="text" value="${escapeHtml(st.name)}" placeholder="اسم الطالب">
          </div>
          <div>
            <label>الصف</label>
            <input id="stGrade" class="inp" type="text" value="${escapeHtml(st.grade)}" placeholder="مثال: تمريض / الصف الأول">
          </div>
          <div>
            <label>رقم الموبايل</label>
            <input id="stMobile" class="inp" type="text" value="${escapeHtml(st.mobile)}" placeholder="01xxxxxxxxx">
          </div>
          <div>
            <label>المدفوع</label>
            <input id="stPaid" class="inp" type="number" value="${escapeHtml(st.paid)}" placeholder="مثال: 1500">
          </div>
        </div>

        <div class="row actions">
          <button id="saveStudentBtn" class="btn primary">حفظ البيانات</button>
          <button id="attTodayBtn" class="btn ${presentToday ? "secondary" : "success"}">
            ${presentToday ? "مسجل بالفعل" : "✅ سجل حضور اليوم"}
          </button>
          <button id="cancelTodayBtn" class="btn danger">❌ إلغاء حضور اليوم</button>
          <div class="muted small">آخر حضور: ${st.lastAttendance ? formatHumanDate(st.lastAttendance) : "—"}</div>
        </div>

        <div id="stMsg" class="msg"></div>
      </div>
    `;

    const stMsg = $("stMsg");
    const saveBtn = $("saveStudentBtn");
    const attBtn = $("attTodayBtn");
    const cancelBtn = $("cancelTodayBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const updated = { ...st };
        updated.name = ($("stName")?.value || "").trim();
        updated.grade = ($("stGrade")?.value || "").trim();
        updated.mobile = ($("stMobile")?.value || "").trim();
        updated.paid = ($("stPaid")?.value || "").trim();

        upsertStudent(updated);
        showMsg(stMsg, "تم حفظ البيانات ✅", true);
      });
    }

    if (attBtn) {
      attBtn.addEventListener("click", () => {
        const res = markPresent(todayISO(), st.id);
        showMsg(stMsg, res.msg, res.ok);
        renderStudentCard(getStudentById(st.id));
        renderAttendanceReport(); // refresh report if showing today
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        const res = unmarkPresent(todayISO(), st.id);
        showMsg(stMsg, res.msg, res.ok);
        renderStudentCard(getStudentById(st.id));
        renderAttendanceReport();
      });
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ---------- OPEN ID (Search only) ---------- */
  function initOpenById() {
    const openIdInp = $("openIdInp");
    const openBtn = $("openBtn");
    const openMsg = $("openMsg");

    const doOpen = () => {
      const id = Number((openIdInp?.value || "").trim());
      if (!Number.isInteger(id) || id <= 0) {
        showMsg(openMsg, "اكتب ID صحيح", false);
        return;
      }
      const st = getStudentById(id);
      if (!st) {
        showMsg(openMsg, "ID غير موجود. استخدم إضافة طالب جديد.", false);
        renderStudentCard(null);
        return;
      }
      showMsg(openMsg, `تم فتح الطالب ID=${id} ✅`, true);
      renderStudentCard(st);
    };

    if (openBtn) openBtn.addEventListener("click", doOpen);
    if (openIdInp) {
      openIdInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doOpen();
      });
    }
  }

  /* ---------- QUICK ATTEND (Manual) ---------- */
  function initQuickAttend() {
    const quickInp = $("quickAttendInp");
    const quickBtn = $("quickAttendBtn");
    const quickMsg = $("quickAttendMsg");

    const doAttend = () => {
      const id = Number((quickInp?.value || "").trim());
      if (!Number.isInteger(id) || id <= 0) {
        showMsg(quickMsg, "اكتب ID صحيح", false);
        return;
      }
      const st = getStudentById(id);
      if (!st) {
        showMsg(quickMsg, "ID غير موجود. استخدم إضافة طالب جديد.", false);
        return;
      }
      const res = markPresent(todayISO(), id);
      showMsg(quickMsg, res.msg, res.ok);
      renderStudentCard(getStudentById(id));
      renderAttendanceReport();
    };

    if (quickBtn) quickBtn.addEventListener("click", doAttend);
    if (quickInp) {
      quickInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doAttend();
      });
    }
  }

  /* ---------- ADD NEW STUDENT ID ---------- */
  function initAddNew() {
    const addInp = $("addNewIdInp");
    const addBtn = $("addNewBtn");
    const addMsg = $("addNewMsg");

    const doAdd = () => {
      const id = Number((addInp?.value || "").trim());
      if (!Number.isInteger(id) || id <= 0) {
        showMsg(addMsg, "اكتب ID صحيح", false);
        return;
      }
      if (getStudentById(id)) {
        showMsg(addMsg, "الـ ID موجود بالفعل", false);
        return;
      }
      // allow any ID > 0 (including 501+)
      ensureStudentExists(id);
      saveDB(DB);
      showMsg(addMsg, `تم إضافة ID=${id} ✅`, true);
      renderStudentCard(getStudentById(id));
    };

    if (addBtn) addBtn.addEventListener("click", doAdd);
    if (addInp) {
      addInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doAdd();
      });
    }
  }

  /* ---------- ATTENDANCE REPORT ---------- */
  function initAttendanceReport() {
    const dateInp = $("reportDateInp");
    const reportBtn = $("reportBtn");

    if (dateInp && !dateInp.value) dateInp.value = todayISO();

    if (reportBtn) {
      reportBtn.addEventListener("click", () => {
        renderAttendanceReport();
      });
    }

    if (dateInp) {
      dateInp.addEventListener("change", () => renderAttendanceReport());
    }

    renderAttendanceReport();
  }

  function renderAttendanceReport() {
    const dateInp = $("reportDateInp");
    const countEl = $("reportCount");
    const dateLabel = $("reportDateLabel");
    const listEl = $("reportList");

    const dateISO = (dateInp?.value || "").trim() || todayISO();
    ensureDateList(dateISO);
    const ids = [...DB.attendanceByDate[dateISO]].sort((a, b) => a - b);

    if (dateLabel) dateLabel.textContent = `التاريخ: ${formatHumanDate(dateISO)}`;
    if (countEl) countEl.textContent = `عدد الحضور: ${ids.length}`;

    if (!listEl) return;

    if (ids.length === 0) {
      listEl.innerHTML = `<div class="muted">— لا يوجد حضور في هذا التاريخ —</div>`;
      return;
    }

    const items = ids
      .map((id) => {
        const st = getStudentById(id);
        const nm = st?.name ? escapeHtml(st.name) : "بدون اسم";
        return `<div class="attItem"><b>${id}</b> — ${nm}</div>`;
      })
      .join("");

    listEl.innerHTML = items;
  }

  /* ---------- SMART SEARCH (Suggestions) ---------- */
  function initSmartSearch() {
    const inp = $("smartSearchInp");
    const list = $("smartSearchList"); // datalist
    const openBtn = $("smartOpenBtn");
    const msg = $("smartSearchMsg");

    if (!inp || !list) return;

    const buildSuggestions = (q) => {
      const query = normalize(q);
      list.innerHTML = "";
      if (query.length < 2) return;

      // collect candidates
      const results = [];
      const students = Object.values(DB.students || {});
      for (const st of students) {
        if (!st) continue;
        const idStr = String(st.id);
        const name = normalize(st.name);
        const mobile = normalize(st.mobile);

        const hit =
          idStr.startsWith(query) ||
          (name && name.includes(query)) ||
          (mobile && mobile.includes(query));

        if (!hit) continue;

        // prefer filled students first
        const score = (isFilledStudent(st) ? 1000 : 0) + (idStr.startsWith(query) ? 100 : 0);
        results.push({ st, score });
      }

      results.sort((a, b) => b.score - a.score);

      // limit suggestions
      const top = results.slice(0, 25);
      for (const r of top) {
        const st = r.st;
        const nm = st.name ? st.name : "بدون اسم";
        const mob = st.mobile ? st.mobile : "";
        const label = `${st.id} — ${nm}${mob ? " — " + mob : ""}`;
        const opt = document.createElement("option");
        opt.value = label;
        opt.setAttribute("data-id", String(st.id));
        list.appendChild(opt);
      }
    };

    const parseIdFromInput = (val) => {
      // expecting: "25 — Ahmed — 01..."
      const m = String(val || "").match(/^(\d+)\s*—/);
      if (m) return Number(m[1]);
      // or user typed a number only
      const n = Number(String(val || "").trim());
      return Number.isInteger(n) ? n : NaN;
    };

    inp.addEventListener("input", (e) => {
      buildSuggestions(e.target.value);
    });

    const doOpen = () => {
      const id = parseIdFromInput(inp.value);
      if (!Number.isInteger(id) || id <= 0) {
        showMsg(msg, "اكتب اسم/موبايل/ID صحيح", false);
        return;
      }
      const st = getStudentById(id);
      if (!st) {
        showMsg(msg, "ID غير موجود. استخدم إضافة طالب جديد.", false);
        return;
      }
      showMsg(msg, `تم فتح الطالب ID=${id} ✅`, true);
      renderStudentCard(st);
    };

    if (openBtn) openBtn.addEventListener("click", doOpen);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doOpen();
    });
  }

  /* ---------- RESET DATA (Local only) ---------- */
  function initResetBtn() {
    const btn = $("resetBtn");
    const msg = $("resetMsg");
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (!confirm("تحذير: سيتم مسح كل البيانات من هذا الجهاز فقط. هل أنت متأكد؟")) return;
      if (!confirmPass()) {
        showMsg(msg, "كلمة المرور غير صحيحة ❌", false);
        return;
      }
      DB = makeEmptyDB();
      saveDB(DB);
      showMsg(msg, "تم مسح البيانات ✅", true);
      renderStudentCard(null);
      renderAttendanceReport();
    });
  }

  /* ---------- EXCEL EXPORT/IMPORT ---------- */
  function initExcelButtons() {
    const expBtn = $("excelExportBtn");
    const impBtn = $("excelImportBtn");
    const msg = $("excelMsg");
    const fileInp = $("excelFileInp");

    if (expBtn) expBtn.addEventListener("click", () => exportExcel(msg));
    if (impBtn) impBtn.addEventListener("click", () => fileInp?.click());

    if (fileInp) {
      fileInp.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          await importExcel(file, msg);
        } catch (err) {
          showMsg(msg, "فشل الاستيراد ❌", false);
        } finally {
          fileInp.value = "";
        }
      });
    }
  }

  function exportExcel(msgEl) {
    try {
      if (typeof XLSX === "undefined") {
        showMsg(msgEl, "مكتبة Excel (XLSX) غير موجودة في الصفحة ❌", false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: Students (export only filled OR export all? -> export all to keep IDs)
      const students = Object.values(DB.students || {}).sort((a, b) => a.id - b.id);

      const rows = [
        ["ID", "الاسم", "الصف", "الموبايل", "المدفوع", "عدد أيام الحضور", "آخر حضور"],
      ];

      for (const st of students) {
        rows.push([
          st.id,
          st.name || "",
          st.grade || "",
          st.mobile || "",
          st.paid || "",
          safeNum(st.attendanceCount),
          st.lastAttendance || "",
        ]);
      }

      const ws1 = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws1, "الطلاب");

      // Sheet 2: Attendance by date (FULL attendance history)
      // Format: date, id, name
      const attRows = [["التاريخ", "ID", "الاسم"]];
      const dates = Object.keys(DB.attendanceByDate || {}).sort();
      for (const d of dates) {
        const ids = (DB.attendanceByDate[d] || []).slice().sort((a, b) => a - b);
        for (const id of ids) {
          const st = getStudentById(id);
          attRows.push([d, id, st?.name || ""]);
        }
      }
      const ws2 = XLSX.utils.aoa_to_sheet(attRows);
      XLSX.utils.book_append_sheet(wb, ws2, "الحضور");

      const filename = `center-data-${todayISO()}.xlsx`;
      XLSX.writeFile(wb, filename);

      showMsg(msgEl, "تم تصدير Excel ✅", true);
    } catch (e) {
      showMsg(msgEl, "فشل التصدير ❌", false);
    }
  }

  async function importExcel(file, msgEl) {
    if (typeof XLSX === "undefined") {
      showMsg(msgEl, "مكتبة Excel (XLSX) غير موجودة في الصفحة ❌", false);
      return;
    }

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });

    // Expected sheets: "الطلاب" and "الحضور"
    const studentsSheetName = wb.SheetNames.find((n) => normalize(n) === normalize("الطلاب")) || wb.SheetNames[0];
    const attendanceSheetName = wb.SheetNames.find((n) => normalize(n) === normalize("الحضور")) || null;

    // Parse students
    const wsStudents = wb.Sheets[studentsSheetName];
    const arrStudents = XLSX.utils.sheet_to_json(wsStudents, { header: 1, raw: true });
    // rows: [ID, الاسم, الصف, الموبايل, المدفوع, عدد أيام الحضور, آخر حضور]
    const header = arrStudents[0] || [];
    const rows = arrStudents.slice(1);

    // start from existing DB, but ensure base IDs exist
    const newDB = loadDB();

    for (const row of rows) {
      const id = Number(row[0]);
      if (!Number.isInteger(id) || id <= 0) continue;

      ensureStudentExistsInDB(newDB, id);

      const st = newDB.students[String(id)];
      st.name = String(row[1] ?? "").trim();
      st.grade = String(row[2] ?? "").trim();
      st.mobile = String(row[3] ?? "").trim();
      st.paid = String(row[4] ?? "").trim();

      // attendance stats
      st.attendanceCount = safeNum(row[5]);
      st.lastAttendance = String(row[6] ?? "").trim();

      newDB.students[String(id)] = st;
    }

    // Parse attendance history (A option)
    // Build attendanceByDate from sheet "الحضور"
    if (attendanceSheetName) {
      const wsAtt = wb.Sheets[attendanceSheetName];
      const arrAtt = XLSX.utils.sheet_to_json(wsAtt, { header: 1, raw: true });
      const attRows = arrAtt.slice(1);

      newDB.attendanceByDate = {};

      for (const r of attRows) {
        const dateISO = String(r[0] ?? "").trim(); // expecting YYYY-MM-DD
        const id = Number(r[1]);
        if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;
        if (!Number.isInteger(id) || id <= 0) continue;

        ensureDateListInDB(newDB, dateISO);
        if (!newDB.attendanceByDate[dateISO].includes(id)) {
          newDB.attendanceByDate[dateISO].push(id);
        }

        // also ensure student exists
        ensureStudentExistsInDB(newDB, id);
      }

      // After rebuild: recompute attendanceCount + lastAttendance from attendanceByDate (more accurate)
      recomputeAttendanceStats(newDB);
    }

    DB = newDB;
    saveDB(DB);

    showMsg(msgEl, "تم استيراد Excel ✅", true);
    renderStudentCard(null);
    renderAttendanceReport();
  }

  function ensureStudentExistsInDB(db, id) {
    const sid = String(id);
    if (!db.students[sid]) db.students[sid] = makeEmptyStudent(Number(id));
  }

  function ensureDateListInDB(db, dateISO) {
    if (!db.attendanceByDate[dateISO]) db.attendanceByDate[dateISO] = [];
  }

  function recomputeAttendanceStats(db) {
    // reset counts
    for (const st of Object.values(db.students || {})) {
      st.attendanceCount = 0;
      st.lastAttendance = "";
    }

    const dates = Object.keys(db.attendanceByDate || {}).sort();
    for (const d of dates) {
      const ids = db.attendanceByDate[d] || [];
      for (const id of ids) {
        const st = db.students[String(id)];
        if (!st) continue;
        st.attendanceCount = safeNum(st.attendanceCount) + 1;
        st.lastAttendance = d; // because dates sorted ascending, last assignment becomes latest
      }
    }
  }

  /* ---------- INIT ---------- */
  function init() {
    initLoginUI();
    initOpenById();
    initQuickAttend();
    initAddNew();
    initAttendanceReport();
    initSmartSearch();
    initResetBtn();
    initExcelButtons();

    // Default UI
    renderStudentCard(null);
  }

  // wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
