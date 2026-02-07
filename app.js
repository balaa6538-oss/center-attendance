/* =============================================
   Center Attendance System V3 - (Pro Version)
   Features: Notes, Term Reset, WhatsApp, Stats
   ============================================= */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; // باسوورد الأدمن والتصفير
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;
  
  // 💰 مصاريف الترم (عدلها براحتك هنا)
  // لو الطالب دافع الرقم ده أو أكتر هيظهر بالأخضر
  const TERM_FEE = 5000; 

  // ====== STORAGE KEYS ======
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v3";       
  const K_EXTRA_IDS = "ca_extra_ids_v3";     
  const K_ATT_BY_DATE = "ca_att_by_date_v3"; 

  // ====== DOM ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  // Stats (Top Bar)
  const totalStudentsCount = $("totalStudentsCount");
  const todayCountTop = $("todayCountTop");

  // Login
  const loginBox = $("loginBox");
  const appBox = $("appBox");
  const userInp = $("user");
  const passInp = $("pass");
  const togglePassBtn = $("togglePass");
  const loginBtn = $("loginBtn");
  const loginMsg = $("loginMsg");

  // Actions
  const exportExcelBtn = $("exportExcelBtn");
  const importExcelInput = $("importExcelInput");
  const logoutBtn = $("logoutBtn");

  // Quick & Search
  const quickAttendId = $("quickAttendId");
  const quickAttendBtn = $("quickAttendBtn");
  const quickMsg = $("quickMsg");
  const openId = $("openId");
  const openBtn = $("openBtn");
  const searchAny = $("searchAny");
  const searchMsg = $("searchMsg");
  
  // Add New
  const newId = $("newId");
  const addNewBtn = $("addNewBtn");
  const addMsg = $("addMsg");

  // Report
  const reportDate = $("reportDate");
  const reportBtn = $("reportBtn");
  const reportDateLabel = $("reportDateLabel");
  const reportCount = $("reportCount");
  const reportList = $("reportList");
  const copyReportBtn = $("copyReportBtn"); // New

  // Student Form
  const studentIdPill = $("studentIdPill");
  const todayStatus = $("todayStatus");
  const lastAttend = $("lastAttend");
  const daysCount = $("daysCount");
  const newBadge = $("newBadge"); // New

  const stName = $("stName");
  const stClass = $("stClass");
  const stPhone = $("stPhone");
  const waBtn = $("waBtn"); // New WhatsApp Btn
  const stPaid = $("stPaid");
  const stNotes = $("stNotes"); // New Notes Field

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const studentMsg = $("studentMsg");
  const attList = $("attList");

  // Danger Zone
  const resetTermBtn = $("resetTermBtn"); // New
  const termPass = $("termPass");
  const resetBtn = $("resetBtn");
  const resetPass = $("resetPass");
  const resetMsg = $("resetMsg");

  // ====== STATE ======
  let students = {};              
  let extraIds = [];              
  let attByDate = {};             
  let currentId = null;

  // ====== SOUND ======
  const playBeep = () => {
    // صوت بسيط عند الحضور
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880; // A5
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(() => osc.stop(), 150);
  };

  // ====== HELPERS ======
  const nowDateStr = () => {
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
    String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  const showMsg = (el, text, type = "") => {
    if (!el) return;
    el.textContent = text || "";
    el.className = "msg" + (type ? ` ${type}` : "");
    el.style.display = "block"; // Force show
  };

  const isAuth = () => localStorage.getItem(K_AUTH) === "1";
  const setAuth = (v) => v ? localStorage.setItem(K_AUTH, "1") : localStorage.removeItem(K_AUTH);

  // ====== DATA MANAGEMENT ======
  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    updateTopStats(); // Update stats whenever saved
  };

  const loadAll = () => {
    try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}") || {}; } catch { students = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]") || []; } catch { extraIds = []; }
    try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}") || {}; } catch { attByDate = {}; }
    updateTopStats();
  };

  const updateTopStats = () => {
    // 1. Total Registered (Have names)
    const filledCount = Object.values(students).filter(st => st.name && st.name.trim().length > 0).length;
    totalStudentsCount.textContent = filledCount;

    // 2. Today Attendance
    const today = nowDateStr();
    const todayList = attByDate[today] || [];
    todayCountTop.textContent = todayList.length;
  };

  const ensureBase500 = () => {
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
    notes: "", // New Notes field
    attendanceDates: [] 
  });

  const existsId = (id) => !!students[String(id)];
  const getStudent = (id) => students[String(id)] || null;
  const setStudent = (st) => { students[String(st.id)] = st; saveAll(); };

  const isFilledStudent = (st) => {
    if (!st) return false;
    // Check if meaningful data exists
    return !!((st.name && st.name.trim()) || (st.phone && st.phone.trim()) || (st.paid && st.paid != 0));
  };

  // ====== ATTENDANCE LOGIC ======
  const addAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "ID غير موجود" };

    st.attendanceDates = Array.isArray(st.attendanceDates) ? st.attendanceDates : [];
    if (st.attendanceDates.includes(dateStr)) return { ok: false, msg: "حاضر بالفعل" };

    st.attendanceDates.push(dateStr);
    st.attendanceDates.sort();

    attByDate[dateStr] = Array.isArray(attByDate[dateStr]) ? attByDate[dateStr] : [];
    if (!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);

    setStudent(st);
    saveAll();
    playBeep(); // 🔊 Beep

    return { ok: true, msg: "تم تسجيل الحضور ✅" };
  };

  const removeAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "غير موجود" };

    st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
    if (attByDate[dateStr]) {
      attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
    }
    setStudent(st);
    saveAll();
    return { ok: true, msg: "تم إلغاء الحضور ✖" };
  };

  // ====== UI UPDATES ======
  const updateStudentUI = (id) => {
    const st = getStudent(id);
    currentId = st ? st.id : null;

    if (!st) {
      studentIdPill.textContent = "ID: —";
      todayStatus.textContent = "—";
      lastAttend.textContent = "—";
      daysCount.textContent = "—";
      stName.value = "";
      stClass.value = "";
      stPhone.value = "";
      stPaid.value = "";
      stNotes.value = ""; // Clear notes
      newBadge.classList.add("hidden");
      attList.innerHTML = `<div class="mutedCenter">— افتح طالب —</div>`;
      return;
    }

    // Basic Data
    stName.value = st.name || "";
    stClass.value = st.className || "";
    stPhone.value = st.phone || "";
    stPaid.value = st.paid || "";
    stNotes.value = st.notes || ""; // Load notes

    // Color Logic for Paid
    const paidVal = parseInt(st.paid) || 0;
    if (TERM_FEE > 0) {
        stPaid.style.borderColor = paidVal >= TERM_FEE ? "#2ea44f" : "#cf222e";
    } else {
        stPaid.style.borderColor = "#d1d5da";
    }

    // Stats
    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    const hasToday = dates.includes(today);

    studentIdPill.textContent = `ID: ${st.id}`;
    todayStatus.textContent = hasToday ? "حاضر ✅" : "غياب ✖";
    todayStatus.style.color = hasToday ? "#2ea44f" : "#cf222e";
    
    daysCount.textContent = `${dates.length} مرة`;
    const last = dates.length ? dates[dates.length - 1] : "";
    lastAttend.textContent = last ? prettyDate(last) : "—";

    // History List
    const last25 = [...dates].sort().slice(-25).reverse();
    attList.innerHTML = last25.length 
      ? last25.map(d => `<div class="item">${escapeHtml(prettyDate(d))}</div>`).join("")
      : `<div class="mutedCenter">— لا يوجد حضور —</div>`;
      
    // New Badge (Simple logic: if no attendance yet)
    if (dates.length === 0 && st.name) newBadge.classList.remove("hidden");
    else newBadge.classList.add("hidden");
  };

  const renderReport = (dateStr) => {
    reportDateLabel.textContent = `تاريخ: ${prettyDate(dateStr)}`;
    const ids = attByDate[dateStr] || [];
    reportCount.textContent = `${ids.length} طالب`;

    if (!ids.length) {
      reportList.innerHTML = `<div class="mutedCenter">— لا يوجد حضور —</div>`;
      return;
    }

    const rows = ids.slice().sort((a,b)=>a-b).map(id => {
      const st = getStudent(id);
      const nm = (st && st.name) ? st.name : "بدون اسم";
      return `<div class="item" onclick="document.getElementById('openId').value=${id};document.getElementById('openBtn').click();">(${id}) ${escapeHtml(nm)}</div>`;
    });
    reportList.innerHTML = rows.join("");
  };

  // ====== SEARCH (Fixed & Notes Hidden) ======
  const doSearchLive = () => {
    const q = String(searchAny.value || "").trim().toLowerCase();
    
    if (!q) {
      searchMsg.style.display = "none";
      return;
    }

    const matches = Object.values(students)
      .filter(st => isFilledStudent(st))
      .filter(st => {
        // Search ONLY in Name, Phone, ID (NOT NOTES)
        const name = String(st.name || "").toLowerCase();
        const phone = String(st.phone || "").toLowerCase();
        const sId = String(st.id);
        return name.includes(q) || phone.includes(q) || sId.includes(q);
      })
      .slice(0, 10);

    if (!matches.length) {
      searchMsg.innerHTML = `<div style="padding:10px; color:#cf222e;">لا توجد نتائج...</div>`;
      searchMsg.style.display = "block";
      return;
    }

    const html = matches.map(st => {
      const nm = st.name || "بدون اسم";
      return `
        <div class="resultItem" data-id="${st.id}">
          <strong>${escapeHtml(nm)}</strong> 
          <span style="float:left; font-size:12px; color:#666;">#${st.id}</span>
          <br><span style="font-size:12px; color:#888;">📞 ${escapeHtml(st.phone || "—")}</span>
        </div>
      `;
    }).join("");

    searchMsg.innerHTML = `<div class="resultsList">${html}</div>`;
    searchMsg.style.display = "block"; 

    searchMsg.querySelectorAll(".resultItem").forEach(div => {
      div.addEventListener("click", () => {
        openStudent(toInt(div.getAttribute("data-id")));
      });
    });
  };

  const openStudent = (id) => {
    if (!id || !existsId(id)) {
      showMsg(searchMsg, "ID غير موجود", "err");
      return;
    }
    // Clear search
    searchAny.value = "";
    searchMsg.style.display = "none";
    
    updateStudentUI(id);
    // Scroll to student panel
    document.querySelector(".studentCard").scrollIntoView({ behavior: "smooth" });
  };

  // ====== BUTTON EVENTS ======
  
  // 1. WhatsApp
  waBtn.addEventListener("click", () => {
    const phone = stPhone.value.trim().replace(/[^0-9]/g, ""); // Keep numbers only
    if (phone.length < 10) {
      alert("رقم الهاتف غير صحيح");
      return;
    }
    // Default to Egypt (+20) if no country code
    const finalPhone = phone.startsWith("20") ? phone : "20" + phone;
    window.open(`https://wa.me/${finalPhone}`, "_blank");
  });

  // 2. Copy Report
  copyReportBtn.addEventListener("click", () => {
     const d = reportDate.value || nowDateStr();
     const count = reportCount.textContent;
     const text = `📊 *تقرير السنتر*\n📅 التاريخ: ${prettyDate(d)}\n✅ الحضور: ${count}\n\n---\nتم الاستخراج من اللوحة`;
     
     navigator.clipboard.writeText(text).then(() => {
       const originalText = copyReportBtn.textContent;
       copyReportBtn.textContent = "تم النسخ 👍";
       setTimeout(() => copyReportBtn.textContent = originalText, 2000);
     });
  });

  // 3. Reset Term (The New Feature)
  resetTermBtn.addEventListener("click", () => {
    if (termPass.value !== ADMIN_PASS) {
      showMsg(resetMsg, "كلمة المرور خطأ!", "err");
      return;
    }
    if (!confirm("هل أنت متأكد؟ سيتم مسح (الحضور) و (المصاريف) فقط، وستبقى الأسماء كما هي.")) return;

    // Loop all students
    for (const key in students) {
      students[key].attendanceDates = []; // Clear dates
      students[key].paid = "";            // Clear fees
      // Name, Phone, Notes -> Stay Safe
    }
    attByDate = {}; // Clear daily logs
    saveAll();
    
    // UI Refresh
    termPass.value = "";
    showMsg(resetMsg, "تم تصفير الترم بنجاح! الأسماء موجودة، الحضور 0.", "ok");
    updateStudentUI(currentId);
    renderReport(nowDateStr());
    updateTopStats();
  });

  // 4. Full Reset
  resetBtn.addEventListener("click", () => {
    if (resetPass.value !== ADMIN_PASS) {
      showMsg(resetMsg, "كلمة المرور خطأ!", "err");
      return;
    }
    if (!confirm("تحذير! سيتم مسح كل شيء نهائياً. هل أنت متأكد؟")) return;

    localStorage.removeItem(K_STUDENTS);
    localStorage.removeItem(K_EXTRA_IDS);
    localStorage.removeItem(K_ATT_BY_DATE);
    students = {}; extraIds = []; attByDate = {}; currentId = null;
    
    ensureBase500();
    loadAll();
    updateStudentUI(null);
    renderReport(nowDateStr());
    showMsg(resetMsg, "تمت إعادة ضبط المصنع.", "ok");
  });

  // 5. Standard Actions
  loginBtn.addEventListener("click", () => {
    if (userInp.value === ADMIN_USER && passInp.value === ADMIN_PASS) {
      setAuth(true); showApp();
    } else showMsg(loginMsg, "خطأ في البيانات", "err");
  });

  quickAttendBtn.addEventListener("click", () => {
    const id = toInt(quickAttendId.value);
    if (!id || !existsId(id)) { showMsg(quickMsg, "ID خطأ", "err"); return; }
    const res = addAttendance(id, nowDateStr());
    showMsg(quickMsg, res.msg, res.ok ? "ok" : "err");
    updateStudentUI(id);
    renderReport(nowDateStr());
    quickAttendId.value = "";
    quickAttendId.focus();
  });

  openBtn.addEventListener("click", () => openStudent(toInt(openId.value)));
  searchAny.addEventListener("input", doSearchLive);
  
  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) return;
    const st = getStudent(currentId);
    st.name = stName.value.trim();
    st.className = stClass.value.trim();
    st.phone = stPhone.value.trim();
    st.paid = stPaid.value.trim();
    st.notes = stNotes.value.trim(); // Save Notes
    
    setStudent(st);
    showMsg(studentMsg, "تم الحفظ ✅", "ok");
    updateStudentUI(currentId);
    updateTopStats();
  });

  markTodayBtn.addEventListener("click", () => {
    if(!currentId) return;
    const res = addAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(currentId);
    renderReport(reportDate.value);
  });

  unmarkTodayBtn.addEventListener("click", () => {
    if(!currentId) return;
    const res = removeAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(currentId);
    renderReport(reportDate.value);
  });

  reportBtn.addEventListener("click", () => renderReport(reportDate.value));
  
  // Excel
  exportExcelBtn.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    
    // Students Sheet
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","الاسم","الصف","موبايل","مدفوع","ملاحظات","أيام الحضور"]];
    filled.forEach(st => {
       wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes, st.attendanceDates.length]);
    });
    
    // Attendance Sheet
    const wsAtt = [["التاريخ","ID","الاسم"]];
    Object.keys(attByDate).sort().forEach(d => {
       attByDate[d].forEach(id => {
         const st = getStudent(id);
         wsAtt.push([d, id, st ? st.name : ""]);
       });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "الطلاب");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAtt), "سجل الحضور");
    XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
  });

  importExcelInput.addEventListener("change", async () => {
    const f = importExcelInput.files[0];
    if(!f) return;
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, {type:"array"});
    
    const sName = wb.SheetNames.find(n => n.includes("الطلاب")) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sName], {header:1, defval:""});
    
    // Simple Import Logic
    const head = rows[0].map(x => String(x).toLowerCase().trim());
    const iID = head.findIndex(x=>x.includes("id"));
    const iName = head.findIndex(x=>x.includes("اسم")||x.includes("name"));
    const iPhone = head.findIndex(x=>x.includes("موبايل")||x.includes("phone"));
    const iPaid = head.findIndex(x=>x.includes("مدفوع")||x.includes("paid"));
    const iNote = head.findIndex(x=>x.includes("ملاحظات")||x.includes("note"));

    if (iID === -1) { alert("ملف الإكسيل لا يحتوي على عمود ID"); return; }

    for(let r=1; r<rows.length; r++) {
      const row = rows[r];
      const id = toInt(row[iID]);
      if(id) {
        if(!students[id]) { students[id] = makeEmptyStudent(id); if(id>BASE_MAX_ID) extraIds.push(id); }
        if(iName!==-1) students[id].name = row[iName];
        if(iPhone!==-1) students[id].phone = row[iPhone];
        if(iPaid!==-1) students[id].paid = row[iPaid];
        if(iNote!==-1) students[id].notes = row[iNote];
      }
    }
    saveAll();
    alert("تم الاستيراد بنجاح");
    location.reload(); // Refresh to show updates
  });

  // Init
  togglePassBtn?.addEventListener("click", () => passInp.type = passInp.type==="password"?"text":"password");
  logoutBtn.addEventListener("click", () => { setAuth(false); showLogin(); });

  const showLogin = () => { loginBox.classList.remove("hidden"); appBox.classList.add("hidden"); };
  const showApp = () => { 
    loginBox.classList.add("hidden"); 
    appBox.classList.remove("hidden");
    reportDate.value = nowDateStr();
    renderReport(nowDateStr());
    updateTopStats();
    
    // Auto Login from Query
    const url = new URL(window.location.href);
    const qId = toInt(url.searchParams.get("id"));
    if(qId && existsId(qId)) {
        updateStudentUI(qId);
        addAttendance(qId, nowDateStr()); // Auto attend
    }
  };

  loadAll();
  ensureBase500();
  isAuth() ? showApp() : showLogin();

})();
