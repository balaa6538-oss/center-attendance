/* ==========================
   Center Attendance - app.js (Updated with Live Search)
   Storage: localStorage
   Excel: XLSX
========================== */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111";
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  // ====== STORAGE KEYS ======
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v1";       
  const K_EXTRA_IDS = "ca_extra_ids_v1";     
  const K_ATT_BY_DATE = "ca_att_by_date_v1"; 

  // ====== DOM ======
  const $ = (id) => document.getElementById(id);

  // Login
  const loginBox = $("loginBox");
  const appBox = $("appBox");
  const userInp = $("user");
  const passInp = $("pass");
  const togglePassBtn = $("togglePass");
  const loginBtn = $("loginBtn");
  const loginMsg = $("loginMsg");

  // Top
  const exportExcelBtn = $("exportExcelBtn");
  const importExcelInput = $("importExcelInput");
  const logoutBtn = $("logoutBtn");

  // Quick
  const quickAttendId = $("quickAttendId");
  const quickAttendBtn = $("quickAttendBtn");
  const quickMsg = $("quickMsg");

  // Open/search
  const openId = $("openId");
  const openBtn = $("openBtn");
  const searchAny = $("searchAny");
  const searchAnyBtn = $("searchAnyBtn");
  const searchMsg = $("searchMsg");

  // Add new
  const newId = $("newId");
  const addNewBtn = $("addNewBtn");
  const addMsg = $("addMsg");

  // Report
  const reportDate = $("reportDate");
  const reportBtn = $("reportBtn");
  const reportDateLabel = $("reportDateLabel");
  const reportCount = $("reportCount");
  const reportList = $("reportList");

  // Student panel
  const studentIdPill = $("studentIdPill");
  const todayStatus = $("todayStatus");
  const lastAttend = $("lastAttend");
  const daysCount = $("daysCount");

  const stName = $("stName");
  const stClass = $("stClass");
  const stPhone = $("stPhone");
  const stPaid = $("stPaid");

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const studentMsg = $("studentMsg");

  const attList = $("attList");

  // Reset
  const resetPass = $("resetPass");
  const resetBtn = $("resetBtn");
  const resetMsg = $("resetMsg");

  // ====== STATE ======
  let students = {};              
  let extraIds = [];              
  let attByDate = {};             
  let currentId = null;

  // ====== HELPERS ======
  const nowDateStr = () => {
    // YYYY-MM-DD
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const prettyDate = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return "—";
    const [y, m, d] = yyyy_mm_dd.split("-");
    return `${d}-${m}-${y}`;
  };

  const toInt = (v) => {
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : null;
  };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const showMsg = (el, text, type = "") => {
    if (!el) return;
    el.textContent = text || "";
    el.className = "msg" + (type ? ` ${type}` : "");
  };

  const isAuth = () => localStorage.getItem(K_AUTH) === "1";

  const setAuth = (v) => {
    if (v) localStorage.setItem(K_AUTH, "1");
    else localStorage.removeItem(K_AUTH);
  };

  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
  };

  const loadAll = () => {
    try {
      students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}") || {};
    } catch { students = {}; }

    try {
      extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]") || [];
    } catch { extraIds = []; }

    try {
      attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}") || {};
    } catch { attByDate = {}; }
  };

  const ensureBase500 = () => {
    // لو مفيش أي داتا → أنشئ 1..500
    const hasAny = Object.keys(students).length > 0;
    if (hasAny) return;

    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      students[String(i)] = makeEmptyStudent(i);
    }
    extraIds = [];
    attByDate = {};
    saveAll();
  };

  const makeEmptyStudent = (id) => ({
    id,
    name: "",
    className: "",
    phone: "",
    paid: "",
    attendanceDates: [] // ["YYYY-MM-DD", ...]
  });

  const existsId = (id) => {
    const key = String(id);
    return !!students[key];
  };

  const isFilledStudent = (st) => {
    if (!st) return false;
    const hasInfo =
      (st.name && st.name.trim()) ||
      (st.className && st.className.trim()) ||
      (st.phone && st.phone.trim()) ||
      (String(st.paid || "").trim() && String(st.paid || "").trim() !== "0");
    const hasAttend = Array.isArray(st.attendanceDates) && st.attendanceDates.length > 0;
    return !!(hasInfo || hasAttend);
  };

  const getStudent = (id) => students[String(id)] || null;

  const setStudent = (st) => {
    students[String(st.id)] = st;
    saveAll();
  };

  const addAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "هذا الـ ID غير موجود." };

    st.attendanceDates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
    if (st.attendanceDates.includes(dateStr)) {
      return { ok: false, msg: "مسجل حضور بالفعل اليوم." };
    }

    st.attendanceDates.push(dateStr);
    st.attendanceDates.sort();

    attByDate[dateStr] = Array.isArray(attByDate[dateStr]) ? attByDate[dateStr] : [];
    if (!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);

    setStudent(st);
    saveAll();

    return { ok: true, msg: "تم تسجيل حضور اليوم ✅" };
  };

  const removeAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "هذا الـ ID غير موجود." };

    st.attendanceDates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
    if (!st.attendanceDates.includes(dateStr)) {
      return { ok: false, msg: "غير مسجل حضور اليوم." };
    }

    st.attendanceDates = st.attendanceDates.filter((d) => d !== dateStr);

    if (Array.isArray(attByDate[dateStr])) {
      attByDate[dateStr] = attByDate[dateStr].filter((x) => x !== id);
      if (attByDate[dateStr].length === 0) delete attByDate[dateStr];
    }

    setStudent(st);
    saveAll();

    return { ok: true, msg: "تم إلغاء حضور اليوم ✖" };
  };

  const updateStudentUI = (id) => {
    const st = getStudent(id);
    currentId = st ? st.id : null;

    if (!st) {
      studentIdPill.textContent = "ID: —";
      todayStatus.textContent = "حضور اليوم: —";
      lastAttend.textContent = "آخر حضور: —";
      daysCount.textContent = "عدد أيام الحضور: —";
      stName.value = "";
      stClass.value = "";
      stPhone.value = "";
      stPaid.value = "";
      attList.innerHTML = `<div class="mutedCenter">— افتح طالب علشان يظهر هنا —</div>`;
      return;
    }

    const today = nowDateStr();
    const dates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
    const hasToday = dates.includes(today);

    studentIdPill.textContent = `ID: ${st.id}`;
    todayStatus.textContent = hasToday ? "حضور اليوم: حاضر ✅" : "حضور اليوم: غير حاضر ✖";
    daysCount.textContent = `عدد أيام الحضور: ${dates.length}`;

    const last = dates.length ? dates[dates.length - 1] : "";
    lastAttend.textContent = `آخر حضور: ${last ? prettyDate(last) : "—"}`;

    stName.value = st.name || "";
    stClass.value = st.className || "";
    stPhone.value = st.phone || "";
    stPaid.value = st.paid || "";

    // سجل آخر 25 تاريخ (عكسي)
    const last25 = [...dates].sort().slice(-25).reverse();
    if (!last25.length) {
      attList.innerHTML = `<div class="mutedCenter">— لا يوجد حضور بعد —</div>`;
    } else {
      attList.innerHTML = last25
        .map((d) => `<div class="item">${escapeHtml(prettyDate(d))}</div>`)
        .join("");
    }
  };

  const renderReport = (dateStr) => {
    reportDateLabel.textContent = `التاريخ: ${prettyDate(dateStr)}`;
    const ids = Array.isArray(attByDate[dateStr]) ? attByDate[dateStr] : [];
    reportCount.textContent = `عدد الحضور: ${ids.length}`;

    if (!ids.length) {
      reportList.innerHTML = `<div class="mutedCenter">— لا يوجد حضور في هذا التاريخ —</div>`;
      return;
    }

    // قائمة (اسم + ID)
    const rows = ids
      .slice()
      .sort((a, b) => a - b)
      .map((id) => {
        const st = getStudent(id);
        const name = (st && st.name && st.name.trim()) ? st.name.trim() : "بدون اسم";
        return `<div class="item">(${id}) — ${escapeHtml(name)}</div>`;
      });

    reportList.innerHTML = rows.join("");
  };

  const openStudent = (id) => {
    if (!Number.isFinite(id)) {
      showMsg(searchMsg, "اكتب رقم ID صحيح.", "err");
      return;
    }
    if (!existsId(id)) {
      showMsg(searchMsg, "هذا الـ ID غير موجود في قاعدة البيانات.", "err");
      updateStudentUI(null);
      return;
    }
    // مسح نتائج البحث بعد الفتح عشان القائمة تختفي
    searchMsg.innerHTML = "";
    searchMsg.className = "msg";
    searchAny.value = ""; 

    showMsg(searchMsg, "");
    updateStudentUI(id);
    // نطلع للطالب (اختياري لو الشاشة صغيرة)
    // window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    const stPanel = document.querySelector(".studentHead");
    if(stPanel) stPanel.scrollIntoView({ behavior: "smooth" });
  };

  const autoFromQuery = () => {
    // لو الرابط فيه ?id=25
    const url = new URL(window.location.href);
    const idRaw = url.searchParams.get("id");
    if (!idRaw) return;

    const id = toInt(idRaw);
    if (!id || !existsId(id)) return;

    // افتح الطالب
    updateStudentUI(id);

    // سجل حضور تلقائي لو داخل
    if (isAuth()) {
      const res = addAttendance(id, nowDateStr());
      showMsg(quickMsg, res.msg, res.ok ? "ok" : "err");
      updateStudentUI(id);
      // تحديث تقرير اليوم تلقائي
      renderReport(nowDateStr());
    }
  };

  // ============================================
  // ✅ دالة البحث الجديدة (لحظية - Live Search)
  // ============================================
  const doSearchLive = () => {
    const q = String(searchAny.value || "").trim().toLowerCase();
    
    // لو مفيش كلام، اخفي القائمة
    if (!q) {
      searchMsg.innerHTML = "";
      searchMsg.className = "msg";
      return;
    }

    // البحث في الاسم أو الموبايل
    const matches = Object.values(students)
      .filter((st) => isFilledStudent(st))
      .filter((st) => {
        const name = String(st.name || "").toLowerCase();
        const phone = String(st.phone || "").toLowerCase();
        // لو ID برضه
        const sId = String(st.id);
        return name.includes(q) || phone.includes(q) || sId.includes(q);
      })
      .slice(0, 10); // هات أول 10 نتايج بس عشان الزحمة

    if (!matches.length) {
      searchMsg.textContent = "لا توجد نتائج مطابقة...";
      searchMsg.className = "msg err";
      return;
    }

    // رسم القائمة
    const html = matches
      .map((st) => {
        const nm = (st.name && st.name.trim()) ? st.name.trim() : "بدون اسم";
        return `
          <div class="item resultItem" data-id="${st.id}" style="border-bottom:1px solid #eee; margin-bottom:4px;">
            <strong>${escapeHtml(nm)}</strong> 
            <br>
            <span class="muted" style="font-size:12px">ID: ${st.id} | 📞 ${escapeHtml(st.phone || "—")}</span>
          </div>
        `;
      })
      .join("");

    searchMsg.innerHTML = `<div class="resultsList">${html}</div>`;
    searchMsg.className = "msg"; 

    // تشغيل الضغط على العناصر
    searchMsg.querySelectorAll(".resultItem").forEach((div) => {
      div.addEventListener("click", () => {
        const id = toInt(div.getAttribute("data-id"));
        if (id) openStudent(id);
      });
      // تغيير شكل الماوس
      div.style.cursor = "pointer";
    });
  };

  // ====== EXCEL EXPORT / IMPORT (A: Sheet حضور مستقل) ======
  const exportExcel = () => {
    if (typeof XLSX === "undefined") {
      alert("مكتبة Excel (XLSX) غير موجودة.");
      return;
    }

    // B: تصدير الطلاب "المليانة" فقط (وإلا هتطلع 500 صف فاضي)
    const filled = Object.values(students)
      .filter((st) => isFilledStudent(st))
      .sort((a, b) => a.id - b.id);

    // Sheet: الطلاب
    const wsStudentsData = [
      ["ID", "الاسم", "الصف", "الموبايل", "المدفوع", "عدد أيام الحضور", "آخر حضور"]
    ];

    for (const st of filled) {
      const dates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
      const last = dates.length ? dates[dates.length - 1] : "";
      wsStudentsData.push([
        st.id,
        st.name || "",
        st.className || "",
        st.phone || "",
        st.paid || "",
        dates.length,
        last || ""
      ]);
    }

    const wsStudents = XLSX.utils.aoa_to_sheet(wsStudentsData);

    // Sheet: الحضور (سجل بالتاريخ)
    const wsAttendData = [["التاريخ", "ID", "الاسم"]];
    const datesSorted = Object.keys(attByDate).sort();
    for (const d of datesSorted) {
      const ids = Array.isArray(attByDate[d]) ? attByDate[d] : [];
      for (const id of ids) {
        const st = getStudent(id);
        const nm = st && st.name ? st.name : "";
        wsAttendData.push([d, id, nm]);
      }
    }
    const wsAttend = XLSX.utils.aoa_to_sheet(wsAttendData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsStudents, "الطلاب");
    XLSX.utils.book_append_sheet(wb, wsAttend, "الحضور");

    const fileName = `center-data-${nowDateStr()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const normHeader = (h) =>
    String(h || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  const importExcel = async (file) => {
    if (typeof XLSX === "undefined") {
      alert("مكتبة Excel (XLSX) غير موجودة.");
      return;
    }
    if (!file) return;

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const sheetStudentsName = wb.SheetNames.find((n) => n.includes("الطلاب")) || wb.SheetNames[0];
    const sheetAttendName = wb.SheetNames.find((n) => n.includes("الحضور")) || wb.SheetNames[1];

    const wsS = wb.Sheets[sheetStudentsName];
    const wsA = sheetAttendName ? wb.Sheets[sheetAttendName] : null;

    // اقرأ الطلاب
    const rowsS = XLSX.utils.sheet_to_json(wsS, { header: 1, defval: "" });
    if (!rowsS.length) {
      alert("ملف Excel فاضي.");
      return;
    }

    const headerS = rowsS[0].map(normHeader);

    const idx = (names) => {
      for (let i = 0; i < headerS.length; i++) {
        if (names.includes(headerS[i])) return i;
      }
      return -1;
    };

    const iID = idx(["id"]);
    const iName = idx(["الاسم", "name"]);
    const iClass = idx(["الصف", "class", "classname"]);
    const iPhone = idx(["الموبايل", "الهاتف", "phone", "mobile"]);
    const iPaid = idx(["المدفوع", "paid", "payment"]);

    // هنعيد بناء students من الموجود + نضمن 1..500
    const newStudents = {};
    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      newStudents[String(i)] = makeEmptyStudent(i);
    }

    const newExtra = [];

    for (let r = 1; r < rowsS.length; r++) {
      const row = rowsS[r];
      const id = toInt(row[iID]);
      if (!id) continue;

      if (!newStudents[String(id)]) {
        newStudents[String(id)] = makeEmptyStudent(id);
        if (id < BASE_MIN_ID || id > BASE_MAX_ID) newExtra.push(id);
      }

      const st = newStudents[String(id)];
      if (iName !== -1) st.name = String(row[iName] || "");
      if (iClass !== -1) st.className = String(row[iClass] || "");
      if (iPhone !== -1) st.phone = String(row[iPhone] || "");
      if (iPaid !== -1) st.paid = String(row[iPaid] || "");
      // attendanceDates هتتجاب من شيت "الحضور"
    }

    // اقرأ الحضور (التاريخ + ID)
    const newAttByDate = {};
    if (wsA) {
      const rowsA = XLSX.utils.sheet_to_json(wsA, { header: 1, defval: "" });
      if (rowsA.length) {
        const headerA = rowsA[0].map(normHeader);
        const idxA = (names) => {
          for (let i = 0; i < headerA.length; i++) {
            if (names.includes(headerA[i])) return i;
          }
          return -1;
        };

        const aDate = idxA(["التاريخ", "date"]);
        const aID = idxA(["id"]);
        for (let r = 1; r < rowsA.length; r++) {
          const row = rowsA[r];
          const d = String(row[aDate] || "").trim();
          const id = toInt(row[aID]);
          if (!d || !id) continue;

          // لازم الطالب يبقى موجود (أو أضيفه كـ extra)
          if (!newStudents[String(id)]) {
            newStudents[String(id)] = makeEmptyStudent(id);
            if (id < BASE_MIN_ID || id > BASE_MAX_ID) newExtra.push(id);
          }

          newAttByDate[d] = Array.isArray(newAttByDate[d]) ? newAttByDate[d] : [];
          if (!newAttByDate[d].includes(id)) newAttByDate[d].push(id);
        }
      }
    }

    // طبق الحضور على كل طالب
    for (const st of Object.values(newStudents)) {
      st.attendanceDates = [];
    }
    for (const d of Object.keys(newAttByDate)) {
      for (const id of newAttByDate[d]) {
        const st = newStudents[String(id)];
        if (!st) continue;
        st.attendanceDates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
        if (!st.attendanceDates.includes(d)) st.attendanceDates.push(d);
      }
    }
    for (const st of Object.values(newStudents)) {
      st.attendanceDates.sort();
    }

    students = newStudents;
    extraIds = Array.from(new Set(newExtra)).sort((a, b) => a - b);
    attByDate = newAttByDate;

    saveAll();

    // تحديث واجهة
    showMsg(searchMsg, "تم الاستيراد بنجاح ✅", "ok");
    currentId = null;
    updateStudentUI(null);
    renderReport(nowDateStr());
  };

  // ====== EVENTS ======

  // Toggle password eye
  togglePassBtn?.addEventListener("click", () => {
    passInp.type = passInp.type === "password" ? "text" : "password";
  });

  // Login
  loginBtn.addEventListener("click", () => {
    const u = String(userInp.value || "").trim();
    const p = String(passInp.value || "");
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      setAuth(true);
      showMsg(loginMsg, "");
      showApp();
    } else {
      showMsg(loginMsg, "بيانات الدخول غير صحيحة.", "err");
    }
  });

  // Enter = login
  passInp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    setAuth(false);
    showLogin();
  });

  // Quick attend
  quickAttendBtn.addEventListener("click", () => {
    const id = toInt(quickAttendId.value);
    if (!id) {
      showMsg(quickMsg, "اكتب ID صحيح.", "err");
      return;
    }
    if (!existsId(id)) {
      showMsg(quickMsg, "هذا الـ ID غير موجود في قاعدة البيانات.", "err");
      return;
    }

    const res = addAttendance(id, nowDateStr());
    showMsg(quickMsg, res.msg, res.ok ? "ok" : "err");
    updateStudentUI(id);
    renderReport(nowDateStr());
  });

  // Open student by ID
  openBtn.addEventListener("click", () => {
    const id = toInt(openId.value);
    openStudent(id);
  });

  // ============================================
  // ✅ ربط البحث الجديد (type + click)
  // ============================================
  // لما تكتب: شغل البحث اللحظي
  searchAny.addEventListener("input", doSearchLive);
  // لما تدوس على زرار البحث: برضو شغل البحث (تصليح الزرار)
  searchAnyBtn.addEventListener("click", doSearchLive);

  // Add new ID
  addNewBtn.addEventListener("click", () => {
    const id = toInt(newId.value);
    if (!id) {
      showMsg(addMsg, "اكتب ID صحيح.", "err");
      return;
    }
    if (existsId(id)) {
      showMsg(addMsg, "هذا الـ ID موجود بالفعل.", "err");
      return;
    }

    students[String(id)] = makeEmptyStudent(id);
    if (id < BASE_MIN_ID || id > BASE_MAX_ID) {
      if (!extraIds.includes(id)) extraIds.push(id);
      extraIds.sort((a, b) => a - b);
    }
    saveAll();
    showMsg(addMsg, `تمت إضافة ID ${id} ✅`, "ok");
    updateStudentUI(id);
  });

  // Save student
  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) {
      showMsg(studentMsg, "افتح طالب أولاً.", "err");
      return;
    }
    const st = getStudent(currentId);
    if (!st) {
      showMsg(studentMsg, "هذا الـ ID غير موجود.", "err");
      return;
    }

    st.name = String(stName.value || "");
    st.className = String(stClass.value || "");
    st.phone = String(stPhone.value || "");
    st.paid = String(stPaid.value || "");
    st.attendanceDates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];

    setStudent(st);
    showMsg(studentMsg, "تم حفظ البيانات ✅", "ok");
    updateStudentUI(currentId);
    renderReport(reportDate.value || nowDateStr());
  });

  // Mark today
  markTodayBtn.addEventListener("click", () => {
    if (!currentId) {
      showMsg(studentMsg, "افتح طالب أولاً.", "err");
      return;
    }
    const res = addAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok ? "ok" : "err");
    updateStudentUI(currentId);
    renderReport(reportDate.value || nowDateStr());
  });

  // Unmark today
  unmarkTodayBtn.addEventListener("click", () => {
    if (!currentId) {
      showMsg(studentMsg, "افتح طالب أولاً.", "err");
      return;
    }
    const res = removeAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok ? "ok" : "err");
    updateStudentUI(currentId);
    renderReport(reportDate.value || nowDateStr());
  });

  // Report
  reportBtn.addEventListener("click", () => {
    const d = reportDate.value || nowDateStr();
    renderReport(d);
  });

  // Excel export/import
  exportExcelBtn.addEventListener("click", exportExcel);

  importExcelInput.addEventListener("change", async () => {
    const file = importExcelInput.files && importExcelInput.files[0];
    if (!file) return;
    await importExcel(file);
    importExcelInput.value = ""; // reset input
  });

  // Reset (مسح كل البيانات)
  resetBtn.addEventListener("click", () => {
    const p = String(resetPass.value || "");
    if (p !== ADMIN_PASS) {
      showMsg(resetMsg, "كلمة المرور غير صحيحة.", "err");
      return;
    }

    // امسح كل شيء
    localStorage.removeItem(K_STUDENTS);
    localStorage.removeItem(K_EXTRA_IDS);
    localStorage.removeItem(K_ATT_BY_DATE);

    // اعد التهيئة
    students = {};
    extraIds = [];
    attByDate = {};
    currentId = null;

    ensureBase500();
    loadAll();
    updateStudentUI(null);
    renderReport(nowDateStr());
    showMsg(resetMsg, "تمت إعادة الضبط ومسح البيانات من هذا الجهاز ✅", "ok");
  });

  // ====== UI FLOW ======
  const showLogin = () => {
    loginBox.classList.remove("hidden");
    appBox.classList.add("hidden");
  };

  const showApp = () => {
    loginBox.classList.add("hidden");
    appBox.classList.remove("hidden");

    // الافتراضي اليوم
    const today = nowDateStr();
    reportDate.value = today;
    renderReport(today);

    // اسحب id من الرابط إن وجد
    autoFromQuery();
  };

  // ====== INIT ======
  const init = () => {
    loadAll();
    ensureBase500();

    // لو المستخدم فاتح قبل كده
    if (isAuth()) showApp();
    else showLogin();

    // default report date
    reportDate.value = nowDateStr();
    renderReport(nowDateStr());
    updateStudentUI(null);
  };

  init();
})();
