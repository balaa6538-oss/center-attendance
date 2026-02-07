/* =============================================
   Center System V12 (The Ultimate & Safe)
   Features: Full Logic + Crash Protection + Mobile Fix
   ============================================= */

// 1. كبسولة الأمان: الكود مش هيشتغل غير لما الصفحة تحمل بالكامل
document.addEventListener('DOMContentLoaded', () => {
  console.log("System V12 Loaded & Ready...");

  // ====== 2. TRANSLATIONS (الترجمة الاحترافية) ======
  const STRINGS = {
    ar: {
      brand_name: "لوحة السنتر",
      stat_students: "👥 مسجلين:",
      stat_attend: "✅ حضور اليوم:",
      stat_revenue: "💰 إيراد اليوم:",
      term_fee_label: "المطلوب:",
      btn_export: "تصدير Excel",
      btn_import: "استيراد Excel",
      btn_logout: "خروج",
      quick_title: "سريع (QR)",
      btn_record: "سجل حضور",
      search_title: "بحث شامل",
      btn_open: "فتح",
      add_title: "+ إضافة طالب جديد",
      btn_add_open: "إضافة وفتح",
      report_title: "حضور وتوريد بتاريخ",
      btn_copy_report: "نسخ الملخص 📋",
      btn_show: "عرض",
      rep_date: "التاريخ:",
      rep_count: "العدد:",
      rep_money: "الإيراد:",
      st_details: "بيانات الطالب",
      lbl_name: "الاسم",
      lbl_class: "الصف / المجموعة",
      lbl_phone: "رقم الموبايل",
      lbl_finance: "نظام المصاريف",
      pay_total: "💰 إجمالي المدفوع:",
      btn_deduct: "⚠️ خصم",
      pay_new: "➕ دفعة جديدة:",
      btn_deposit: "إيداع",
      lbl_notes: "ملاحظات (مؤرخة)",
      btn_add: "إضافة",
      btn_save: "حفظ البيانات 💾",
      btn_attend: "✅ حضور",
      btn_absent: "✖ غياب",
      btn_delete: "🗑️ حذف",
      history_title: "سجل التواريخ",
      btn_recycle: "♻️ سلة المحذوفات",
      danger_title: "⚠️ إدارة البيانات",
      danger_term: "1. تصفير الترم",
      btn_reset: "تصفير",
      danger_factory: "2. ضبط المصنع",
      btn_wipe: "مسح الكل",
      list_title: "قائمة الطلاب",
      th_name: "الاسم",
      th_class: "المجموعة",
      th_paid: "المدفوع",
      th_status: "الحالة",
      bin_title: "🗑️ سلة المحذوفات",
      btn_empty_bin: "إفراغ السلة نهائياً",
      login_title: "دخول لوحة السنتر",
      login_desc: "الدخول للمسؤول فقط",
      login_btn: "دخول"
    },
    en: {
      brand_name: "Center Panel",
      stat_students: "👥 Total Students:",
      stat_attend: "✅ Present:",
      stat_revenue: "💰 Revenue:",
      term_fee_label: "Tuition Fee:",
      btn_export: "Export Excel",
      btn_import: "Import Excel",
      btn_logout: "Logout",
      quick_title: "Quick Attend (QR)",
      btn_record: "Check In",
      search_title: "Global Search",
      btn_open: "Open",
      add_title: "+ Add New Student",
      btn_add_open: "Add & Open",
      report_title: "Daily Report",
      btn_copy_report: "Copy to WhatsApp 📋",
      btn_show: "Show",
      rep_date: "Date:",
      rep_count: "Count:",
      rep_money: "Revenue:",
      st_details: "Student Profile",
      lbl_name: "Full Name",
      lbl_class: "Group / Class",
      lbl_phone: "Phone Number",
      lbl_finance: "Tuition & Payments",
      pay_total: "💰 Total Paid:",
      btn_deduct: "⚠️ Correction",
      pay_new: "➕ New Payment:",
      btn_deposit: "Deposit",
      lbl_notes: "History Log",
      btn_add: "Add Note",
      btn_save: "Save Changes 💾",
      btn_attend: "✅ Present",
      btn_absent: "✖ Absent",
      btn_delete: "🗑️ Delete",
      history_title: "Attendance Log",
      btn_recycle: "♻️ Recycle Bin",
      danger_title: "⚠️ Data Management",
      danger_term: "1. Reset Term",
      btn_reset: "Reset Term",
      danger_factory: "2. Factory Reset",
      btn_wipe: "Wipe All",
      list_title: "Students List",
      th_name: "Name",
      th_class: "Group",
      th_paid: "Paid",
      th_status: "Status",
      bin_title: "🗑️ Recycle Bin",
      btn_empty_bin: "Empty Bin Permanently",
      login_title: "Admin Login",
      login_desc: "Authorized Access Only",
      login_btn: "Login"
    }
  };

  // ====== 3. SETTINGS & KEYS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v6";      
  const K_EXTRA_IDS = "ca_extra_ids_v6";     
  const K_ATT_BY_DATE = "ca_att_by_date_v6"; 
  const K_TERM_FEE = "ca_term_fee_v6"; 
  const K_REVENUE = "ca_revenue_v6"; 
  const K_DELETED = "ca_deleted_v9"; 
  const K_DARK_MODE = "ca_dark_mode";
  const K_LANG = "ca_lang";

  // ====== 4. SAFE DOM SELECTOR ======
  // دي الدالة السحرية اللي بتمنع التهنيج لو عنصر ناقص
  const $ = (id) => document.getElementById(id);

  // Helper to safely bind events
  const on = (id, event, handler) => { 
      const el = $(id);
      if(el) el.addEventListener(event, handler);
      // else console.warn(`Element ${id} missing - skipped safely`);
  };

  // ====== 5. STATE ======
  let students = {}; let deletedStudents = {}; let extraIds = [];              
  let attByDate = {}; let revenueByDate = {}; 
  let currentId = null; let termFee = 0; let isDarkMode = false; let currentLang = "ar";

  // ====== 6. HELPERS ======
  const nowDateStr = () => new Date().toISOString().split('T')[0];
  const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
  const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
  const escapeHtml = (s) => String(s||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const showMsg = (elId, txt, type) => {
    const el = $(elId);
    if(el) { el.textContent = txt; el.className = "msg "+type; el.style.display="block"; }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const osc = ctx.createOscillator(); osc.connect(ctx.destination);
      osc.frequency.value = 880; osc.start(); setTimeout(()=>osc.stop(), 100);
    } catch(e){}
  };

  // ====== 7. LANGUAGE ======
  const applyLanguage = (lang) => {
      currentLang = lang;
      localStorage.setItem(K_LANG, lang);
      const btn = $("langBtn");
      if(btn) btn.textContent = lang === "ar" ? "EN" : "ع";
      document.body.dir = lang === "ar" ? "rtl" : "ltr";
      document.querySelectorAll("[data-i18n]").forEach(el => {
          const key = el.getAttribute("data-i18n");
          if(STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
      });
  };

  // ====== 8. DATA LOAD/SAVE ======
  const loadAll = () => {
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    const feeInp = $("termFeeInp");
    if(feeInp) feeInp.value = termFee > 0 ? termFee : "";

    if(localStorage.getItem(K_DARK_MODE) === "1") toggleDarkMode(true);
    const savedLang = localStorage.getItem(K_LANG) || "ar";
    applyLanguage(savedLang);

    try {
      students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}");
      deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}");
      revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}");
      extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]");
      attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}");
    } catch(e) { console.error("Data Parse Error", e); }

    updateTopStats();
  };

  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    localStorage.setItem(K_TERM_FEE, String(termFee));
    localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
    updateTopStats();
  };

  const ensureBase500 = () => {
    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      if(!students[String(i)]) students[String(i)] = {
        id:i, name:"", className:"", phone:"", paid:0, notes:"", 
        joinedDate: nowDateStr(), attendanceDates: []
      };
    }
    saveAll();
  };

  const updateTopStats = () => {
    const elCount = $("totalStudentsCount");
    const elToday = $("todayCountTop");
    const elRev = $("todayRevenue");
    if(elCount) elCount.textContent = Object.values(students).filter(s => s.name || s.paid>0).length;
    if(elToday) elToday.textContent = (attByDate[nowDateStr()] || []).length;
    if(elRev) elRev.textContent = (revenueByDate[nowDateStr()] || 0) + " ج";
  };

  // ====== 9. AUTH ======
  const checkAuth = () => {
      if(localStorage.getItem(K_AUTH) === "1") showApp();
      else showLogin();
  };

  const showLogin = () => {
      const lb = $("loginBox"); const ab = $("appBox");
      if(lb) lb.classList.remove("hidden");
      if(ab) ab.classList.add("hidden");
  };

  const showApp = () => {
      const lb = $("loginBox"); const ab = $("appBox");
      if(lb) lb.classList.add("hidden");
      if(ab) ab.classList.remove("hidden");
      const repDate = $("reportDate");
      if(repDate) repDate.value = nowDateStr();
      renderReport(nowDateStr());
      updateTopStats();
  };

  // ====== 10. MAIN LOGIC ======
  const updateStudentUI = (id) => {
    currentId = id;
    const st = students[id];
    
    // UI Elements
    const pills = {id:$("studentIdPill"), status:$("todayStatus"), last:$("lastAttend"), count:$("daysCount")};
    const inps = {name:$("stName"), cls:$("stClass"), ph:$("stPhone"), note:$("stNotes"), paid:$("stTotalPaid"), newP:$("newPaymentInput")};
    const attL = $("attList");
    const delBtn = $("deleteStudentBtn");
    const badge = $("paymentBadge");
    const newB = $("newBadge");

    if (!st) { // Clear
      if(pills.id) pills.id.textContent = "ID: —";
      if(inps.name) inps.name.value = ""; 
      if(inps.paid) inps.paid.value = "";
      if(attL) attL.innerHTML = "—";
      if(delBtn) delBtn.style.display = "none";
      return;
    }

    if(delBtn) delBtn.style.display = "inline-flex";
    if(pills.id) pills.id.textContent = `ID: ${id}`;
    if(inps.name) inps.name.value = st.name || "";
    if(inps.cls) inps.cls.value = st.className || "";
    if(inps.ph) inps.ph.value = st.phone || "";
    if(inps.note) inps.note.value = st.notes || "";
    if(inps.paid) inps.paid.value = (st.paid||0) + " ج";
    if(inps.newP) inps.newP.value = "";

    // Badge
    if(badge) {
        badge.classList.remove("hidden");
        const paid = st.paid || 0;
        if(termFee > 0) {
            if(paid >= termFee) { badge.textContent = "✅ خالص"; badge.className="paymentBadge paid"; }
            else if(paid > 0) { badge.textContent = `⚠️ باقي ${termFee-paid}`; badge.className="paymentBadge partial"; }
            else { badge.textContent = "🔴 لم يدفع"; badge.className="paymentBadge unpaid"; }
        } else {
            if(paid > 0) { badge.textContent = `💰 مدفوع: ${paid}`; badge.className="paymentBadge partial"; }
            else { badge.textContent = "—"; badge.style.background="#eee"; }
        }
    }

    // Attendance
    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    if(pills.status) {
        pills.status.textContent = dates.includes(today) ? "✅ حاضر" : "✖ غياب";
        pills.status.style.color = dates.includes(today) ? "green" : "red";
    }
    if(pills.count) pills.count.textContent = dates.length;
    if(attL) {
        attL.innerHTML = dates.length 
            ? dates.slice().reverse().slice(0,20).map(d=>`<div>${prettyDate(d)}</div>`).join("")
            : "—";
    }
    if(newB) {
        if(dates.length === 0 && st.name) newB.classList.remove("hidden");
        else newB.classList.add("hidden");
    }
  };

  const addAttendance = (id, dateStr) => {
      const st = students[id];
      if(!st) return {ok:false, msg:"ID Error"};
      if(!st.attendanceDates.includes(dateStr)) {
          st.attendanceDates.push(dateStr);
          if(!attByDate[dateStr]) attByDate[dateStr] = [];
          if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
          saveAll(); playBeep();
          return {ok:true, msg:"تم الحضور"};
      }
      return {ok:false, msg:"حاضر مسبقاً"};
  };

  const moveToBin = (id) => {
      const st = students[id];
      if(!st || (!st.name && st.paid===0)) return;
      
      let deduct = false;
      if(st.paid > 0) {
          if(confirm(`⚠️ تنبيه مالي!\nالطالب ده دافع (${st.paid}).\nنخصم المبلغ ده من إيراد النهاردة؟`)) deduct = true;
      }
      if(deduct) {
          const t = nowDateStr();
          revenueByDate[t] = (revenueByDate[t]||0) - st.paid;
      }
      
      deletedStudents[id] = JSON.parse(JSON.stringify(st));
      students[id] = {id:id, name:"", paid:0, notes:"", attendanceDates:[]};
      if(id > BASE_MAX_ID) { delete students[id]; extraIds = extraIds.filter(x=>x!==id); }
      
      saveAll(); updateStudentUI(null); renderReport(nowDateStr());
      alert("تم النقل للسلة 🗑️");
  };

  const renderReport = (d) => {
      const list = $("reportList");
      if(!list) return;
      const ids = attByDate[d] || [];
      const lbl = $("reportDateLabel"); if(lbl) lbl.textContent = prettyDate(d);
      const cnt = $("reportCount"); if(cnt) cnt.textContent = ids.length;
      const mon = $("reportMoney"); if(mon) mon.textContent = (revenueByDate[d]||0) + " ج";
      
      if(!ids.length) list.innerHTML = "<div class='mutedCenter'>لا يوجد حضور</div>";
      else {
          list.innerHTML = ids.map(id => {
              const s = students[id];
              return `<div class="item" onclick="window.extOpen(${id})">(${id}) ${s?s.name:"?"}</div>`;
          }).join("");
      }
  };

  const toggleDarkMode = (force) => {
      isDarkMode = force !== undefined ? force : !isDarkMode;
      document.body.classList.toggle("dark-mode", isDarkMode);
      localStorage.setItem(K_DARK_MODE, isDarkMode?"1":"0");
      const btn = $("darkModeBtn"); if(btn) btn.textContent = isDarkMode ? "☀️" : "🌙";
  };

  // ====== 11. BINDINGS & ACTIONS (Protected) ======
  // Login
  on("loginBtn", "click", () => {
      const u = $("user").value.trim(); 
      const p = $("pass").value.trim();
      if(u === ADMIN_USER && p === ADMIN_PASS) {
          localStorage.setItem(K_AUTH, "1"); showApp();
      } else showMsg("loginMsg", "بيانات خطأ", "err");
  });
  on("logoutBtn", "click", () => { localStorage.removeItem(K_AUTH); showLogin(); });
  on("togglePass", "click", () => { const p=$("pass"); if(p) p.type = p.type==="password"?"text":"password"; });

  // Settings
  on("langBtn", "click", () => applyLanguage(currentLang==="ar"?"en":"ar"));
  on("darkModeBtn", "click", () => toggleDarkMode());

  // Search & Actions
  window.extOpen = (id) => { updateStudentUI(id); const c=document.querySelector(".studentCard"); if(c) c.scrollIntoView({behavior:"smooth"}); };
  
  on("openBtn", "click", () => window.extOpen(toInt($("openId").value)));
  on("searchAny", "input", (e) => {
      const q = e.target.value.toLowerCase();
      const res = $("searchMsg");
      if(!q) { if(res) res.style.display="none"; return; }
      const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q)).slice(0,5);
      if(res) {
          res.style.display = "block";
          res.innerHTML = found.map(s=>`<div class="item" onclick="window.extOpen(${s.id})">${s.name} (${s.id})</div>`).join("");
      }
  });

  // Attendance
  on("quickAttendBtn", "click", () => {
      const id = toInt($("quickAttendId").value);
      const res = addAttendance(id, nowDateStr());
      showMsg("quickMsg", res.msg, res.ok?"ok":"err");
      updateStudentUI(id); renderReport(nowDateStr());
      $("quickAttendId").value = ""; $("quickAttendId").focus();
  });
  on("markTodayBtn", "click", () => {
      if(!currentId) return;
      addAttendance(currentId, nowDateStr());
      updateStudentUI(currentId); renderReport(nowDateStr());
  });
  on("unmarkTodayBtn", "click", () => {
      if(!currentId) return;
      const st = students[currentId];
      if(st) {
          st.attendanceDates = st.attendanceDates.filter(d => d !== nowDateStr());
          if(attByDate[nowDateStr()]) attByDate[nowDateStr()] = attByDate[nowDateStr()].filter(x => x !== currentId);
          saveAll(); updateStudentUI(currentId); renderReport(nowDateStr());
      }
  });

  // Money & Save
  on("saveStudentBtn", "click", () => {
      if(!currentId) return;
      const st = students[currentId];
      st.name = $("stName").value; st.className = $("stClass").value; st.phone = $("stPhone").value; st.notes = $("stNotes").value;
      saveAll(); showMsg("studentMsg", "تم الحفظ", "ok"); updateTopStats();
  });
  on("addPaymentBtn", "click", () => {
      if(!currentId) return;
      const v = parseInt($("newPaymentInput").value);
      if(!v) return;
      students[currentId].paid = (students[currentId].paid||0) + v;
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + v;
      saveAll(); playBeep(); alert("تم الإيداع"); updateStudentUI(currentId); renderReport(nowDateStr());
  });
  on("correctPayBtn", "click", () => {
      if(!currentId) return;
      const v = parseInt(prompt("خصم كام؟"));
      if(!v) return;
      students[currentId].paid = Math.max(0, (students[currentId].paid||0) - v);
      revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0) - v);
      saveAll(); alert("تم الخصم"); updateStudentUI(currentId); renderReport(nowDateStr());
  });

  // Bin & Modals
  on("deleteStudentBtn", "click", () => { if(currentId && confirm("حذف؟")) moveToBin(currentId); });
  
  // Lists
  const renderList = (filterC, filterS) => {
      const tb = $("allStudentsTable").querySelector("tbody");
      tb.innerHTML = "";
      Object.values(students).filter(s => s.name || s.paid>0).forEach(s => {
          // Add filters here if needed
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.paid}</td><td>-</td>`;
          tr.onclick = () => { $("allStudentsModal").classList.add("hidden"); window.extOpen(s.id); };
          tb.appendChild(tr);
      });
  };
  on("openAllStudentsBtn", "click", () => { renderList(); $("allStudentsModal").classList.remove("hidden"); });
  on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));

  on("openBinBtn", "click", () => { 
      const bl = $("binList"); bl.innerHTML = "";
      Object.values(deletedStudents).forEach(s => {
          bl.innerHTML += `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="restoreStudent(${s.id})">استعادة</button></div>`;
      });
      $("recycleBinModal").classList.remove("hidden"); 
  });
  on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
  
  window.restoreStudent = (id) => {
      if(students[id] && (students[id].name || students[id].paid>0)) {
          if(!confirm("المكان مشغول.. نبدله؟")) return;
      }
      students[id] = deletedStudents[id]; delete deletedStudents[id];
      saveAll(); alert("تمت الاستعادة"); $("recycleBinModal").classList.add("hidden"); window.extOpen(id);
  };

  // Excel & Copy
  on("copyReportBtn", "click", () => {
      const txt = `تقرير: ${$("reportDateLabel").textContent} \n عدد: ${$("reportCount").textContent} \n ايراد: ${$("reportMoney").textContent}`;
      navigator.clipboard.writeText(txt).then(() => alert("تم النسخ"));
  });

  // Init
  loadAll();
  ensureBase500();
  checkAuth();

}); // End of Safe Mode    attendance: {},
    revenue: {},
    bin: {},
    termFee: 0,
    lang: localStorage.getItem(KEYS.LANG) || "ar"
  };

  // ====== 4. TRANSLATIONS ======
  const STRINGS = {
    ar: { title: "لوحة السنتر", login_err: "بيانات خاطئة", save: "تم الحفظ", attend: "تم الحضور" },
    en: { title: "Center Panel", login_err: "Wrong Info", save: "Saved", attend: "Checked In" }
  };

  // ====== 5. CORE LOGIC (Load & Save) ======
  function loadData() {
    try {
      // 1. Try Load Students (Old & New)
      const rawSt = localStorage.getItem(KEYS.STUDENTS);
      if(rawSt) appState.students = JSON.parse(rawSt);
      else initBaseStudents();

      // 2. Load Attendance & Revenue
      const rawData = localStorage.getItem(KEYS.DATA);
      if(rawData) {
        const d = JSON.parse(rawData);
        appState.attendance = d.att || {};
        appState.revenue = d.rev || {};
        appState.bin = d.bin || {};
        appState.termFee = d.fee || 0;
      }
      
      console.log("Data Loaded Successfully");
    } catch (e) {
      console.error("Data Corrupted, Fixing...", e);
      initBaseStudents(); // Reset if crash
    }
    applyLang(appState.lang);
    updateUI();
  }

  function saveData() {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(appState.students));
    const metaData = {
      att: appState.attendance,
      rev: appState.revenue,
      bin: appState.bin,
      fee: appState.termFee
    };
    localStorage.setItem(KEYS.DATA, JSON.stringify(metaData));
    updateUI();
  }

  function initBaseStudents() {
    for(let i=1; i<=500; i++) {
      if(!appState.students[i]) appState.students[i] = {id:i, name:"", paid:0, dates:[]};
    }
    saveData();
  }

  function applyLang(lang) {
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
    const btn = $("langBtn");
    if(btn) btn.textContent = lang === "ar" ? "EN" : "ع";
    // Basic Text Updates
    const title = document.querySelector(".brand");
    if(title && STRINGS[lang]) title.childNodes[0].nodeValue = STRINGS[lang].title;
  }

  // ====== 6. MAIN FUNCTIONS ======
  function login() {
    const userInp = $("user");
    const passInp = $("pass");
    if(!userInp || !passInp) return;

    // TRIM FIX FOR MOBILE
    const u = userInp.value.trim();
    const p = passInp.value.trim();

    if(u === ADMIN_USER && p === ADMIN_PASS) {
      localStorage.setItem(KEYS.AUTH, "1");
      showAppScreen();
    } else {
      showMsg($("loginMsg"), STRINGS[appState.lang].login_err, "err");
    }
  }

  function checkAuth() {
    if(localStorage.getItem(KEYS.AUTH) === "1") showAppScreen();
    else showLoginScreen();
  }

  function showLoginScreen() {
    const lb = $("loginBox"); const ab = $("appBox");
    if(lb) lb.classList.remove("hidden");
    if(ab) ab.classList.add("hidden");
  }

  function showAppScreen() {
    const lb = $("loginBox"); const ab = $("appBox");
    if(lb) lb.classList.add("hidden");
    if(ab) ab.classList.remove("hidden");
    updateUI();
  }

  // ====== 7. UI UPDATES ======
  function updateUI() {
    // Stats
    const countEl = $("totalStudentsCount");
    if(countEl) {
      const count = Object.values(appState.students).filter(s => s.name || s.paid > 0).length;
      countEl.textContent = count;
    }
    
    // Revenue
    const revEl = $("todayRevenue");
    if(revEl) {
      const today = nowStr();
      revEl.textContent = (appState.revenue[today] || 0) + " ج";
    }

    // Report List (Basic)
    const repList = $("reportList");
    if(repList) {
        const today = $("reportDate") ? $("reportDate").value : nowStr();
        const ids = appState.attendance[today] || [];
        if(ids.length === 0) repList.innerHTML = "<div class='mutedCenter'>—</div>";
        else {
            repList.innerHTML = ids.map(id => {
                const s = appState.students[id];
                return `<div class="item">(${id}) ${s ? s.name : '?'}</div>`;
            }).join("");
        }
    }
  }

  // ====== 8. EVENT LISTENERS (CRASH PROOF) ======
  function bind(id, event, func) {
    const el = $(id);
    if(el) el.addEventListener(event, func);
    else console.warn("Missing Element:", id);
  }

  // Auth Events
  bind("loginBtn", "click", login);
  bind("logoutBtn", "click", () => {
    localStorage.removeItem(KEYS.AUTH);
    showLoginScreen();
  });
  bind("togglePass", "click", () => {
    const p = $("pass");
    if(p) p.type = p.type==="password"?"text":"password";
  });

  // Actions
  bind("langBtn", "click", () => {
    appState.lang = appState.lang === "ar" ? "en" : "ar";
    localStorage.setItem(KEYS.LANG, appState.lang);
    applyLang(appState.lang);
  });

  bind("darkModeBtn", "click", () => {
    document.body.classList.toggle("dark-mode");
  });

  bind("openBtn", "click", () => {
    const id = parseInt($("openId").value);
    if(appState.students[id]) {
      alert("Opening Student: " + id); // Simple Alert for test
      // Full Open Logic Here (Simplified for safety first)
    } else {
      alert("ID Not Found");
    }
  });

  // Quick Attend (Test)
  bind("quickAttendBtn", "click", () => {
    const id = parseInt($("quickAttendId").value);
    if(appState.students[id]) {
      const today = nowStr();
      if(!appState.attendance[today]) appState.attendance[today] = [];
      if(!appState.attendance[today].includes(id)) {
        appState.attendance[today].push(id);
        alert(STRINGS[appState.lang].attend);
        saveData();
      } else {
        alert("Already here");
      }
    } else {
      alert("ID Error");
    }
  });

  // ====== 9. INITIALIZE ======
  loadData();
  checkAuth();

}); // End of DOMContentLoaded
