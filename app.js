/* =============================================
   Center System V24 (The Fix & Feature Update)
   - Fixed: Search, Add, WhatsApp, Report Copy
   - New: Money Sound Effect, Danger Zone in Settings
   - Improved: Wallpaper Save, Term Fee Security
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  console.log("System V24 Loaded...");

  // ====== 1. Configuration & Auth ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; // Full Access
  const ASST_USER  = "User";
  const ASST_PASS  = "11112222"; // Restricted Access

  let currentUserRole = "admin"; // 'admin' or 'assistant'

  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;
  const ITEMS_PER_PAGE = 50;

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

  // Sound Effects (Money & Success)
  const playSound = (type) => {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      if(type==="money") { // Cha-Ching! 💰
          osc.type = "sine";
          osc.frequency.setValueAtTime(1200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start(); osc.stop(ctx.currentTime + 0.4);
          
          // Echo effect
          setTimeout(() => {
              const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
              osc2.connect(gain2); gain2.connect(ctx.destination);
              osc2.frequency.setValueAtTime(2000, ctx.currentTime);
              gain2.gain.setValueAtTime(0.05, ctx.currentTime);
              gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc2.start(); osc2.stop(ctx.currentTime + 0.2);
          }, 100);

      } else if(type==="success") {
          osc.frequency.setValueAtTime(587, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); // D6
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else { // Error
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
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
      if(isAuth === "1") {
          currentUserRole = localStorage.getItem(K_ROLE) || "admin";
          showApp();
      } else {
          showLogin();
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
      const u = $("user").value.trim();
      const p = $("pass").value.trim();
      
      if(u === ADMIN_USER && p === ADMIN_PASS) {
          localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); currentUserRole = "admin"; showApp();
      } else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) {
          localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "assistant"); currentUserRole = "assistant"; showApp();
      } else {
          showMsg("loginMsg", "Error: Wrong Credentials", "err"); playSound("error");
      }
  };

  const doLogout = () => { localStorage.removeItem(K_AUTH); localStorage.removeItem(K_ROLE); location.reload(); };

  // ====== 4. Main UI Logic ======
  const showApp = () => {
      $("loginBox").classList.add("hidden");
      $("appBox").classList.remove("hidden");
      applyPermissions();
      $("reportDate").value = nowDateStr();
      renderReport(nowDateStr());
      updateTopStats();
      setTimeout(checkQR, 500); 
  };

  const showLogin = () => { $("loginBox").classList.remove("hidden"); $("appBox").classList.add("hidden"); };

  const updateTopStats = () => {
      const animateValue = (id, end) => {
          const obj = $(id); if(!obj) return;
          if(end === 0) { obj.textContent = "0"; return; }
          let start = 0; const duration = 500;
          let startTimestamp = null;
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
    currentId = id;
    const st = students[id];
    const pills = {id:$("studentIdPill"), status:$("todayStatus"), last:$("lastAttend"), count:$("daysCount")};
    const inps = {name:$("stName"), cls:$("stClass"), ph:$("stPhone"), note:$("stNotes"), paid:$("stTotalPaid")};
    const avatar = $("stAvatar");
    const badge = $("newBadge");

    if (!st) return; 

    pills.id.textContent = `ID: ${id}`;
    inps.name.value = st.name || "";
    inps.cls.value = st.className || "";
    inps.ph.value = st.phone || "";
    inps.note.value = st.notes || ""; 
    inps.paid.value = (st.paid||0) + " ";
    if($("newNoteInp")) $("newNoteInp").value = "";
    if($("newPaymentInput")) $("newPaymentInput").value = "";

    const paid = st.paid || 0; const req = termFee;
    let statusClass = "";
    if(req > 0) {
        if(paid >= req) statusClass = "status-border-green";
        else if(paid > 0) statusClass = "status-border-yellow";
        else statusClass = "status-border-red";
    }
    const card = document.querySelector(".studentCard");
    card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
    if(statusClass) card.classList.add(statusClass);

    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    const isPresent = dates.includes(today);
    
    if(isPresent) {
        pills.status.textContent = currentLang==="ar"?"✅ حاضر":"✅ Present";
        pills.status.style.color = "green";
        avatar.classList.add("present"); 
    } else {
        pills.status.textContent = currentLang==="ar"?"✖ غياب":"✖ Absent";
        pills.status.style.color = "red";
        avatar.classList.remove("present"); 
    }

    pills.count.textContent = dates.length;
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
          saveAll(); playSound("success");
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
      const filterGroup = $("filterClass").value; 
      const filterStatus = $("filterStatus").value; 
      const filterAttend = $("filterAttend").value; 
      
      const sel = $("filterClass");
      if(sel.options.length <= 1) { 
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

      currentPage = 1;
      renderPage();
  };

  const renderPage = () => {
      const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageItems = currentFilteredList.slice(start, end);
      const today = nowDateStr();

      pageItems.forEach(s => {
          const tr = document.createElement("tr");
          let stIcon = "🔴";
          if(termFee > 0) {
              if(s.paid >= termFee) stIcon = "🟢"; 
              else if(s.paid > 0) stIcon = "🟡"; 
          }
          const attendTxt = (s.attendanceDates||[]).includes(today) ? "✅" : "➖";

          tr.innerHTML = `<td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.paid}</td><td>${stIcon}</td><td>${attendTxt}</td>`;
          tr.addEventListener("click", (e) => {
              if(e.target.type !== "checkbox") { $("allStudentsModal").classList.add("hidden"); window.extOpen(s.id); }
          });
          tb.appendChild(tr);
      });

      $("pageIndicator").textContent = `صفحة ${currentPage} / ${Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1}`;
      $("prevPageBtn").disabled = currentPage === 1;
      $("nextPageBtn").disabled = end >= currentFilteredList.length;
  };

  const handleBulk = () => {
      const boxes = document.querySelectorAll(".stCheckbox:checked");
      const count = boxes.length;
      $("selectedCount").textContent = count;
      if(count > 0) $("bulkActionBar").classList.remove("hidden");
      else $("bulkActionBar").classList.add("hidden");
  };

  // ====== 7. Settings & Backup ======
  const checkBackupStatus = () => {
      const last = localStorage.getItem(K_LAST_BACKUP);
      const now = Date.now();
      const dot = $("backupDot");
      if(!last || (now - parseInt(last) > 24 * 60 * 60 * 1000)) dot.classList.remove("hidden"); 
      else dot.classList.add("hidden");
  };

  const markBackupDone = () => {
      localStorage.setItem(K_LAST_BACKUP, Date.now());
      checkBackupStatus();
  };

  // ====== 8. Listeners ======
  on("loginBtn", "click", doLogin);
  on("logoutBtn", "click", doLogout);
  on("togglePass", "click", () => { const p=$("pass"); p.type = p.type==="password"?"text":"password"; });

  on("settingsBtn", "click", () => $("settingsModal").classList.remove("hidden"));
  on("closeSettingsBtn", "click", () => $("settingsModal").classList.add("hidden"));
  on("langToggleBtn", "click", () => applyLanguage(currentLang==="ar"?"en":"ar"));
  on("themeSelector", "change", (e) => applyTheme(e.target.value));
  
  // FIXED: Save Fee with Password
  on("saveFeeBtn", "click", () => {
      const pass = prompt("Enter Admin Password:");
      if(pass === ADMIN_PASS) {
          termFee = toInt($("termFeeInp").value) || 0;
          saveAll(); alert("Fee Saved ✅");
          updateStudentUI(currentId); // Refresh UI to show new border colors
      } else {
          alert("Wrong Password ❌");
      }
  });

  // FIXED: Wallpaper Immediate Save
  on("bgInput", "change", (e) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
              const res = evt.target.result;
              localStorage.setItem
