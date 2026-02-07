/* =============================================
   Center Attendance System V4 - (Final Pro)
   Features: UI Fee Setting, Smart WhatsApp, Persistent Notes
   ============================================= */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  // ====== STORAGE KEYS ======
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v4"; // New Key for V4       
  const K_EXTRA_IDS = "ca_extra_ids_v4";     
  const K_ATT_BY_DATE = "ca_att_by_date_v4"; 
  const K_TERM_FEE = "ca_term_fee_v4"; // New Key for Fee

  // ====== DOM ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  // Top Bar Stats & Fee
  const totalStudentsCount = $("totalStudentsCount");
  const todayCountTop = $("todayCountTop");
  const termFeeInp = $("termFeeInp"); // New Fee Input
  const saveFeeBtn = $("saveFeeBtn"); // New Fee Save Btn

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
  const copyReportBtn = $("copyReportBtn");

  // Student Form
  const studentIdPill = $("studentIdPill");
  const todayStatus = $("todayStatus");
  const lastAttend = $("lastAttend");
  const daysCount = $("daysCount");
  const newBadge = $("newBadge");

  const stName = $("stName");
  const stClass = $("stClass");
  const stPhone = $("stPhone");
  const waBtn = $("waBtn");
  const stPaid = $("stPaid");
  const stNotes = $("stNotes"); // Notes Field

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const studentMsg = $("studentMsg");
  const attList = $("attList");

  // Danger Zone
  const resetTermBtn = $("resetTermBtn");
  const termPass = $("termPass");
  const resetBtn = $("resetBtn");
  const resetPass = $("resetPass");
  const resetMsg = $("resetMsg");

  // ====== STATE ======
  let students = {};              
  let extraIds = [];              
  let attByDate = {};             
  let currentId = null;
  let termFee = 0; // State for Fee

  // ====== SOUND ======
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880; 
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => osc.stop(), 150);
    } catch(e) {}
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
    el.style.display = "block";
  };

  const isAuth = () => localStorage.getItem(K_AUTH) === "1";
  const setAuth = (v) => v ? localStorage.setItem(K_AUTH, "1") : localStorage.removeItem(K_AUTH);

  // ====== DATA MANAGEMENT ======
  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    localStorage.setItem(K_TERM_FEE, String(termFee)); // Save Fee
    updateTopStats();
  };

  const loadAll = () => {
    // 1. Load Fee
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    termFeeInp.value = termFee > 0 ? termFee : "";

    // 2. Load Data (Try V4, fallback to V3/V1 migration if needed, but let's start fresh for V4 structure or copy)
    // To keep your data from V3, we will try to load V3 keys if V4 are empty.
    let sRaw = localStorage.getItem(K_STUDENTS);
    if(!sRaw) sRaw = localStorage.getItem("ca_students_v3"); // Migration from V3
    if(!sRaw) sRaw = localStorage.getItem("ca_students_v1"); // Migration from V1

    try { students = JSON.parse(sRaw || "{}") || {}; } catch { students = {}; }

    // Fix: Ensure all students have 'notes' field
    for(let k in students) {
        if(!students[k].notes) students[k].notes = "";
    }

    let eRaw = localStorage.getItem(K_EXTRA_IDS);
    if(!eRaw) eRaw = localStorage.getItem("ca_extra_ids_v3");
    try { extraIds = JSON.parse(eRaw || "[]") || []; } catch { extraIds = []; }

    let aRaw = localStorage.getItem(K_ATT_BY_DATE);
    if(!aRaw) aRaw = localStorage.getItem("ca_att_by_date_v3");
    try { attByDate = JSON.parse(aRaw || "{}") || {}; } catch { attByDate = {}; }

    updateTopStats();
  };

  const updateTopStats = () => {
    const filledCount = Object.values(students).filter(st => st.name && st.name.trim().length > 0).length;
    totalStudentsCount.textContent = filledCount;
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
    notes: "", 
    attendanceDates: [] 
  });

  const existsId = (id) => !!students[String(id)];
  const getStudent = (id) => students[String(id)] || null;
  const setStudent = (st) => { students[String(st.id)] = st; saveAll(); };

  const isFilledStudent = (st) => {
    if (!st) return false;
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
    playBeep(); 

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
      stNotes.value = ""; 
      stPaid.style.borderColor = "#d1d5da"; // reset color
      stPaid.style.background = "#fff";
      newBadge.classList.add("hidden");
      attList.innerHTML = `<div class="mutedCenter">— افتح طالب —</div>`;
      return;
    }

    // Basic Data
    stName.value = st.name || "";
    stClass.value = st.className || "";
    stPhone.value = st.phone || "";
    stPaid.value = st.paid || "";
    stNotes.value = st.notes || ""; // ✅ Load Notes Correctly

    // Color Logic for Paid (Green/Red)
    const paidVal = parseInt(st.paid) || 0;
    if (termFee > 0) {
        if(paidVal >= termFee) {
            stPaid.style.borderColor = "#2ea44f";
            stPaid.style.background = "#f0fff4"; // Light green bg
        } else {
            stPaid.style.borderColor = "#cf222e";
            stPaid.style.background = "#fff5f5"; // Light red bg
        }
    } else {
        stPaid.style.borderColor = "#d1d5da";
        stPaid.style.background = "#fff";
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
      
    // New Badge
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

  // ====== SEARCH ======
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
    searchAny.value = "";
    searchMsg.style.display = "none";
    updateStudentUI(id);
    document.querySelector(".studentCard").scrollIntoView({ behavior: "smooth" });
  };

  // ====== BUTTON EVENTS ======
  
  // 1. WhatsApp (FIXED)
  waBtn.addEventListener("click", () => {
    const phone = stPhone.value.trim().replace(/[^0-9]/g, ""); 
    if (phone.length < 10) {
      alert("رقم الهاتف غير صحيح أو فارغ");
      return;
    }
    // Auto add Egypt code +20 if missing
    let finalPhone = phone;
    if(!finalPhone.startsWith("20")) {
        // Simple check: if starts with 01, remove 0 and add 20
        if(finalPhone.startsWith("01")) finalPhone = "20" + finalPhone.substring(1);
        else finalPhone = "20" + finalPhone; // Fallback
    }
    window.open(`https://wa.me/${finalPhone}`, "_blank");
  });

  // 2. Copy Report (FIXED with Clipboard API)
  copyReportBtn.addEventListener("click", () => {
     const d = reportDate.value || nowDateStr();
     const count = reportCount.textContent;
     const total = totalStudentsCount.textContent;
     
     // Calculate Money Collected Today (Approx)
     // This is complex, so let's keep it simple for now:
     const text = `📊 *تقرير السنتر اليومي*\n📅 التاريخ: ${prettyDate(d)}\n✅ الحضور: ${count}\n👥 المسجلين: ${total}\n\n---\nتم الاستخراج من اللوحة 🎓`;
     
     if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyReportBtn.textContent;
            copyReportBtn.textContent = "تم النسخ بنجاح ✅";
            setTimeout(() => copyReportBtn.textContent = originalText, 2000);
        }).catch(err => alert("تعذر النسخ، المتصفح يمنع ذلك."));
     } else {
         alert("المتصفح لا يدعم النسخ التلقائي.");
     }
  });

  // 3. Save Fee (New)
  saveFeeBtn.addEventListener("click", () => {
      const val = toInt(termFeeInp.value);
      termFee = val > 0 ? val : 0;
      saveAll();
      alert(`تم حفظ مصاريف الترم: ${termFee}\nسيتم تحديث ألوان الطلاب الآن.`);
      if(currentId) updateStudentUI(currentId); // Refresh current student
  });

  // 4. Reset Term
  resetTermBtn.addEventListener("click", () => {
    if (termPass.value !== ADMIN_PASS) {
      showMsg(resetMsg, "كلمة المرور خطأ!", "err");
      return;
    }
    if (!confirm("هل أنت متأكد؟ سيتم مسح (الحضور) و (المصاريف) فقط.")) return;

    for (const key in students) {
      students[key].attendanceDates = []; 
      students[key].paid = "";            
    }
    attByDate = {}; 
    saveAll();
    
    termPass.value = "";
    showMsg(resetMsg, "تم تصفير الترم بنجاح!", "ok");
    updateStudentUI(currentId);
    renderReport(nowDateStr());
    updateTopStats();
  });

  // 5. Full Reset
  resetBtn.addEventListener("click", () => {
    if (resetPass.value !== ADMIN_PASS) {
      showMsg(resetMsg, "كلمة المرور خطأ!", "err");
      return;
    }
    if (!confirm("تحذير! سيتم مسح كل شيء نهائياً.")) return;

    localStorage.removeItem(K_STUDENTS);
    localStorage.removeItem(K_EXTRA_IDS);
    localStorage.removeItem(K_ATT_BY_DATE);
    localStorage.removeItem(K_TERM_FEE);
    students = {}; extraIds = []; attByDate = {}; currentId = null; termFee=0;
    
    ensureBase500();
    loadAll();
    updateStudentUI(null);
    renderReport(nowDateStr());
    showMsg(resetMsg, "تمت إعادة ضبط المصنع.", "ok");
  });

  // 6. Standard Actions
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
  
  // SAVE BUTTON (UPDATED: Saves Notes)
  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) return;
    const st = getStudent(currentId);
    st.name = stName.value.trim();
    st.className = stClass.value.trim();
    st.phone = stPhone.value.trim();
    st.paid = stPaid.value.trim();
    st.notes = stNotes.value.trim(); // ✅ Save Notes Logic
    
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
    location.reload(); 
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
