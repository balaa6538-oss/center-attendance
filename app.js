/* =============================================
   Center System V25 (Hoisting Fix & Wallpaper Patch)
   - Reordered functions to prevent "undefined" errors.
   - Added Wallpaper size check (max 3MB).
   - Fixed Search & Add button bindings.
   - Enabled Money Sound on interaction.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  console.log("System V25 Loaded...");

  // ====== 1. Constants & Config ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const ASST_USER  = "User";
  const ASST_PASS  = "11112222"; 

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
  let currentUserRole = "admin";
  let currentPage = 1; let currentFilteredList = []; 

  // Helpers
  const $ = (id) => document.getElementById(id);
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

  // Sound Engine
  const playSound = (type) => {
      try {
          const ctx = new (window.AudioContext||window.webkitAudioContext)();
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          
          if(type==="money") { // Coin Sound
              osc.type = "sine";
              osc.frequency.setValueAtTime(1600, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
              osc.start(); osc.stop(ctx.currentTime + 0.3);
          } else if(type==="success") { // Ding
              osc.frequency.setValueAtTime(600, ctx.currentTime);
              gain.gain.setValueAtTime(0.05, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc.start(); osc.stop(ctx.currentTime + 0.2);
          } else { // Error
              osc.type = "sawtooth"; osc.frequency.setValueAtTime(100, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start(); osc.stop(ctx.currentTime + 0.2);
          }
      } catch(e) {}
  };

  const makeEmptyStudent = (id) => ({ id: id, name: "", className: "", phone: "", paid: 0, notes: "", joinedDate: nowDateStr(), attendanceDates: [] });

  // ====== 2. FUNCTIONS (HOISTED) ======
  
  // Data
  const saveAll = () => {
    localStorage.setItem(K_STUDENTS, JSON.stringify(students));
    localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    localStorage.setItem(K_TERM_FEE, String(termFee));
    localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
    updateTopStats();
  };

  const updateTopStats = () => {
      const elCount = $("totalStudentsCount");
      const elToday = $("todayCountTop");
      const elRev = $("todayRevenue");
      if(elCount) elCount.textContent = Object.values(students).filter(s => s.name || s.paid>0).length;
      if(elToday) elToday.textContent = (attByDate[nowDateStr()] || []).length;
      if(elRev) elRev.textContent = (revenueByDate[nowDateStr()] || 0) + " ج";
  };

  // Student UI
  const updateStudentUI = (id) => {
    currentId = id; const st = students[id]; if (!st) return;
    $("studentIdPill").textContent = `ID: ${id}`;
    $("stName").value = st.name || ""; $("stClass").value = st.className || "";
    $("stPhone").value = st.phone || ""; $("stNotes").value = st.notes || ""; 
    $("stTotalPaid").value = (st.paid||0) + " ";
    
    // Border Color Logic
    const card = document.querySelector(".studentCard");
    card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
    if(termFee > 0) {
        if((st.paid||0) >= termFee) card.classList.add("status-border-green");
        else if((st.paid||0) > 0) card.classList.add("status-border-yellow");
        else card.classList.add("status-border-red");
    }

    // Avatar Logic
    const isPresent = (st.attendanceDates||[]).includes(nowDateStr());
    const avatar = $("stAvatar");
    if(isPresent) { avatar.classList.add("present"); $("todayStatus").textContent="✅ حاضر"; $("todayStatus").style.color="green"; }
    else { avatar.classList.remove("present"); $("todayStatus").textContent="✖ غياب"; $("todayStatus").style.color="red"; }
    
    $("daysCount").textContent = (st.attendanceDates||[]).length;
    $("attList").innerHTML = (st.attendanceDates||[]).slice().reverse().slice(0,20).map(d=>`<div>${prettyDate(d)}</div>`).join("");
  };

  const addAttendance = (id, dateStr) => {
      const st = students[id]; if(!st) return {ok:false};
      if(!st.attendanceDates.includes(dateStr)) {
          st.attendanceDates.push(dateStr);
          if(!attByDate[dateStr]) attByDate[dateStr] = [];
          if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
          saveAll(); playSound("success"); return {ok:true};
      }
      playSound("error"); return {ok:false};
  };

  // Reporting
  const renderReport = (d) => {
      const list = $("reportList"); if(!list) return;
      const ids = attByDate[d] || [];
      $("reportDateLabel").textContent = prettyDate(d);
      $("reportCount").textContent = ids.length;
      $("reportMoney").textContent = (revenueByDate[d]||0) + " ج";
      if(!ids.length) list.innerHTML = "<div class='mutedCenter'>—</div>";
      else list.innerHTML = ids.map(id => `<div class="item" onclick="window.extOpen(${id})">(${id}) ${students[id]?students[id].name:"?"}</div>`).join("");
  };

  // Bin
  const renderBinList = () => {
      const bl = $("binList"); if(!bl) return;
      const ids = Object.keys(deletedStudents);
      if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter">Empty</div>`; return; }
      bl.innerHTML = ids.map(id => {
          const s = deletedStudents[id];
          return `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${s.id})">Restore</button></div>`;
      }).join("");
  };

  // Wallpaper
  const setWallpaper = (dataUrl) => {
      if(dataUrl) {
          document.body.style.backgroundImage = `url('${dataUrl}')`;
          localStorage.setItem(K_BG_IMAGE, dataUrl);
      } else {
          document.body.style.backgroundImage = "none";
          localStorage.removeItem(K_BG_IMAGE);
      }
  };

  // Load Logic
  const loadAll = () => {
    try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}"); } catch { students = {}; }
    try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}"); } catch { deletedStudents = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}"); } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]"); } catch { extraIds = []; }
    try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}"); } catch { attByDate = {}; }
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    
    if(!attByDate) attByDate={}; if(!revenueByDate) revenueByDate={};

    const savedTheme = localStorage.getItem(K_THEME) || "classic";
    if(savedTheme === "dark") document.body.classList.add("theme-dark");
    if(savedTheme === "glass") document.body.classList.add("theme-glass");
    if($("themeSelector")) $("themeSelector").value = savedTheme;

    const savedBg = localStorage.getItem(K_BG_IMAGE);
    if(savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;

    if($("termFeeInp")) $("termFeeInp").value = termFee > 0 ? termFee : "";
    updateTopStats();
  };

  // ====== 3. BINDINGS (The Fix) ======
  const on = (id, event, handler) => { const el = $(id); if(el) el.addEventListener(event, handler); };

  // Auth
  on("loginBtn", "click", () => {
      const u=$("user").value.trim(), p=$("pass").value.trim();
      if(u===ADMIN_USER && p===ADMIN_PASS) { localStorage.setItem(K_AUTH,"1"); localStorage.setItem(K_ROLE,"admin"); location.reload(); }
      else if(u.toLowerCase()===ASST_USER.toLowerCase() && p===ASST_PASS) { localStorage.setItem(K_AUTH,"1"); localStorage.setItem(K_ROLE,"asst"); location.reload(); }
      else alert("Error");
  });
  on("logoutBtn", "click", () => { localStorage.removeItem(K_AUTH); location.reload(); });
  on("togglePass", "click", () => { const p=$("pass"); p.type=p.type==="password"?"text":"password"; });

  // Settings
  on("settingsBtn", "click", () => $("settingsModal").classList.remove("hidden"));
  on("closeSettingsBtn", "click", () => $("settingsModal").classList.add("hidden"));
  on("themeSelector", "change", (e) => {
      document.body.className = "";
      if(e.target.value!=="classic") document.body.classList.add("theme-"+e.target.value);
      localStorage.setItem(K_THEME, e.target.value);
  });

  // WALLPAPER FIX (Size Check)
  on("bgInput", "change", (e) => {
      const file = e.target.files[0];
      if(!file) return;
      if(file.size > MAX_IMG_SIZE) { alert("⚠️ الصورة كبيرة جداً (أكبر من 3 ميجا).\nاختر صورة أصغر."); return; }
      const reader = new FileReader();
      reader.onload = (evt) => setWallpaper(evt.target.result);
      reader.readAsDataURL(file);
  });
  on("clearBgBtn", "click", () => setWallpaper(null));

  // Term Fee & Danger Zone
  on("saveFeeBtn", "click", () => {
      if(prompt("Enter Admin Password:") === ADMIN_PASS) {
          termFee = toInt($("termFeeInp").value) || 0; saveAll(); alert("Saved ✅"); updateStudentUI(currentId);
      } else alert("Wrong Password ❌");
  });
  on("resetTermBtn", "click", () => {
      if(prompt("Enter Admin Password:") === ADMIN_PASS && confirm("Reset Term?")) {
          for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; }
          attByDate={}; revenueByDate={}; saveAll(); alert("Reset Done"); location.reload();
      }
  });
  on("resetBtn", "click", () => {
      if(prompt("Enter Admin Password:") === ADMIN_PASS && confirm("WIPE ALL DATA?")) {
          localStorage.clear(); location.reload();
      }
  });

  // Search & Add
  on("openBtn", "click", () => { const id=toInt($("openId").value); if(students[id]) window.extOpen(id); else alert("Not Found"); });
  on("searchAny", "input", (e) => {
      const q = e.target.value.toLowerCase(); const res = $("searchMsg");
      if(!q) { res.style.display="none"; return; }
      const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && String(s.phone).includes(q))).slice(0,5);
      res.style.display="block";
      res.innerHTML = found.map(s => `<div class="item" onclick="window.extOpen(${s.id})"><b>${s.name}</b> (${s.id}) ${s.phone?`📞 ${s.phone}`:""}</div>`).join("");
  });

  on("addNewBtn", "click", () => {
      const id=toInt($("newId").value);
      if(!id || students[id]) { alert("Invalid or Exists"); return; }
      students[id] = makeEmptyStudent(id); if(id>BASE_MAX_ID) extraIds.push(id);
      saveAll(); window.extOpen(id); alert("Added ✅");
  });

  // Student Actions
  on("saveStudentBtn", "click", () => {
      if(!currentId) return;
      const s = students[currentId];
      s.name=$("stName").value; s.className=$("stClass").value; s.phone=$("stPhone").value;
      saveAll(); alert("Saved ✅"); updateTopStats();
  });
  
  on("addPaymentBtn", "click", () => {
      if(!currentId) return; const v=parseInt($("newPaymentInput").value); if(!v) return;
      students[currentId].paid = (students[currentId].paid||0)+v;
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0)+v;
      saveAll(); playSound("money"); alert("Deposit Done 💰"); updateStudentUI(currentId);
  });

  on("correctPayBtn", "click", () => {
      if(!currentId) return; const v=parseInt(prompt("Deduct Amount:")); if(!v) return;
      students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
      revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
      saveAll(); alert("Corrected"); updateStudentUI(currentId);
  });

  on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
  on("unmarkTodayBtn", "click", () => { 
      if(currentId) { 
          const s = students[currentId]; s.attendanceDates = s.attendanceDates.filter(d=>d!==nowDateStr());
          if(attByDate[nowDateStr()]) attByDate[nowDateStr()] = attByDate[nowDateStr()].filter(x=>x!==currentId);
          saveAll(); updateStudentUI(currentId); renderReport(nowDateStr());
      }
  });

  on("deleteStudentBtn", "click", () => {
      if(currentId && confirm("Delete?")) {
          deletedStudents[currentId] = JSON.parse(JSON.stringify(students[currentId]));
          students[currentId] = makeEmptyStudent(currentId);
          if(currentId > BASE_MAX_ID) { delete students[currentId]; extraIds = extraIds.filter(x=>x!==currentId); }
          saveAll(); alert("Moved to Bin"); updateStudentUI(null); renderReport(nowDateStr());
      }
  });

  on("waBtn", "click", () => {
      const ph = $("stPhone").value; if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); else alert("No Phone");
  });

  // Bin
  on("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
  on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
  window.restoreSt = (id) => {
      const st = deletedStudents[id];
      if(students[id] && (students[id].name || students[id].paid>0) && !confirm("Overwrite?")) return;
      students[id] = st; delete deletedStudents[id];
      saveAll(); renderBinList(); alert("Restored"); window.extOpen(id);
  };

  // Report & Report Button (Fixed Binding)
  on("reportBtn", "click", () => renderReport($("reportDate").value));
  on("copyReportBtn", "click", () => {
      const d = $("reportDate").value || nowDateStr();
      const txt = `📊 Report ${d}\n✅ Count: ${$("reportCount").textContent}\n💰 Rev: ${$("reportMoney").textContent}`;
      navigator.clipboard.writeText(txt).then(() => alert("Copied 📋"));
  });

  // Global Access
  window.extOpen = (id) => { updateStudentUI(id); document.querySelector(".studentCard").scrollIntoView({behavior:"smooth"}); };

  // Init
  loadAll(); ensureBase500();
  
  // Auth Check
  if(localStorage.getItem(K_AUTH)!=="1") $("loginBox").classList.remove("hidden");
  else {
      $("appBox").classList.remove("hidden");
      currentUserRole = localStorage.getItem(K_ROLE);
      if(currentUserRole!=="admin") document.querySelectorAll(".adminOnly").forEach(el=>el.classList.add("hidden"));
  }
});
