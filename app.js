/* =========================
   Center Attendance (Offline)
   Rule A:
   - IDs 1..500 exist by default
   - IDs > 500 must be added manually
   - No auto-create for unknown IDs
   Data saved in localStorage
========================= */

(() => {
  const BASE_MAX_ID = 500;

  // -------- Storage Keys --------
  const LS_STUDENTS = "ca_students_v1";
  const LS_AUTH = "ca_auth_v1";
  const LS_EXTRA_IDS = "ca_extra_ids_v1"; // manually added IDs list (numbers)

  // -------- Admin Credentials (EDIT IF YOU WANT) --------
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111";

  // -------- Helpers --------
  const $ = (sel) => document.querySelector(sel);

  function todayISO() {
    // YYYY-MM-DD
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function prettyDate(iso) {
    // iso: YYYY-MM-DD -> DD-MM-YYYY
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }

  function parseId(v) {
    const s = String(v ?? "").trim();
    if (!s) return null;
    if (!/^\d+$/.test(s)) return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // -------- Data Model --------
  // students: { [id:number]: { id, name, grade, phone, paid, attendance: [YYYY-MM-DD,...] } }
  function ensureBaseStudents() {
    const students = loadJSON(LS_STUDENTS, null);
    if (students && typeof students === "object") return students;

    const init = {};
    for (let i = 1; i <= BASE_MAX_ID; i++) {
      init[i] = {
        id: i,
        name: "",
        grade: "",
        phone: "",
        paid: "",
        attendance: []
      };
    }
    saveJSON(LS_STUDENTS, init);
    saveJSON(LS_EXTRA_IDS, []); // none added yet
    return init;
  }

  function getStudents() {
    return ensureBaseStudents();
  }

  function setStudents(students) {
    saveJSON(LS_STUDENTS, students);
  }

  function getExtraIds() {
    const arr = loadJSON(LS_EXTRA_IDS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function setExtraIds(arr) {
    saveJSON(LS_EXTRA_IDS, arr);
  }

  // Rule A existence:
  // - exists if 1..500
  // - or manually added (in extra IDs) AND present in students map
  function idExists(id) {
    if (id >= 1 && id <= BASE_MAX_ID) return true;
    const extra = getExtraIds();
    return extra.includes(id);
  }

  function requireExistingId(id) {
    if (!idExists(id)) return { ok: false, msg: "❌ هذا الـ ID غير موجود في قاعدة البيانات." };
    return { ok: true, msg: "" };
  }

  function getOrCreateStudentRecord(id) {
    // only allowed for existing ids (base) OR added ids.
    const students = getStudents();
    if (!students[id]) {
      // create record only if allowed
      if (!idExists(id)) return null;
      students[id] = {
        id,
        name: "",
        grade: "",
        phone: "",
        paid: "",
        attendance: []
      };
      setStudents(students);
    }
    return students[id];
  }

  function addNewStudentId(id) {
    // add manual ID (>500 or any missing)
    const n = parseId(id);
    if (!n) return { ok: false, msg: "❌ اكتب ID صحيح (أرقام فقط)." };

    if (n >= 1 && n <= BASE_MAX_ID) {
      // already part of base
      return { ok: true, msg: "✅ هذا الـ ID موجود بالفعل ضمن 1..500." };
    }

    const extra = getExtraIds();
    if (!extra.includes(n)) extra.push(n);
    extra.sort((a, b) => a - b);
    setExtraIds(extra);

    // ensure record exists
    getOrCreateStudentRecord(n);

    return { ok: true, msg: `✅ تم إضافة ID جديد: ${n}` };
  }

  function markAttendance(id, dateISO) {
    const chk = requireExistingId(id);
    if (!chk.ok) return chk;

    const rec = getOrCreateStudentRecord(id);
    if (!rec) return { ok: false, msg: "❌ غير موجود." };

    if (!Array.isArray(rec.attendance)) rec.attendance = [];
    if (rec.attendance.includes(dateISO)) {
      return { ok: true, msg: "ℹ️ مسجل حضور بالفعل اليوم (لن يتم التكرار)." };
    }
    rec.attendance.push(dateISO);
    rec.attendance.sort();
    const students = getStudents();
    students[id] = rec;
    setStudents(students);
    return { ok: true, msg: "✅ تم تسجيل الحضور." };
  }

  function unmarkAttendance(id, dateISO) {
    const chk = requireExistingId(id);
    if (!chk.ok) return chk;

    const rec = getOrCreateStudentRecord(id);
    if (!rec) return { ok: false, msg: "❌ غير موجود." };

    if (!Array.isArray(rec.attendance)) rec.attendance = [];
    rec.attendance = rec.attendance.filter(d => d !== dateISO);
    const students = getStudents();
    students[id] = rec;
    setStudents(students);
    return { ok: true, msg: "✅ تم إلغاء حضور اليوم." };
  }

  function getAttendanceListByDate(dateISO) {
    const students = getStudents();
    const ids = Object.keys(students).map(Number).filter(n => Number.isFinite(n));
    ids.sort((a, b) => a - b);

    const present = [];
    for (const id of ids) {
      const s = students[id];
      const att = Array.isArray(s.attendance) ? s.attendance : [];
      if (att.includes(dateISO)) {
        present.push(s);
      }
    }
    return present;
  }

  // -------- Auth --------
  function isAuthed() {
    const a = loadJSON(LS_AUTH, null);
    return !!(a && a.ok === true);
  }

  function setAuthed(v) {
    if (v) saveJSON(LS_AUTH, { ok: true, at: Date.now() });
    else localStorage.removeItem(LS_AUTH);
  }

  // -------- UI (Self-Contained) --------
  function mountUI() {
    // Keep your existing CSS if present; add minimal fallback
    const style = document.createElement("style");
    style.textContent = `
      :root{font-family:system-ui,Segoe UI,Tahoma,Arial; direction:rtl}
      body{margin:0; background:#f6f7fb}
      .wrap{max-width:1100px;margin:0 auto;padding:16px}
      .grid{display:grid;grid-template-columns:1fr;gap:12px}
      @media (min-width:900px){.grid{grid-template-columns:1.2fr 1fr}}
      .card{background:#fff;border:1px solid #e6e8f0;border-radius:14px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
      h1,h2,h3{margin:0 0 10px}
      h1{font-size:28px}
      h2{font-size:20px}
      .muted{color:#666;font-size:14px}
      .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .col{display:flex;flex-direction:column;gap:8px}
      .inp{width:100%;padding:10px 12px;border:1px solid #d7dbe7;border-radius:10px;font-size:16px}
      .btn{padding:10px 12px;border:1px solid #d7dbe7;border-radius:10px;background:#fff;cursor:pointer}
      .btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
      .btn.danger{background:#ef4444;color:#fff;border-color:#ef4444}
      .btn.gray{background:#f3f4f6}
      .msg{margin-top:8px;font-size:14px}
      .ok{color:#0f766e}
      .err{color:#b91c1c}
      .pill{display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #e6e8f0;border-radius:999px;background:#fafafa}
      .split{display:flex;gap:10px;align-items:stretch}
      .split .inp{flex:1}
      .eyeWrap{position:relative; flex:1}
      .eyeBtn{position:absolute;left:8px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;font-size:18px}
      .list{margin:0;padding:0;list-style:none;max-height:280px;overflow:auto;border:1px solid #eee;border-radius:10px}
      .list li{padding:10px 12px;border-bottom:1px solid #eee}
      .list li:last-child{border-bottom:none}
      .kbd{font-family:ui-monospace,Consolas,monospace;background:#f3f4f6;padding:2px 6px;border-radius:6px}
    `;
    document.head.appendChild(style);

    document.body.innerHTML = `
      <div class="wrap">
        <div id="loginView" class="card" style="max-width:520px;margin:30px auto;">
          <h1>دخول لوحة السنتر</h1>
          <div class="muted">الدخول للمسؤول فقط</div>
          <div style="height:10px"></div>

          <div class="col">
            <label>اسم المستخدم</label>
            <input id="user" class="inp" type="text" placeholder="اسم المستخدم" autocomplete="username">
            
            <label>كلمة المرور</label>
            <div class="eyeWrap">
              <input id="pass" class="inp" type="password" placeholder="كلمة المرور" autocomplete="current-password">
              <button id="togglePass" class="eyeBtn" title="إظهار/إخفاء">👁️</button>
            </div>

            <button id="loginBtn" class="btn primary">دخول</button>
            <div id="loginMsg" class="msg"></div>
          </div>
        </div>

        <div id="appView" style="display:none">
          <div class="row" style="justify-content:space-between;margin-bottom:12px">
            <h1 style="margin:0">نظام تسجيل حضور QR</h1>
            <button id="logoutBtn" class="btn danger">خروج</button>
          </div>

          <div class="grid">
            <!-- RIGHT -->
            <div class="card">
              <h2>سريع</h2>
              <div class="muted">
                لو بتستخدم QR خارجي: افتح QR → هيفتح لينك فيه <span class="kbd">?id=25</span>  
                (لو أنت داخل) هيسجل حضور تلقائي.
              </div>

              <div style="height:10px"></div>

              <h3 style="margin-top:0">تسجيل حضور سريع (يدوي)</h3>
              <div class="split">
                <input id="quickAttendId" class="inp" inputmode="numeric" placeholder="اكتب ID هنا">
                <button id="quickAttendBtn" class="btn primary">سجّل حضور</button>
              </div>
              <div id="quickAttendMsg" class="msg"></div>

              <div style="height:14px"></div>

              <h3 style="margin-top:0">بحث فقط</h3>
              <div class="split">
                <input id="openOnlyId" class="inp" inputmode="numeric" placeholder="اكتب ID هنا">
                <button id="openOnlyBtn" class="btn">فتح</button>
              </div>
              <div id="openOnlyMsg" class="msg"></div>

              <div style="height:14px"></div>

              <div class="row" style="justify-content:space-between">
                <h3 style="margin:0">إضافة طالب جديد (ID)</h3>
                <div class="muted">اختياري</div>
              </div>

              <div class="split">
                <input id="addNewId" class="inp" inputmode="numeric" placeholder="مثال: 501">
                <button id="addNewBtn" class="btn gray">إضافة</button>
              </div>
              <div id="addNewMsg" class="msg"></div>

              <hr style="border:none;border-top:1px solid #eee;margin:16px 0">

              <h2>حضور بتاريخ</h2>
              <div class="muted">اليوم تلقائيًا — تقدر تختار تاريخ ثاني.</div>
              <div style="height:8px"></div>

              <div class="row">
                <input id="datePick" class="inp" type="date" style="max-width:220px">
                <button id="showDateBtn" class="btn">عرض</button>
              </div>

              <div class="row" style="margin-top:10px;gap:10px">
                <div class="pill"><b>التاريخ:</b> <span id="dateLabel"></span></div>
                <div class="pill"><b>عدد الحضور:</b> <span id="dateCount">0</span></div>
              </div>

              <div style="height:10px"></div>
              <ul id="dateList" class="list"></ul>
            </div>

            <!-- LEFT -->
            <div class="card">
              <h2>بيانات الطالب</h2>
              <div id="studentHint" class="muted">افتح طالب علشان تظهر بياناته هنا.</div>

              <div id="studentBox" style="display:none">
                <div class="row" style="justify-content:space-between; align-items:center">
                  <div class="pill"><b>ID:</b> <span id="sid"></span></div>
                  <div class="pill"><b>حضور اليوم:</b> <span id="todayState">—</span></div>
                </div>

                <div style="height:12px"></div>

                <div class="col">
                  <label>الاسم</label>
                  <input id="sname" class="inp" type="text" placeholder="اسم الطالب">

                  <label>الصف</label>
                  <input id="sgrade" class="inp" type="text" placeholder="مثال: تمريض / سنة أولى">

                  <label>رقم الموبايل</label>
                  <input id="sphone" class="inp" type="text" placeholder="01xxxxxxxxx">

                  <label>المدفوع</label>
                  <input id="spaid" class="inp" type="text" placeholder="مثال: 1500">
                </div>

                <div style="height:12px"></div>

                <div class="row" style="gap:10px">
                  <button id="saveStudentBtn" class="btn primary">حفظ البيانات</button>
                  <button id="toggleTodayBtn" class="btn">تسجيل/إلغاء حضور اليوم</button>
                </div>

                <div id="studentMsg" class="msg"></div>

                <div style="height:12px"></div>

                <h3 style="margin:0">سجل الحضور (آخر 25 تاريخ)</h3>
                <div class="muted">بدون تكرار في نفس اليوم.</div>
                <div style="height:8px"></div>
                <ul id="attList" class="list"></ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Init date picker
    const dp = $("#datePick");
    dp.value = todayISO();
  }

  // -------- App Logic --------
  let currentStudentId = null;

  function showMsg(el, text, ok = true) {
    if (!el) return;
    el.textContent = text || "";
    el.className = "msg " + (text ? (ok ? "ok" : "err") : "");
  }

  function openStudent(id) {
    const chk = requireExistingId(id);
    if (!chk.ok) {
      showMsg($("#openOnlyMsg"), chk.msg, false);
      return;
    }

    const rec = getOrCreateStudentRecord(id);
    if (!rec) {
      showMsg($("#openOnlyMsg"), "❌ غير موجود.", false);
      return;
    }

    currentStudentId = id;

    $("#studentHint").style.display = "none";
    $("#studentBox").style.display = "block";

    $("#sid").textContent = String(id);
    $("#sname").value = rec.name || "";
    $("#sgrade").value = rec.grade || "";
    $("#sphone").value = rec.phone || "";
    $("#spaid").value = rec.paid || "";

    refreshTodayState();
    renderAttendanceList();
    showMsg($("#studentMsg"), "", true);
  }

  function refreshTodayState() {
    if (!currentStudentId) return;
    const rec = getOrCreateStudentRecord(currentStudentId);
    const t = todayISO();
    const has = Array.isArray(rec.attendance) && rec.attendance.includes(t);
    $("#todayState").textContent = has ? "✅ حاضر" : "❌ غير حاضر";
    $("#toggleTodayBtn").textContent = has ? "إلغاء حضور اليوم" : "تسجيل حضور اليوم";
  }

  function renderAttendanceList() {
    if (!currentStudentId) return;
    const rec = getOrCreateStudentRecord(currentStudentId);
    const ul = $("#attList");
    ul.innerHTML = "";

    const att = Array.isArray(rec.attendance) ? [...rec.attendance] : [];
    att.sort().reverse(); // latest first
    const slice = att.slice(0, 25);

    if (slice.length === 0) {
      const li = document.createElement("li");
      li.textContent = "لا يوجد حضور مسجل.";
      ul.appendChild(li);
      return;
    }

    for (const d of slice) {
      const li = document.createElement("li");
      li.innerHTML = `<div class="row" style="justify-content:space-between">
        <span>${prettyDate(d)}</span>
        <button class="btn" data-del="${d}" style="padding:6px 10px">✖</button>
      </div>`;
      ul.appendChild(li);
    }

    ul.querySelectorAll("button[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-del");
        const res = unmarkAttendance(currentStudentId, d);
        showMsg($("#studentMsg"), res.msg, res.ok);
        refreshTodayState();
        renderAttendanceList();
        // refresh date list if viewing same date
        refreshDatePanel();
      });
    });
  }

  function saveStudent() {
    if (!currentStudentId) return;
    const students = getStudents();
    const rec = students[currentStudentId] || getOrCreateStudentRecord(currentStudentId);

    rec.name = ($("#sname").value || "").trim();
    rec.grade = ($("#sgrade").value || "").trim();
    rec.phone = ($("#sphone").value || "").trim();
    rec.paid = ($("#spaid").value || "").trim();

    students[currentStudentId] = rec;
    setStudents(students);

    showMsg($("#studentMsg"), "✅ تم حفظ البيانات.", true);
  }

  function toggleToday() {
    if (!currentStudentId) return;
    const t = todayISO();
    const rec = getOrCreateStudentRecord(currentStudentId);
    const has = Array.isArray(rec.attendance) && rec.attendance.includes(t);

    const res = has ? unmarkAttendance(currentStudentId, t) : markAttendance(currentStudentId, t);
    showMsg($("#studentMsg"), res.msg, res.ok);
    refreshTodayState();
    renderAttendanceList();
    refreshDatePanel();
  }

  function refreshDatePanel() {
    const dp = $("#datePick");
    const date = dp.value || todayISO();

    $("#dateLabel").textContent = prettyDate(date);
    const list = getAttendanceListByDate(date);

    $("#dateCount").textContent = String(list.length);

    const ul = $("#dateList");
    ul.innerHTML = "";

    if (list.length === 0) {
      const li = document.createElement("li");
      li.textContent = "لا يوجد حضور في هذا التاريخ.";
      ul.appendChild(li);
      return;
    }

    for (const s of list) {
      const li = document.createElement("li");
      const name = (s.name || "").trim() || "بدون اسم";
      li.innerHTML = `<div class="row" style="justify-content:space-between">
        <span><b>${name}</b> — ID: ${s.id}</span>
        <button class="btn" data-open="${s.id}" style="padding:6px 10px">فتح</button>
      </div>`;
      ul.appendChild(li);
    }

    ul.querySelectorAll("button[data-open]").forEach(btn => {
      btn.addEventListener("click", () => openStudent(Number(btn.getAttribute("data-open"))));
    });
  }

  // Handle QR deep link
  function handleIncomingIdFromURL() {
    const url = new URL(window.location.href);
    const idParam = url.searchParams.get("id");
    if (!idParam) return;

    const id = parseId(idParam);
    if (!id) return;

    // Save pending if not authed
    if (!isAuthed()) {
      sessionStorage.setItem("ca_pending_id", String(id));
      sessionStorage.setItem("ca_pending_mode", "attend"); // attend automatically
      return;
    }

    // If authed: open + attend today
    const chk = requireExistingId(id);
    if (!chk.ok) {
      // show in UI after mount
      showMsg($("#quickAttendMsg"), chk.msg, false);
      return;
    }

    openStudent(id);
    const res = markAttendance(id, todayISO());
    showMsg($("#quickAttendMsg"), `ID=${id} — ${res.msg}`, res.ok);

    // Remove params to avoid re-trigger on refresh
    url.searchParams.delete("id");
    history.replaceState({}, "", url.toString());

    refreshDatePanel();
  }

  function handlePendingAfterLogin() {
    const pid = sessionStorage.getItem("ca_pending_id");
    const mode = sessionStorage.getItem("ca_pending_mode");
    if (!pid) return;

    sessionStorage.removeItem("ca_pending_id");
    sessionStorage.removeItem("ca_pending_mode");

    const id = parseId(pid);
    if (!id) return;

    const chk = requireExistingId(id);
    if (!chk.ok) {
      showMsg($("#quickAttendMsg"), chk.msg, false);
      return;
    }

    openStudent(id);
    if (mode === "attend") {
      const res = markAttendance(id, todayISO());
      showMsg($("#quickAttendMsg"), `ID=${id} — ${res.msg}`, res.ok);
      refreshDatePanel();
    }
  }

  // -------- Bind Events --------
  function bindEvents() {
    // Login
    $("#togglePass").addEventListener("click", () => {
      const p = $("#pass");
      p.type = (p.type === "password") ? "text" : "password";
    });

    $("#loginBtn").addEventListener("click", () => {
      const u = ($("#user").value || "").trim();
      const p = ($("#pass").value || "").trim();

      if (u === ADMIN_USER && p === ADMIN_PASS) {
        setAuthed(true);
        showApp();
        showMsg($("#loginMsg"), "", true);
      } else {
        showMsg($("#loginMsg"), "❌ بيانات الدخول غير صحيحة.", false);
      }
    });

    // Logout
    $("#logoutBtn").addEventListener("click", () => {
      setAuthed(false);
      currentStudentId = null;
      showLogin();
    });

    // Quick attend
    $("#quickAttendBtn").addEventListener("click", () => {
      const id = parseId($("#quickAttendId").value);
      if (!id) return showMsg($("#quickAttendMsg"), "❌ اكتب ID صحيح (أرقام فقط).", false);

      const chk = requireExistingId(id);
      if (!chk.ok) return showMsg($("#quickAttendMsg"), chk.msg, false);

      openStudent(id);
      const res = markAttendance(id, todayISO());
      showMsg($("#quickAttendMsg"), `ID=${id} — ${res.msg}`, res.ok);
      refreshDatePanel();
    });

    // Open only
    $("#openOnlyBtn").addEventListener("click", () => {
      const id = parseId($("#openOnlyId").value);
      if (!id) return showMsg($("#openOnlyMsg"), "❌ اكتب ID صحيح (أرقام فقط).", false);

      const chk = requireExistingId(id);
      if (!chk.ok) return showMsg($("#openOnlyMsg"), chk.msg, false);

      openStudent(id);
      showMsg($("#openOnlyMsg"), `✅ تم فتح بيانات ID=${id} بدون تسجيل حضور.`, true);
    });

    // Add new ID
    $("#addNewBtn").addEventListener("click", () => {
      const val = $("#addNewId").value;
      const res = addNewStudentId(val);
      showMsg($("#addNewMsg"), res.msg, res.ok);
    });

    // Save student
    $("#saveStudentBtn").addEventListener("click", saveStudent);

    // Toggle today attendance
    $("#toggleTodayBtn").addEventListener("click", toggleToday);

    // Date panel
    $("#showDateBtn").addEventListener("click", refreshDatePanel);
    $("#datePick").addEventListener("change", refreshDatePanel);
  }

  function showLogin() {
    $("#loginView").style.display = "block";
    $("#appView").style.display = "none";
  }

  function showApp() {
    $("#loginView").style.display = "none";
    $("#appView").style.display = "block";

    // Ensure base data exists
    ensureBaseStudents();

    // Default date panel
    $("#dateLabel").textContent = prettyDate($("#datePick").value || todayISO());
    refreshDatePanel();

    // Process pending QR after login
    handlePendingAfterLogin();

    // Process direct URL id if any
    handleIncomingIdFromURL();
  }

  // -------- Boot --------
  function boot() {
    mountUI();
    bindEvents();

    if (isAuthed()) showApp();
    else showLogin();
  }

  boot();
})();
