/* =============================================
   Center System V-PRO (ULTIMATE VERSION)
   - Kept: All Core Data Logic, LocalStorage, Export, Import, Bin, Danger Zone.
   - NEW: Bottom Navigation Logic (Home, Students, Admin).
   - NEW: Toast Notifications & Undo System (5 seconds).
   - NEW: Live Feed (Last 5 check-ins).
   - NEW: Payment Progress Bar (Water Fill) & Confetti.
   - NEW: Grouped Daily Report by Class.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  console.log("System V-PRO Loaded...");

  // ====== 1. Configuration & Auth ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; // Full Access
  const ASST_USER  = "User";
  const ASST_PASS  = "11112222"; // Restricted Access

  let currentUserRole = "admin"; 

  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;
  const ITEMS_PER_PAGE = 50;
  const MAX_IMG_SIZE = 3000000; // 3MB Limit for Wallpaper

  // LocalStorage Keys
  const K_AUTH = "ca_auth_v2"; 
  const K_ROLE = "ca_role_v1";
  const K_STUDENTS = "ca_students_v6";      
  const K_EXTRA_IDS = "ca_extra_ids_v6";     
  const K_ATT_BY_DATE = "ca_att_by_date_v6"; 
  const K_TERM_FEE = "ca_term_fee_v6"; 
  const K_REVENUE = "ca_revenue_v6"; 
  const K_DELETED = "ca_deleted_v9"; 
  const K_THEME = "ca_theme_v1";
  const K_LANG = "ca_lang";
  const K_LAST_BACKUP = "ca_last_backup";
  const K_BG_IMAGE = "ca_bg_image";

  // Global State
  let students = {}; let deletedStudents = {}; let extraIds = [];              
  let attByDate = {}; let revenueByDate = {}; 
  let currentId = null; let termFee = 0; let currentLang = "ar";
  let currentPage = 1; let currentFilteredList = []; 
  let recentScans = []; // NEW: For Live Feed

  // Helpers
  const $ = (id) => document.getElementById(id);
  const on = (id, event, handler) => { const el=$(id); if(el) el.addEventListener(event, handler); };
  const nowDateStr = () => new Date().toISOString().split('T')[0];
  const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
  const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };

  // Translations
  const STRINGS = {
    ar: {
      login_title: "دخول لوحة السنتر", login_desc: "يرجى تسجيل الدخول", login_btn: "دخول",
      brand_name: "لوحة السنتر", stat_students: "👥 مسجلين:", stat_attend: "✅ حضور:", stat_revenue: "💰 إيراد:",
      btn_export: "تصدير Excel", btn_logout: "خروج",
      quick_title: "سريع (QR)", btn_record: "سجل حضور", search_title: "بحث شامل", btn_open: "فتح",
      add_title: "+ إضافة طالب جديد", btn_add_open: "إضافة وفتح",
      report_title: "حضور وتوريد بتاريخ", btn_copy_report: "نسخ الملخص 📋", btn_show: "عرض",
      rep_date: "التاريخ:", rep_count: "العدد:", rep_money: "الإيراد:",
      st_details: "بيانات الطالب", lbl_name: "الاسم", lbl_class: "الصف / المجموعة", lbl_phone: "رقم الموبايل",
      lbl_finance: "نظام المصاريف", pay_total: "💰 إجمالي المدفوع:", btn_deduct: "⚠️ خصم",
      pay_new: "➕ دفعة جديدة:", btn_deposit: "إيداع", lbl_notes: "ملاحظات", btn_add: "إضافة",
      btn_save: "حفظ البيانات 💾", btn_attend: "✅ حضور", btn_absent: "✖ غياب", btn_delete: "🗑️ حذف",
      history_title: "سجل التواريخ", btn_recycle: "♻️ سلة المحذوفات",
      danger_title: "⚠️ إدارة البيانات", danger_term: "1. تصفير الترم", btn_reset: "تصفير",
      danger_factory: "2. ضبط المصنع", btn_wipe: "مسح الكل", list_title: "قائمة الطلاب",
      th_name: "الاسم", th_class: "المجموعة", th_paid: "المدفوع", th_status: "المالية", btn_empty_bin: "إفراغ السلة نهائياً"
    },
    en: {
      login_title: "System Login", login_desc: "Please Login", login_btn: "Login",
      brand_name: "Center Panel", stat_students: "👥 Students:", stat_attend: "✅ Present:", stat_revenue: "💰 Revenue:",
      btn_export: "Export Excel", btn_logout: "Logout",
      quick_title: "Quick Scan (QR)", btn_record: "Check In", search_title: "Global Search", btn_open: "Open",
      add_title: "+ Add Student", btn_add_open: "Add & Open",
      report_title: "Daily Report", btn_copy_report: "Copy Report 📋", btn_show: "Show",
      rep_date: "Date:", rep_count: "Count:", rep_money: "Revenue:",
      st_details: "Student Profile", lbl_name: "Name", lbl_class: "Group", lbl_phone: "Phone",
      lbl_finance: "Finance", pay_total: "💰 Total Paid:", btn_deduct: "⚠️ Deduct",
      pay_new: "➕ Deposit:", btn_deposit: "Deposit", lbl_notes: "Notes", btn_add: "Add Note",
      btn_save: "Save Info 💾", btn_attend: "✅ Present", btn_absent: "✖ Absent", btn_delete: "🗑️ Delete",
      history_title: "History Log", btn_recycle: "♻️ Recycle Bin",
      danger_title: "⚠️ Data Admin", danger_term: "1. Reset Term", btn_reset: "Reset Term",
      danger_factory: "2. Factory Reset", btn_wipe: "Wipe All", list_title: "Student List",
      th_name: "Name", th_class: "Group", th_paid: "Paid", th_status: "Status", btn_empty_bin: "Empty Bin"
    }
  };

  // ====== NEW: UI Pro Features ======
  const showToast = (msg, type = "success") => {
      let container = $("toastContainer");
      if(!container) {
          container = document.createElement("div");
          container.id = "toastContainer";
          document.body.appendChild(container);
      }
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `<span style="margin-left:10px;">${type==='success'?'✅':(type==='err'?'❌':'⚠️')}</span> ${msg}`;
      container.appendChild(toast);
      
      setTimeout(() => {
          toast.style.animation = "slideOut 0.3s forwards";
          setTimeout(() => toast.remove(), 300);
      }, 3000);
  };

  const showUndoToast = (msg, onUndo) => {
      let container = $("toastContainer");
      if(!container) return;
      const toast = document.createElement("div");
      toast.className = `toast toast-warning undo-toast`;
      toast.innerHTML = `<span>⚠️ ${msg}</span> <button class="btn smallBtn" id="tempUndoBtn">تراجع ↩️</button>`;
      container.appendChild(toast);
      
      let isUndone = false;
      toast.querySelector("#tempUndoBtn").onclick = () => {
          isUndone = true; onUndo(); toast.remove();
      };
      setTimeout(() => {
          if(!isUndone) { toast.style.animation = "slideOut 0.3s forwards"; setTimeout(() => toast.remove(), 300); }
      }, 5000);
  };

  const fireConfetti = () => {
      for(let i=0; i<30; i++) {
          const conf = document.createElement("div"); conf.className = "confetti";
          conf.style.left = Math.random() * 100 + "vw";
          conf.style.backgroundColor = ['#2ea44f', '#2f6bff', '#d69e2e', '#cf222e'][Math.floor(Math.random()*4)];
          conf.style.animationDuration = (Math.random() * 2 + 1) + "s";
          document.body.appendChild(conf);
          setTimeout(() => conf.remove(), 3000);
      }
  };

  const updateLiveFeed = (st) => {
      recentScans.unshift({ name: st.name || "بدون اسم", id: st.id, cls: st.className || "بدون فرقة", time: new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) });
      if(recentScans.length > 5) recentScans.pop();
      const feed = $("liveFeedBox");
      if(feed) {
          feed.innerHTML = recentScans.map(s => 
              `<div class="feed-item"><span class="feed-time">${s.time}</span> <b>${s.name}</b> <span class="feed-tag">${s.cls}</span> <span class="feed-id">#${s.id}</span></div>`
          ).join("");
      }
  };

  window.switchTab = (tabId) => {
      document.querySelectorAll(".tab-section").forEach(s => s.classList.add("hidden"));
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      
      const sec = $(`sec${tabId}`); const btn = $(`btnTab${tabId}`);
      if(sec) { sec.classList.remove("hidden"); sec.style.animation = "fadeIn 0.3s ease"; }
      if(btn) btn.classList.add("active");
  };

  // Sound Effects
  const playSound = (type) => {
      try {
          const ctx = new (window.AudioContext||window.webkitAudioContext)();
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          
          if(type==="money") { // Cha-Ching!
              osc.type = "sine"; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5);
          } else if(type==="success") {
              osc.frequency.setValueAtTime(587, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3);
          } else { 
              osc.type = "sawtooth"; osc.frequency.setValueAtTime(150, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2); osc.start(); osc.stop(ctx.currentTime + 0.2);
          }
      } catch(e) {}
  };

  const makeEmptyStudent = (id) => ({ id: id, name: "", className: "", phone: "", paid: 0, notes: "", joinedDate: nowDateStr(), attendanceDates: [] });

  // ====== 2. Core Logic ======
  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    localStorage.setItem(K_TERM_FEE, String(termFee));
    localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
    updateTopStats();
  };

  const loadAll = () => {
    try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}"); } catch { students = {}; }
    try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}"); } catch { deletedStudents = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}"); } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]"); } catch { extraIds = []; }
    try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}"); } catch { attByDate = {}; }
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    
    if(!attByDate) attByDate={}; if(!revenueByDate) revenueByDate={};

    const savedTheme = localStorage.getItem(K_THEME) || "classic";
    applyTheme(savedTheme);
    const savedBg = localStorage.getItem(K_BG_IMAGE);
    if(savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;
    const savedLang = localStorage.getItem(K_LANG) || "ar";
    applyLanguage(savedLang);

    if($("termFeeInp")) $("termFeeInp").value = termFee > 0 ? termFee : "";
    updateTopStats();
    checkBackupStatus();
  };

  const ensureBase500 = () => {
    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i);
    }
    saveAll();
  };

  const applyTheme = (theme) => {
      document.body.className = ""; 
      if(theme === "dark") document.body.classList.add("theme-dark");
      else if(theme === "glass") document.body.classList.add("theme-glass");
      localStorage.setItem(K_THEME, theme);
      if($("themeSelector")) $("themeSelector").value = theme;
  };

  const applyLanguage = (lang) => {
      currentLang = lang; localStorage.setItem(K_LANG, lang);
      document.body.dir = lang === "ar" ? "rtl" : "ltr";
      document.querySelectorAll("[data-i18n]").forEach(el => {
          const key = el.getAttribute("data-i18n");
          if(STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
      });
  };

  // ====== 3. Auth & Permissions ======
  const checkAuth = () => {
      const isAuth = localStorage.getItem(K_AUTH);
      const loginBox = $("loginBox"); const appBox = $("appBox");

      if(isAuth === "1") {
          currentUserRole = localStorage.getItem(K_ROLE) || "admin";
          loginBox.style.display = "none"; loginBox.classList.add("hidden");
          appBox.style.display = "block"; appBox.classList.remove("hidden");
          showApp();
      } else {
          loginBox.style.display = "block"; loginBox.classList.remove("hidden");
          appBox.style.display = "none"; appBox.classList.add("hidden");
      }
  };

  const applyPermissions = () => {
      const isAdmin = (currentUserRole === "admin");
      document.querySelectorAll(".adminOnly").forEach(el => {
          if(isAdmin) el.classList.remove("hidden");
          else el.classList.add("hidden");
      });
      if(!isAdmin) {
          if($("deleteStudentBtn")) $("deleteStudentBtn").classList.add("hidden");
          if($("correctPayBtn")) $("correctPayBtn").classList.add("hidden");
      }
  };

  const doLogin = () => {
      const u = $("user").value.trim(); const p = $("pass").value.trim();
      if(u === ADMIN_USER && p === ADMIN_PASS) { localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); checkAuth(); } 
      else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) { localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "assistant"); checkAuth(); } 
      else { showToast("خطأ في بيانات الدخول", "err"); playSound("error"); }
  };

  const doLogout = () => { localStorage.removeItem(K_AUTH); localStorage.removeItem(K_ROLE); location.reload(); };

  // ====== 4. Main UI ======
  const showApp = () => {
      applyPermissions();
      $("reportDate").value = nowDateStr();
      renderReport(nowDateStr());
      updateTopStats();
      window.switchTab('Home'); // Default View
      setTimeout(checkQR, 500); 
  };

  const updateTopStats = () => {
      const animateValue = (id, end) => {
          const obj = $(id); if(!obj) return;
          if(end === 0) { obj.textContent = "0"; return; }
          let start = 0; const duration = 500; let startTimestamp = null;
          const step = (timestamp) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / duration, 1);
              obj.textContent = Math.floor(progress * (end - start) + start);
              if (progress < 1) window.requestAnimationFrame(step);
              else obj.textContent = end + (id==="todayRevenue"?" ج":"");
          };
          window.requestAnimationFrame(step);
      };
      const filledCount = Object.values(students).filter(s => s.name || s.paid>0).length;
      const todayCount = (attByDate[nowDateStr()] || []).length;
      const revenue = revenueByDate[nowDateStr()] || 0;
      animateValue("totalStudentsCount", filledCount);
      animateValue("todayCountTop", todayCount);
      animateValue("todayRevenue", revenue);
  };

  // ====== 5. Student Operations ======
  const updateStudentUI = (id) => {
    currentId = id; const st = students[id];
    const pills = {id:$("studentIdPill"), status:$("todayStatus"), last:$("lastAttend"), count:$("daysCount")};
    const inps = {name:$("stName"), cls:$("stClass"), ph:$("stPhone"), note:$("stNotes"), paid:$("stTotalPaid")};
    const avatar = $("stAvatar"); const badge = $("newBadge");

    if (!st) return; 

    pills.id.textContent = `ID: ${id}`;
    inps.name.value = st.name || ""; inps.cls.value = st.className || ""; 
    inps.ph.value = st.phone || ""; inps.note.value = st.notes || ""; 
    inps.paid.value = (st.paid||0) + " ";
    if($("newNoteInp")) $("newNoteInp").value = "";
    if($("newPaymentInput")) $("newPaymentInput").value = "";

    // NEW: Payment Water Fill Progress
    const paid = st.paid || 0; const req = termFee;
    let statusClass = ""; let percent = 0;
    if(req > 0) {
        percent = Math.min((paid/req)*100, 100);
        if(paid >= req) statusClass = "status-border-green";
        else if(paid > 0) statusClass = "status-border-yellow";
        else statusClass = "status-border-red";
    }
    const card = document.querySelector(".studentCard");
    card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
    if(statusClass) card.classList.add(statusClass);

    if($("stTotalPaid")) {
        $("stTotalPaid").style.background = req > 0 ? `linear-gradient(to left, #e6ffe6 ${percent}%, #f0f2f5 ${percent}%)` : "#f0f2f5";
        $("stTotalPaid").style.border = percent === 100 ? "2px solid var(--success)" : "1px solid var(--border-color)";
    }

    const today = nowDateStr(); const dates = st.attendanceDates || []; const isPresent = dates.includes(today);
    
    if(isPresent) {
        pills.status.textContent = currentLang==="ar"?"✅ حاضر":"✅ Present";
        pills.status.style.color = "green"; avatar.classList.add("present"); 
    } else {
        pills.status.textContent = currentLang==="ar"?"✖ غياب":"✖ Absent";
        pills.status.style.color = "red"; avatar.classList.remove("present"); 
    }

    // NEW: Streaks (Days Count)
    pills.count.innerHTML = `${dates.length} <span style="font-size:0.8em; opacity:0.7">يوم</span>`;
    $("attList").innerHTML = dates.slice().reverse().slice(0,20).map(d=>`<div>${prettyDate(d)}</div>`).join("");
    if(dates.length === 0 && st.name) badge.classList.remove("hidden"); else badge.classList.add("hidden");
  };

  const addAttendance = (id, dateStr) => {
      const st = students[id];
      if(!st) return {ok:false, msg:"ID Not Found"};
      if(!st.attendanceDates.includes(dateStr)) {
          st.attendanceDates.push(dateStr);
          if(!attByDate[dateStr]) attByDate[dateStr] = [];
          if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
          saveAll(); playSound("success"); updateLiveFeed(st);
          return {ok:true, msg: currentLang==="ar" ? "تم تسجيل الحضور ✅" : "Checked In ✅"};
      }
      playSound("error");
      return {ok:false, msg: currentLang==="ar" ? "حاضر مسبقاً ⚠️" : "Already Present ⚠️"};
  };

  const removeAttendance = (id, dateStr) => {
    const st = students[id]; if(!st) return;
    st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
    if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
    saveAll();
  };

  // ====== 6. List & Pagination ======
  const renderList = () => {
      const filterGroup = $("filterClass") ? $("filterClass").value : "all"; 
      const filterStatus = $("filterStatus") ? $("filterStatus").value : "all"; 
      const filterAttend = $("filterAttend") ? $("filterAttend").value : "all"; 
      
      const sel = $("filterClass");
      if(sel && sel.options.length <= 1) { 
          const allClasses = new Set();
          Object.values(students).forEach(s => { if(s.className) allClasses.add(s.className); });
          allClasses.forEach(c => {
              const opt = document.createElement("option"); opt.value = c; opt.innerText = c; sel.appendChild(opt);
          });
      }

      const filled = Object.values(students).filter(s => s.name || s.paid > 0);
      const today = nowDateStr(); 

      currentFilteredList = filled.filter(s => {
          if(filterGroup !== "all" && s.className !== filterGroup) return false;
          if(filterStatus !== "all") {
              const p = s.paid || 0; const req = termFee;
              if(req > 0) {
                  if(filterStatus === "paid" && p < req) return false;
                  if(filterStatus === "partial" && (p === 0 || p >= req)) return false;
                  if(filterStatus === "unpaid" && p > 0) return false;
              }
          }
          const isPresent = (s.attendanceDates || []).includes(today);
          if(filterAttend === "present" && !isPresent) return false;
          if(filterAttend === "absent" && isPresent) return false;
          return true;
      });

      // Filter by Live Search Inp
      const q = $("tableSearchInp") ? $("tableSearchInp").value.toLowerCase() : "";
      if(q) {
          currentFilteredList = currentFilteredList.filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q));
      }

      currentPage = 1; renderPage();
  };

  const renderPage = () => {
      const table = $("allStudentsTable"); if(!table) return;
      const tb = table.querySelector("tbody"); tb.innerHTML="";
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageItems = currentFilteredList.slice(start, end);
      const today = nowDateStr();

      pageItems.forEach(s => {
          const tr = document.createElement("tr");
          let pBar = `<div style="width:100%; background:#eee; height:6px; border-radius:3px; margin-top:5px;"><div style="width:${termFee>0?Math.min((s.paid/termFee)*100,100):0}%; background:var(--success); height:100%; border-radius:3px;"></div></div>`;
          const attendTxt = (s.attendanceDates||[]).includes(today) ? "✅" : "➖";

          tr.innerHTML = `<td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td>
                          <td>${s.id}</td>
                          <td><b>${s.name}</b></td>
                          <td><span class="feed-tag">${s.className}</span></td>
                          <td>${s.paid} ج ${pBar}</td>
                          <td>${attendTxt}</td>`;
          tr.addEventListener("click", (e) => {
              if(e.target.type !== "checkbox") { window.switchTab('Home'); window.extOpen(s.id); }
          });
          tb.appendChild(tr);
      });

      if($("pageIndicator")) $("pageIndicator").textContent = `صفحة ${currentPage} / ${Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1}`;
      if($("prevPageBtn")) $("prevPageBtn").disabled = currentPage === 1;
      if($("nextPageBtn")) $("nextPageBtn").disabled = end >= currentFilteredList.length;
  };

  const handleBulk = () => {
      const boxes = document.querySelectorAll(".stCheckbox:checked");
      const count = boxes.length;
      if($("selectedCount")) $("selectedCount").textContent = count;
      if($("bulkActionBar")) {
          if(count > 0) $("bulkActionBar").classList.remove("hidden");
          else $("bulkActionBar").classList.add("hidden");
      }
  };

  // ====== 7. Settings & Backup ======
  const checkBackupStatus = () => {
      const last = localStorage.getItem(K_LAST_BACKUP);
      const now = Date.now();
      const dot = $("backupDot");
      if(dot) {
          if(!last || (now - parseInt(last) > 24 * 60 * 60 * 1000)) dot.classList.remove("hidden"); 
          else dot.classList.add("hidden");
      }
  };

  const markBackupDone = () => { localStorage.setItem(K_LAST_BACKUP, Date.now()); checkBackupStatus(); };

  // ====== 8. Listeners (Bindings) ======
  on("loginBtn", "click", doLogin);
  on("logoutBtn", "click", doLogout);
  on("togglePass", "click", () => { const p=$("pass"); p.type = p.type==="password"?"text":"password"; });

  // Tab Navigation Listeners
  on("btnTabHome", "click", () => window.switchTab('Home'));
  on("btnTabStudents", "click", () => { window.switchTab('Students'); renderList(); });
  on("btnTabAdmin", "click", () => window.switchTab('Admin'));

  on("langToggleBtn", "click", () => applyLanguage(currentLang==="ar"?"en":"ar"));
  on("themeSelector", "change", (e) => applyTheme(e.target.value));
  
  on("saveFeeBtn", "click", () => {
      const pass = prompt("Enter Admin Password:");
      if(pass === ADMIN_PASS) {
          termFee = toInt($("termFeeInp").value) || 0; saveAll(); showToast("Fee Saved ✅"); updateStudentUI(currentId);
      } else showToast("Wrong Password ❌", "err");
  });

  on("bgInput", "change", (e) => {
      const file = e.target.files[0];
      if(file) {
          if(file.size > MAX_IMG_SIZE) return showToast("⚠️ الصورة كبيرة جداً (أكبر من 3 ميجا)!", "err");
          const reader = new FileReader();
          reader.onload = function(evt) {
              const res = evt.target.result; localStorage.setItem(K_BG_IMAGE, res); document.body.style.backgroundImage = `url('${res}')`;
          };
          reader.readAsDataURL(file);
      }
  });
  on("clearBgBtn", "click", () => { localStorage.removeItem(K_BG_IMAGE); document.body.style.backgroundImage = "none"; });
  on("privacyBtn", "click", () => { $("todayRevenue").classList.toggle("blurred"); $("stTotalPaid").classList.toggle("blurred"); });

  // List & Pagination
  if($("filterClass")) $("filterClass").addEventListener("change", renderList);
  if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);
  if($("filterAttend")) $("filterAttend").addEventListener("change", renderList);
  if($("tableSearchInp")) $("tableSearchInp").addEventListener("input", renderList);

  on("prevPageBtn", "click", () => { if(currentPage>1) { currentPage--; renderPage(); }});
  on("nextPageBtn", "click", () => { currentPage++; renderPage(); });

  document.addEventListener("change", (e) => {
      if(e.target.classList.contains("stCheckbox")) handleBulk();
      if(e.target.id === "selectAllCheckbox") {
          const all = document.querySelectorAll(".stCheckbox");
          all.forEach(c => c.checked = e.target.checked);
          handleBulk();
      }
  });

  on("bulkAttendBtn", "click", () => {
      const boxes = document.querySelectorAll(".stCheckbox:checked"); let count = 0;
      boxes.forEach(b => { const res = addAttendance(b.dataset.id, nowDateStr()); if(res.ok) count++; });
      showToast(`تم تسجيل حضور ${count} طالب بنجاح ✅`); renderList(); handleBulk();
  });
  
  on("bulkAbsentBtn", "click", () => {
      const boxes = document.querySelectorAll(".stCheckbox:checked");
      boxes.forEach(b => removeAttendance(b.dataset.id, nowDateStr()));
      showToast("تم تسجيل الغياب ✅"); renderList();
  });

  // Search & Open
  on("openBtn", "click", () => window.extOpen(toInt($("openId").value)));
  on("searchAny", "input", (e) => {
      const q = e.target.value.toLowerCase(); const res = $("searchMsg");
      if(!q) { if(res) res.style.display="none"; return; }
      const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && String(s.phone).includes(q))).slice(0,5);
      if(res) {
          res.style.display = "block";
          res.innerHTML = found.map(s => {
              const phoneDisplay = s.phone ? `<span style="font-size:0.85em; color:#2ea44f; margin-right:5px;">📞 ${s.phone}</span>` : "";
              return `<div class="item" onclick="window.extOpen(${s.id})"><div style="font-weight:bold;">${s.name} (${s.id})</div>${phoneDisplay}</div>`;
          }).join("");
      }
  });

  on("quickAttendBtn", "click", () => {
      const id = toInt($("quickAttendId").value); const res = addAttendance(id, nowDateStr());
      showToast(res.msg, res.ok?"success":"warning");
      updateStudentUI(id); renderReport(nowDateStr());
      $("quickAttendId").value = ""; $("quickAttendId").focus();
  });

  on("addNewBtn", "click", () => {
      const id = toInt($("newId").value);
      if(!id || existsId(id)) { showToast("الكود مسجل مسبقاً", "err"); return; }
      students[String(id)] = makeEmptyStudent(id);
      if(id<BASE_MIN_ID || id>BASE_MAX_ID) extraIds.push(id);
      saveAll(); window.extOpen(id); showToast("تمت الإضافة بنجاح");
  });

  on("saveStudentBtn", "click", () => {
      if(!currentId) return; const s = students[currentId];
      s.name = $("stName").value; s.className = $("stClass").value; s.phone = $("stPhone").value; s.notes = $("stNotes").value;
      saveAll(); playSound("success"); showToast("تم الحفظ ✅"); updateTopStats();
  });

  on("addNoteBtn", "click", () => {
      if(!currentId) return; const txt = $("newNoteInp").value.trim(); if(!txt) return;
      const now = new Date(); const stamp = `[${now.toISOString().split('T')[0]}]`;
      const oldNotes = students[currentId].notes || "";
      students[currentId].notes = `${stamp} : ${txt}\n${oldNotes}`;
      saveAll(); updateStudentUI(currentId);
  });

  on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
  on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});

  on("addPaymentBtn", "click", () => {
      if(!currentId) return; const v = parseInt($("newPaymentInput").value); if(!v) return;
      const st = students[currentId]; st.paid = (st.paid||0) + v;
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + v;
      saveAll(); playSound("money"); 
      
      if(termFee > 0 && st.paid >= termFee) fireConfetti(); 
      else showToast(`تم الإيداع: ${v} ج 💰`);

      updateStudentUI(currentId); renderReport(nowDateStr());

      if(st.phone) {
          const msg = currentLang === "ar" ? `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} جنيه في حسابك بنجاح ✅\nإجمالي المدفوع حتى الآن: ${st.paid} جنيه.\n\n-- إدارة السنتر --` : `Hello ${st.name},\nA deposit of ${v} EGP has been added to your account ✅\nTotal paid: ${st.paid} EGP.\n\n-- Center Admin --`;
          window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
  });

  on("correctPayBtn", "click", () => {
      if(!currentId) return; const v = parseInt(prompt("Correction Amount (Deduct):")); if(!v) return;
      students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
      revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
      saveAll(); showToast("Correction Done ✅"); updateStudentUI(currentId); renderReport(nowDateStr());
  });

  // NEW: Undo Delete
  on("deleteStudentBtn", "click", () => { 
      if(!currentId) return;
      const targetId = currentId; const st = students[targetId];
      const backupSt = JSON.parse(JSON.stringify(st));
      let deducted = 0;
      
      if(st.paid > 0 && confirm(`خصم المدفوعات (${st.paid} ج) من إيراد اليوم؟`)) deducted = st.paid;
      
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) - deducted;
      deletedStudents[targetId] = backupSt;
      students[targetId] = makeEmptyStudent(targetId);
      if(targetId > BASE_MAX_ID) { delete students[targetId]; extraIds = extraIds.filter(x => x !== targetId); }
      
      saveAll(); updateStudentUI(null); renderReport(nowDateStr());
      window.switchTab('Home');
      
      showUndoToast(`تم حذف الطالب #${targetId}`, () => {
          students[targetId] = backupSt;
          delete deletedStudents[targetId];
          revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + deducted;
          saveAll(); window.extOpen(targetId); renderReport(nowDateStr());
          showToast("تم التراجع ورجوع الطالب بنجاح ✅");
      });
  });

  on("waBtn", "click", () => { const ph = $("stPhone").value; if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); else showToast("No Phone Number!", "err"); });

  on("copyReportBtn", "click", () => {
      const today = $("reportDate").value || nowDateStr();
      const ids = attByDate[today] || [];
      const rev = revenueByDate[today] || 0;
      
      let txt = `📊 *تقرير السنتر: ${prettyDate(today)}*\n\n`;
      let groups = {};
      ids.forEach(id => { let c = (students[id] && students[id].className) ? students[id].className.trim() : "غير محدد"; if(!groups[c]) groups[c] = 0; groups[c]++; });
      
      for(let g in groups) { txt += `📘 ${g}: ${groups[g]} طالب\n`; }
      txt += `\n👥 إجمالي الحضور: ${ids.length}\n💰 إجمالي الإيراد: ${rev} ج\n\n-- Center V-PRO --`;
      
      navigator.clipboard.writeText(txt).then(() => showToast("تم النسخ للواتساب 📋"));
  });

  on("exportExcelBtn", "click", () => {
      if (typeof XLSX === "undefined") return showToast("Excel Lib Missing", "err");
      const filled = Object.values(students).filter(st => st.name || st.paid>0).sort((a,b)=>a.id-b.id);
      const wsData = [["كود", "الاسم", "المجموعة", "رقم الموبايل", "المدفوع", "ملاحظات", "سجل الحضور"]];
      filled.forEach(st => { wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes, (st.attendanceDates||[]).join(", ")]); });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "الطلاب");
      XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
      markBackupDone(); playSound("success"); showToast("تم التصدير بنجاح 📊");
  });

  on("importExcelInput", "change", async () => {
      const f = $("importExcelInput").files[0]; if(!f) return;
      const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
      if(!confirm("Overwrite Data?")) return;
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      students = {}; attByDate = {}; revenueByDate = {}; extraIds = [];
      for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) students[String(i)] = makeEmptyStudent(i);
      
      rows.forEach(row => {
          const id = parseInt(row["كود"] || row["ID"]);
          if(id) {
              let st = makeEmptyStudent(id);
              st.name = row["الاسم"] || row["Name"] || "";
              st.className = row["المجموعة"] || row["Class"] || "";
              st.phone = row["رقم الموبايل"] || row["Phone"] || "";
              st.paid = parseInt(row["المدفوع"] || row["Paid"] || 0);
              st.notes = row["ملاحظات"] || row["Notes"] || "";
              let histStr = row["سجل الحضور"] || row["History"] || Object.values(row)[6] || "";
              if(histStr && typeof histStr==='string') {
                  const dates = histStr.split(",").map(s => s.trim()).filter(s => s);
                  st.attendanceDates = dates;
                  dates.forEach(d => { if(!attByDate[d]) attByDate[d] = []; if(!attByDate[d].includes(id)) attByDate[d].push(id); });
              }
              students[String(id)] = st; if(id > BASE_MAX_ID) extraIds.push(id);
          }
      });
      saveAll(); showToast("Import Done ✅"); setTimeout(() => location.reload(), 1000);
  });

  window.extOpen = (id) => { 
      $("searchAny").value = ""; if($("searchMsg")) $("searchMsg").style.display="none"; 
      updateStudentUI(id); 
      const card = document.querySelector(".studentCard");
      if(card) card.scrollIntoView({behavior:"smooth", block:"start"}); 
  };
  
  window.restoreSt = (id) => {
      if(students[id] && (students[id].name || students[id].paid>0)) { if(!confirm("Occupied. Overwrite?")) return; }
      const st = deletedStudents[id];
      if(st.paid > 0 && confirm(`Restore ${st.paid} to revenue?`)) { revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + st.paid; }
      students[id] = st; delete deletedStudents[id];
      saveAll(); renderBinList(); updateTopStats();
      showToast("Restored ✅"); window.switchTab('Home'); window.extOpen(id);
  };

  // NEW: Grouped Daily Report Function
  const renderReport = (d) => {
      const list = $("reportList"); if(!list) return;
      const ids = attByDate[d] || [];
      if($("reportDateLabel")) $("reportDateLabel").textContent = prettyDate(d);
      if($("reportCount")) $("reportCount").textContent = ids.length;
      if($("reportMoney")) $("reportMoney").textContent = (revenueByDate[d]||0) + " ج";
      
      if(!ids.length) { list.innerHTML = "<div class='mutedCenter'>لا يوجد حضور مسجل</div>"; return; }
      
      let groups = {};
      ids.forEach(id => {
          let c = (students[id] && students[id].className) ? students[id].className.trim() : "";
          if(!c) c = "غير محدد";
          if(!groups[c]) groups[c] = [];
          groups[c].push(id);
      });

      let html = "";
      for(let g in groups) {
          html += `<div style="background:rgba(47, 107, 255, 0.05); padding:10px; margin-top:10px; border-radius:8px; border:1px solid var(--border-color);">
                      <b style="color:var(--primary); font-size:1.1em;">📘 ${g}</b> 
                      <span class="badge" style="float:left;">${groups[g].length} طالب</span>
                      <div style="margin-top:8px; font-size:0.85em; color:var(--text-muted); line-height:1.6;">
                          ${groups[g].map(id => `<span class="feed-id clickable" onclick="window.switchTab('Home'); window.extOpen(${id})">${id}</span>`).join(" ")}
                      </div>
                   </div>`;
      }
      list.innerHTML = html;
  };

  on("reportBtn", "click", () => renderReport($("reportDate").value));

  // Bin & Danger Zone Logic (Restored completely)
  on("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
  on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
  on("emptyBinBtn", "click", () => { if(confirm("Permanent Delete?")) { deletedStudents={}; saveAll(); renderBinList(); }});

  const renderBinList = () => {
      const bl = $("binList"); if(!bl) return;
      const ids = Object.keys(deletedStudents);
      if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter">Empty</div>`; return; }
      bl.innerHTML = ids.map(id => {
          const s = deletedStudents[id];
          return `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${s.id})">Restore</button></div>`;
      }).join("");
  };

  on("resetTermBtn", "click", () => { 
      if(prompt("Enter Admin Password:") === ADMIN_PASS && confirm("Reset Term (Paid & Attendance)?")) { 
          for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; } 
          attByDate={}; revenueByDate={}; saveAll(); alert("Term Reset Done ✅"); location.reload(); 
      }
  });
  
  on("resetBtn", "click", () => { 
      if(prompt("Enter Admin Password:") === ADMIN_PASS && confirm("WIPE EVERYTHING?")) { 
          localStorage.clear(); location.reload(); 
      }
  });

  const existsId = (id) => !!students[String(id)];
  
  const checkQR = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrId = toInt(urlParams.get("id"));
    if (qrId && existsId(qrId)) {
        addAttendance(qrId, nowDateStr());
        window.extOpen(qrId);
        window.history.replaceState(null, null, window.location.pathname);
    }
  };

  // Init
  loadAll(); ensureBase500(); checkAuth();
});
