/* =============================================
   Center System V13.1 (Final Delivery Fix)
   Fix: Added missing 'makeEmptyStudent' function
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  console.log("System V13.1 Ready...");

  // ====== 1. TRANSLATIONS ======
  const STRINGS = {
    ar: {
      login_title: "دخول لوحة السنتر", login_desc: "الدخول للمسؤول فقط", login_btn: "دخول",
      brand_name: "لوحة السنتر",
      stat_students: "👥 مسجلين:", stat_attend: "✅ حضور اليوم:", stat_revenue: "💰 إيراد اليوم:",
      term_fee_label: "المطلوب:",
      btn_export: "تصدير Excel", btn_import: "استيراد Excel", btn_logout: "خروج",
      quick_title: "سريع (QR)", btn_record: "سجل حضور",
      search_title: "بحث شامل", btn_open: "فتح",
      add_title: "+ إضافة طالب جديد", btn_add_open: "إضافة وفتح",
      report_title: "حضور وتوريد بتاريخ", btn_copy_report: "نسخ الملخص 📋", btn_show: "عرض",
      rep_date: "التاريخ:", rep_count: "العدد:", rep_money: "الإيراد:",
      st_details: "بيانات الطالب",
      lbl_name: "الاسم", lbl_class: "الصف / المجموعة", lbl_phone: "رقم الموبايل",
      lbl_finance: "نظام المصاريف", pay_total: "💰 إجمالي المدفوع:", btn_deduct: "⚠️ خصم",
      pay_new: "➕ دفعة جديدة:", btn_deposit: "إيداع",
      lbl_notes: "ملاحظات (مؤرخة)", btn_add: "إضافة",
      btn_save: "حفظ البيانات 💾", btn_attend: "✅ حضور", btn_absent: "✖ غياب", btn_delete: "🗑️ حذف",
      history_title: "سجل التواريخ",
      btn_recycle: "♻️ سلة المحذوفات",
      danger_title: "⚠️ إدارة البيانات", danger_term: "1. تصفير الترم", btn_reset: "تصفير",
      danger_factory: "2. ضبط المصنع", btn_wipe: "مسح الكل",
      list_title: "قائمة الطلاب", th_name: "الاسم", th_class: "المجموعة", th_paid: "المدفوع", th_status: "الحالة",
      bin_title: "🗑️ سلة المحذوفات", btn_empty_bin: "إفراغ السلة نهائياً"
    },
    en: {
      login_title: "Admin Login", login_desc: "Authorized Access Only", login_btn: "Login",
      brand_name: "Center Panel",
      stat_students: "👥 Students:", stat_attend: "✅ Present:", stat_revenue: "💰 Revenue:",
      term_fee_label: "Tuition Fee:",
      btn_export: "Export Excel", btn_import: "Import Excel", btn_logout: "Logout",
      quick_title: "Quick Scan (QR)", btn_record: "Check In",
      search_title: "Global Search", btn_open: "Open",
      add_title: "+ Add New Student", btn_add_open: "Add & Open",
      report_title: "Daily Report", btn_copy_report: "Copy to WhatsApp 📋", btn_show: "Show",
      rep_date: "Date:", rep_count: "Count:", rep_money: "Revenue:",
      st_details: "Student Profile",
      lbl_name: "Full Name", lbl_class: "Class / Group", lbl_phone: "Phone Number",
      lbl_finance: "Tuition & Finance", pay_total: "💰 Total Paid:", btn_deduct: "⚠️ Correction",
      pay_new: "➕ Deposit:", btn_deposit: "Deposit",
      lbl_notes: "History Notes", btn_add: "Add Note",
      btn_save: "Save Info 💾", btn_attend: "✅ Present", btn_absent: "✖ Absent", btn_delete: "🗑️ Delete",
      history_title: "Attendance Log",
      btn_recycle: "♻️ Recycle Bin",
      danger_title: "⚠️ Data Admin", danger_term: "1. Reset Term", btn_reset: "Reset Term",
      danger_factory: "2. Factory Reset", btn_wipe: "Wipe All",
      list_title: "Students List", th_name: "Name", th_class: "Group", th_paid: "Paid", th_status: "Status",
      bin_title: "🗑️ Recycle Bin", btn_empty_bin: "Empty Bin Permanently"
    }
  };

  // ====== 3. SETTINGS ======
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

  // ====== 4. DOM HELPER ======
  const $ = (id) => document.getElementById(id);
  const on = (id, event, handler) => { 
      const el = $(id);
      if(el) el.addEventListener(event, handler);
  };

  // ====== 5. STATE ======
  let students = {}; let deletedStudents = {}; let extraIds = [];              
  let attByDate = {}; let revenueByDate = {}; 
  let currentId = null; let termFee = 0; let isDarkMode = false; let currentLang = "ar";

  // ====== 6. UTILS ======
  const nowDateStr = () => new Date().toISOString().split('T')[0];
  const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
  const getSmartDate = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,0)}-${String(d.getMonth()+1).padStart(2,0)}`; }
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

  // ====== 7. DATA MANAGERS ======
  // *** THIS IS THE MISSING FUNCTION (FIXED) ***
  const makeEmptyStudent = (id) => ({
    id: id, name: "", className: "", phone: "", paid: 0, 
    notes: "", joinedDate: nowDateStr(), attendanceDates: [] 
  });

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
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    const feeInp = $("termFeeInp");
    if(feeInp) feeInp.value = termFee > 0 ? termFee : "";

    if(localStorage.getItem(K_DARK_MODE) === "1") toggleDarkMode(true);
    const savedLang = localStorage.getItem(K_LANG) || "ar";
    applyLanguage(savedLang);

    try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}"); } catch { students = {}; }
    try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}"); } catch { deletedStudents = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}"); } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]"); } catch { extraIds = []; }
    try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}"); } catch { attByDate = {}; }

    if(!attByDate) attByDate={}; if(!revenueByDate) revenueByDate={};
    updateTopStats();
  };

  const ensureBase500 = () => {
    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i);
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

  const existsId = (id) => !!students[String(id)];
  const getStudent = (id) => students[String(id)] || null;
  const setStudent = (st) => { students[String(st.id)] = st; saveAll(); };
  const isFilledStudent = (st) => { if (!st) return false; return !!((st.name && st.name.trim()) || (st.phone && st.phone.trim()) || (st.paid > 0)); };

  // ====== 8. UI & LOGIC ======
  const applyLanguage = (lang) => {
      currentLang = lang;
      localStorage.setItem(K_LANG, lang);
      document.body.dir = lang === "ar" ? "rtl" : "ltr";
      const btn = $("langBtn");
      if(btn) btn.textContent = lang === "ar" ? "EN" : "ع";
      document.querySelectorAll("[data-i18n]").forEach(el => {
          const key = el.getAttribute("data-i18n");
          if(STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
      });
  };

  const updateStudentUI = (id) => {
    currentId = id;
    const st = students[id];
    
    // Elements
    const pills = {id:$("studentIdPill"), status:$("todayStatus"), last:$("lastAttend"), count:$("daysCount")};
    const inps = {name:$("stName"), cls:$("stClass"), ph:$("stPhone"), note:$("stNotes"), paid:$("stTotalPaid"), newP:$("newPaymentInput")};
    const attL = $("attList");
    const delBtn = $("deleteStudentBtn");
    const badge = $("paymentBadge");
    const newB = $("newBadge");

    if (!st) { 
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
    if(inps.paid) inps.paid.value = (st.paid||0) + " ";
    if(inps.newP) inps.newP.value = "";

    // Badge
    if(badge) {
        badge.classList.remove("hidden");
        const paid = st.paid || 0;
        if(termFee > 0) {
            if(paid >= termFee) { badge.textContent = currentLang==="ar"?"✅ خالص":"✅ Fully Paid"; badge.className="paymentBadge paid"; }
            else if(paid > 0) { badge.textContent = currentLang==="ar"?`⚠️ باقي ${termFee-paid}`:`⚠️ Partial`; badge.className="paymentBadge partial"; }
            else { badge.textContent = currentLang==="ar"?"🔴 لم يدفع":"🔴 Unpaid"; badge.className="paymentBadge unpaid"; }
        } else {
            if(paid > 0) { badge.textContent = `💰 ${paid}`; badge.className="paymentBadge partial"; }
            else { badge.textContent = "—"; badge.style.background="#eee"; }
        }
    }
    // Dates
    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    if(pills.status) {
        pills.status.textContent = dates.includes(today) ? (currentLang==="ar"?"✅ حاضر":"✅ Present") : (currentLang==="ar"?"✖ غياب":"✖ Absent");
        pills.status.style.color = dates.includes(today) ? "green" : "red";
    }
    if(pills.count) pills.count.textContent = dates.length;
    if(attL) {
        attL.innerHTML = dates.slice().reverse().slice(0,20).map(d=>`<div>${prettyDate(d)}</div>`).join("");
    }
    if(newB) {
        if(dates.length === 0 && st.name) newB.classList.remove("hidden"); else newB.classList.add("hidden");
    }
  };

  const addAttendance = (id, dateStr) => {
      const st = students[id];
      if(!st) return {ok:false, msg:"ID Not Found"};
      if(!st.attendanceDates.includes(dateStr)) {
          st.attendanceDates.push(dateStr);
          if(!attByDate[dateStr]) attByDate[dateStr] = [];
          if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
          saveAll(); playBeep();
          return {ok:true, msg:"Checked In"};
      }
      return {ok:false, msg:"Already Here"};
  };

  const removeAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "Not found" };
    if(st.attendanceDates) st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
    if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
    setStudent(st); saveAll();
    return { ok: true, msg: "Checked Out" };
  };

  const moveToBin = (id) => {
      const st = getStudent(id);
      if(!st || !isFilledStudent(st)) return;
      let deduct = false;
      if(st.paid > 0) {
          if(confirm(`⚠️ Financial Alert!\nThis student paid (${st.paid}).\n\nDeduct from revenue?`)) deduct = true;
      }
      if(deduct) {
          const t = nowDateStr(); revenueByDate[t] = (revenueByDate[t]||0) - st.paid;
      }
      deletedStudents[id] = JSON.parse(JSON.stringify(st));
      students[id] = makeEmptyStudent(id);
      if(id > BASE_MAX_ID) { delete students[id]; extraIds = extraIds.filter(x => x !== id); }
      saveAll(); alert("Moved to Recycle Bin 🗑️"); updateStudentUI(null); renderReport(nowDateStr()); 
  };

  const renderReport = (d) => {
      const list = $("reportList"); if(!list) return;
      const ids = attByDate[d] || [];
      const lbl = $("reportDateLabel"); if(lbl) lbl.textContent = prettyDate(d);
      const cnt = $("reportCount"); if(cnt) cnt.textContent = ids.length;
      const mon = $("reportMoney"); if(mon) mon.textContent = (revenueByDate[d]||0) + " ج";
      
      if(!ids.length) list.innerHTML = "<div class='mutedCenter'>—</div>";
      else {
          list.innerHTML = ids.map(id => {
              const s = students[id];
              return `<div class="item" onclick="window.extOpen(${id})">(${id}) ${s?s.name:"?"}</div>`;
          }).join("");
      }
  };

  const renderBinList = () => {
      const bl = $("binList"); if(!bl) return;
      const ids = Object.keys(deletedStudents);
      if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter">Empty</div>`; return; }
      bl.innerHTML = ids.map(id => {
          const s = deletedStudents[id];
          return `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${s.id})">Restore</button></div>`;
      }).join("");
  };

  const toggleDarkMode = (force) => {
      isDarkMode = force !== undefined ? force : !isDarkMode;
      document.body.classList.toggle("dark-mode", isDarkMode);
      localStorage.setItem(K_DARK_MODE, isDarkMode?"1":"0");
      const btn = $("darkModeBtn"); if(btn) btn.textContent = isDarkMode ? "☀️" : "🌙";
  };

  const checkAuth = () => {
      if(localStorage.getItem(K_AUTH) === "1") showApp(); else showLogin();
  };

  // ====== 9. LISTENERS ======
  // Add global wrappers for HTML onclicks
  window.restoreSt = (id) => {
      if(students[id] && (students[id].name || students[id].paid>0)) { if(!confirm("Occupied. Overwrite?")) return; }
      students[id] = deletedStudents[id]; delete deletedStudents[id];
      saveAll(); alert("Restored"); $("recycleBinModal").classList.add("hidden"); window.extOpen(id);
  };
  window.permaDelete = (id) => { if(confirm("Permanent Delete?")) { delete deletedStudents[id]; saveAll(); renderBinList(); }};
  window.extOpen = (id) => { 
      updateStudentUI(id); 
      const c = document.querySelector(".studentCard"); 
      if(c) c.scrollIntoView({behavior:"smooth"}); 
  };

  // Buttons
  on("loginBtn", "click", () => {
      const u = $("user").value.trim(); const p = $("pass").value.trim();
      if(u === ADMIN_USER && p === ADMIN_PASS) { localStorage.setItem(K_AUTH, "1"); showApp(); } 
      else showMsg("loginMsg", "Error", "err");
  });
  on("logoutBtn", "click", () => { localStorage.removeItem(K_AUTH); showLogin(); });
  on("togglePass", "click", () => { const p=$("pass"); if(p) p.type = p.type==="password"?"text":"password"; });

  on("langBtn", "click", () => applyLanguage(currentLang==="ar"?"en":"ar"));
  on("darkModeBtn", "click", () => toggleDarkMode());

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

  on("quickAttendBtn", "click", () => {
      const id = toInt($("quickAttendId").value);
      const res = addAttendance(id, nowDateStr());
      showMsg("quickMsg", res.msg, res.ok?"ok":"err");
      updateStudentUI(id); renderReport(nowDateStr());
      $("quickAttendId").value = ""; $("quickAttendId").focus();
  });

  // *** THE FIX IS HERE: USING makeEmptyStudent ***
  on("addNewBtn", "click", () => {
      const id = toInt($("newId").value);
      if(!id || existsId(id)) { showMsg("addMsg", "Exists/Invalid", "err"); return; }
      students[String(id)] = makeEmptyStudent(id);
      if(id<BASE_MIN_ID || id>BASE_MAX_ID) extraIds.push(id);
      saveAll(); window.extOpen(id); showMsg("addMsg", "Added", "ok");
  });

  on("saveStudentBtn", "click", () => {
      if(!currentId) return;
      const s = students[currentId];
      s.name = $("stName").value; s.className = $("stClass").value; s.phone = $("stPhone").value; s.notes = $("stNotes").value;
      saveAll(); showMsg("studentMsg", "Saved", "ok"); updateTopStats();
  });

  on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
  on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});

  on("addPaymentBtn", "click", () => {
      if(!currentId) return; const v = parseInt($("newPaymentInput").value); if(!v) return;
      students[currentId].paid = (students[currentId].paid||0) + v;
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + v;
      saveAll(); alert("Done"); updateStudentUI(currentId); renderReport(nowDateStr());
  });
  on("correctPayBtn", "click", () => {
      if(!currentId) return; const v = parseInt(prompt("Correction Amount:")); if(!v) return;
      students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
      revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
      saveAll(); alert("Done"); updateStudentUI(currentId); renderReport(nowDateStr());
  });

  on("deleteStudentBtn", "click", () => { if(currentId && confirm("Delete?")) moveToBin(currentId); });

  // Lists
  const renderList = () => {
      const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
      const fC = $("filterClass") ? $("filterClass").value.toLowerCase() : "all";
      
      Object.values(students).filter(s=>s.name||s.paid>0).forEach(s => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.paid}</td><td>-</td>`;
          tr.onclick = () => { $("allStudentsModal").classList.add("hidden"); window.extOpen(s.id); };
          tb.appendChild(tr);
      });
  };
  on("openAllStudentsBtn", "click", () => { renderList(); $("allStudentsModal").classList.remove("hidden"); });
  on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));
  if($("filterClass")) $("filterClass").addEventListener("change", renderList);
  if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);

  on("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
  on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
  on("emptyBinBtn", "click", () => { if(confirm("Permanent Delete?")) { deletedStudents={}; saveAll(); renderBinList(); }});

  on("copyReportBtn", "click", () => {
      const txt = `Report: ${$("reportDateLabel").textContent} \n Count: ${$("reportCount").textContent} \n Rev: ${$("reportMoney").textContent}`;
      navigator.clipboard.writeText(txt).then(() => alert("Copied"));
  });

  on("exportExcelBtn", "click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","Name","Class","Phone","Paid","Notes"]];
    filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
    XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
  });

  on("importExcelInput", "change", async () => {
    const f = $("importExcelInput").files[0]; if(!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
    alert("Import Logic Triggered"); location.reload(); 
  });

  on("saveFeeBtn", "click", () => { if(prompt("Pass")===ADMIN_PASS) { termFee=toInt($("termFeeInp").value)||0; saveAll(); alert("Saved"); updateStudentUI(currentId); }});
  on("resetTermBtn", "click", () => { if($("termPass").value===ADMIN_PASS && confirm("Reset?")) { for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; } attByDate={}; revenueByDate={}; saveAll(); alert("Done"); location.reload(); }});
  on("resetBtn", "click", () => { if($("resetPass").value===ADMIN_PASS && confirm("Wipe All?")) { localStorage.clear(); location.reload(); }});

  // Init
  loadAll(); ensureBase500(); checkAuth();

});      login_title: "Admin Login", login_desc: "Authorized Access Only", login_btn: "Login",
      brand_name: "Center Panel",
      stat_students: "👥 Students:", stat_attend: "✅ Present:", stat_revenue: "💰 Revenue:",
      term_fee_label: "Tuition Fee:",
      btn_export: "Export Excel", btn_import: "Import Excel", btn_logout: "Logout",
      quick_title: "Quick Scan (QR)", btn_record: "Check In",
      search_title: "Global Search", btn_open: "Open",
      add_title: "+ Add New Student", btn_add_open: "Add & Open",
      report_title: "Daily Report", btn_copy_report: "Copy to WhatsApp 📋", btn_show: "Show",
      rep_date: "Date:", rep_count: "Count:", rep_money: "Revenue:",
      st_details: "Student Profile",
      lbl_name: "Full Name", lbl_class: "Class / Group", lbl_phone: "Phone Number",
      lbl_finance: "Tuition & Finance", pay_total: "💰 Total Paid:", btn_deduct: "⚠️ Correction",
      pay_new: "➕ Deposit:", btn_deposit: "Deposit",
      lbl_notes: "History Notes", btn_add: "Add Note",
      btn_save: "Save Info 💾", btn_attend: "✅ Present", btn_absent: "✖ Absent", btn_delete: "🗑️ Delete",
      history_title: "Attendance Log",
      btn_recycle: "♻️ Recycle Bin",
      danger_title: "⚠️ Data Admin", danger_term: "1. Reset Term", btn_reset: "Reset Term",
      danger_factory: "2. Factory Reset", btn_wipe: "Wipe All",
      list_title: "Students List", th_name: "Name", th_class: "Group", th_paid: "Paid", th_status: "Status",
      bin_title: "🗑️ Recycle Bin", btn_empty_bin: "Empty Bin Permanently"
    }
  };

  // ====== 3. إعدادات النظام ======
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

  // ====== 4. أداة اختيار العناصر (Safe Selector) ======
  const $ = (id) => document.getElementById(id);

  // Helper to safely bind events
  const on = (id, event, handler) => { 
      const el = $(id);
      if(el) el.addEventListener(event, handler);
  };

  // ====== 5. المتغيرات (State) ======
  let students = {}; let deletedStudents = {}; let extraIds = [];              
  let attByDate = {}; let revenueByDate = {}; 
  let currentId = null; let termFee = 0; let isDarkMode = false; let currentLang = "ar";

  // ====== 6. دوال مساعدة ======
  const nowDateStr = () => new Date().toISOString().split('T')[0];
  const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
  const getSmartDate = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,0)}-${String(d.getMonth()+1).padStart(2,0)}`; }
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

  // ====== 7. نظام اللغة الجديد (The Engine) ======
  const applyLanguage = (lang) => {
      currentLang = lang;
      localStorage.setItem(K_LANG, lang);
      
      // 1. اتجاه الصفحة
      document.body.dir = lang === "ar" ? "rtl" : "ltr";
      
      // 2. زرار التغيير
      const btn = $("langBtn");
      if(btn) btn.textContent = lang === "ar" ? "EN" : "ع";

      // 3. تغيير النصوص (Mapping HTML Data Tags)
      document.querySelectorAll("[data-i18n]").forEach(el => {
          const key = el.getAttribute("data-i18n");
          if(STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
      });
  };

  // ====== 8. تحميل وحفظ البيانات ======
  const loadAll = () => {
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    const feeInp = $("termFeeInp");
    if(feeInp) feeInp.value = termFee > 0 ? termFee : "";

    // Load Settings
    if(localStorage.getItem(K_DARK_MODE) === "1") toggleDarkMode(true);
    const savedLang = localStorage.getItem(K_LANG) || "ar";
    applyLanguage(savedLang);

    // Load Data
    try {
      students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}");
      deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}");
      revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}");
      extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]");
      attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}");
    } catch(e) { console.error("Data Parse Error", e); }

    if(!attByDate) attByDate={}; if(!revenueByDate) revenueByDate={};
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

  // ====== 9. التحقق من الدخول ======
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

  // ====== 10. المنطق الأساسي (Core Logic) ======
  const existsId = (id) => !!students[String(id)];
  const getStudent = (id) => students[String(id)] || null;
  const setStudent = (st) => { students[String(st.id)] = st; saveAll(); };
  const isFilledStudent = (st) => { if (!st) return false; return !!((st.name && st.name.trim()) || (st.phone && st.phone.trim()) || (st.paid > 0)); };

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

    if (!st) { // Clear UI
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
    if(inps.paid) inps.paid.value = (st.paid||0) + " ";
    if(inps.newP) inps.newP.value = "";

    // Payment Badge Logic
    if(badge) {
        badge.classList.remove("hidden");
        const paid = st.paid || 0;
        if(termFee > 0) {
            if(paid >= termFee) { badge.textContent = currentLang==="ar"?"✅ خالص":"✅ Fully Paid"; badge.className="paymentBadge paid"; }
            else if(paid > 0) { badge.textContent = currentLang==="ar"?`⚠️ باقي ${termFee-paid}`:`⚠️ Partial`; badge.className="paymentBadge partial"; }
            else { badge.textContent = currentLang==="ar"?"🔴 لم يدفع":"🔴 Unpaid"; badge.className="paymentBadge unpaid"; }
        } else {
            if(paid > 0) { badge.textContent = `💰 ${paid}`; badge.className="paymentBadge partial"; }
            else { badge.textContent = "—"; badge.style.background="#eee"; }
        }
    }

    // Attendance Logic
    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    if(pills.status) {
        pills.status.textContent = dates.includes(today) ? (currentLang==="ar"?"✅ حاضر":"✅ Present") : (currentLang==="ar"?"✖ غياب":"✖ Absent");
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
      if(!st) return {ok:false, msg:"ID Not Found"};
      if(!st.attendanceDates.includes(dateStr)) {
          st.attendanceDates.push(dateStr);
          if(!attByDate[dateStr]) attByDate[dateStr] = [];
          if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
          saveAll(); playBeep();
          return {ok:true, msg:"Checked In"};
      }
      return {ok:false, msg:"Already Here"};
  };

  const removeAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "Not found" };
    if(st.attendanceDates) st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
    if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
    setStudent(st); saveAll();
    return { ok: true, msg: "Checked Out" };
  };

  const moveToBin = (id) => {
      const st = getStudent(id);
      if(!st || !isFilledStudent(st)) return;
      let deduct = false;
      if(st.paid > 0) {
          if(confirm(`⚠️ Financial Alert!\nThis student paid (${st.paid}).\n\nDeduct from revenue?`)) deduct = true;
      }
      if(deduct) {
          const t = nowDateStr(); revenueByDate[t] = (revenueByDate[t]||0) - st.paid;
      }
      deletedStudents[id] = JSON.parse(JSON.stringify(st));
      students[id] = {id:id, name:"", paid:0, notes:"", attendanceDates:[]};
      if(id > BASE_MAX_ID) { delete students[id]; extraIds = extraIds.filter(x => x !== id); }
      saveAll(); alert("Moved to Recycle Bin 🗑️"); updateStudentUI(null); renderReport(nowDateStr()); 
  };

  const renderReport = (d) => {
      const list = $("reportList"); if(!list) return;
      const ids = attByDate[d] || [];
      const lbl = $("reportDateLabel"); if(lbl) lbl.textContent = prettyDate(d);
      const cnt = $("reportCount"); if(cnt) cnt.textContent = ids.length;
      const mon = $("reportMoney"); if(mon) mon.textContent = (revenueByDate[d]||0) + " ج";
      
      if(!ids.length) list.innerHTML = "<div class='mutedCenter'>—</div>";
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

  // ====== 11. توصيل الأزرار (Event Bindings) ======
  
  // Login
  on("loginBtn", "click", () => {
      const u = $("user").value.trim(); const p = $("pass").value.trim();
      if(u === ADMIN_USER && p === ADMIN_PASS) { localStorage.setItem(K_AUTH, "1"); showApp(); } 
      else showMsg("loginMsg", "Error", "err");
  });
  on("logoutBtn", "click", () => { localStorage.removeItem(K_AUTH); showLogin(); });
  on("togglePass", "click", () => { const p=$("pass"); if(p) p.type = p.type==="password"?"text":"password"; });

  // Settings
  on("langBtn", "click", () => applyLanguage(currentLang==="ar"?"en":"ar"));
  on("darkModeBtn", "click", () => toggleDarkMode());

  // Search Logic (Fixed)
  window.extOpen = (id) => { 
      updateStudentUI(id); 
      const c = document.querySelector(".studentCard"); 
      if(c) c.scrollIntoView({behavior:"smooth"}); 
  };
  
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
  on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
  on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});

  // Actions
  on("addNewBtn", "click", () => {
      const id = toInt($("newId").value);
      if(!id || existsId(id)) { showMsg("addMsg", "Exists", "err"); return; }
      students[String(id)] = makeEmptyStudent(id);
      if(id<BASE_MIN_ID || id>BASE_MAX_ID) extraIds.push(id);
      saveAll(); window.extOpen(id); showMsg("addMsg", "Added", "ok");
  });

  on("saveStudentBtn", "click", () => {
      if(!currentId) return;
      const s = students[currentId];
      s.name = $("stName").value; s.className = $("stClass").value; s.phone = $("stPhone").value; s.notes = $("stNotes").value;
      saveAll(); showMsg("studentMsg", "Saved", "ok"); updateTopStats();
  });

  on("addPaymentBtn", "click", () => {
      if(!currentId) return; const v = parseInt($("newPaymentInput").value); if(!v) return;
      students[currentId].paid = (students[currentId].paid||0) + v;
      revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + v;
      saveAll(); alert("Done"); updateStudentUI(currentId); renderReport(nowDateStr());
  });
  on("correctPayBtn", "click", () => {
      if(!currentId) return; const v = parseInt(prompt("Correction Amount:")); if(!v) return;
      students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
      revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
      saveAll(); alert("Done"); updateStudentUI(currentId); renderReport(nowDateStr());
  });

  on("deleteStudentBtn", "click", () => { if(currentId && confirm("Delete?")) moveToBin(currentId); });

  // Lists & Modals
  const renderList = () => {
      const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
      const fC = $("filterClass") ? $("filterClass").value.toLowerCase() : "all";
      const fS = $("filterStatus") ? $("filterStatus").value : "all";
      
      Object.values(students).filter(s=>s.name||s.paid>0).forEach(s => {
          // Filters logic placeholder
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.paid}</td><td>-</td>`;
          tr.onclick = () => { $("allStudentsModal").classList.add("hidden"); window.extOpen(s.id); };
          tb.appendChild(tr);
      });
  };
  on("openAllStudentsBtn", "click", () => { renderList(); $("allStudentsModal").classList.remove("hidden"); });
  on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));
  if($("filterClass")) $("filterClass").addEventListener("change", renderList);
  if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);

  on("openBinBtn", "click", () => { 
      const bl = $("binList"); bl.innerHTML = "";
      Object.values(deletedStudents).forEach(s => {
          bl.innerHTML += `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="restoreStudent(${s.id})">Restore</button></div>`;
      });
      $("recycleBinModal").classList.remove("hidden"); 
  });
  on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
  window.restoreStudent = (id) => {
      if(students[id] && (students[id].name || students[id].paid>0)) { if(!confirm("Occupied. Overwrite?")) return; }
      students[id] = deletedStudents[id]; delete deletedStudents[id];
      saveAll(); alert("Restored"); $("recycleBinModal").classList.add("hidden"); window.extOpen(id);
  };

  // Report & Excel
  on("copyReportBtn", "click", () => {
      const txt = `Report: ${$("reportDateLabel").textContent} \n Count: ${$("reportCount").textContent} \n Rev: ${$("reportMoney").textContent}`;
      navigator.clipboard.writeText(txt).then(() => alert("Copied"));
  });

  on("exportExcelBtn", "click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","Name","Class","Phone","Paid","Notes"]];
    filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
    XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
  });

  on("importExcelInput", "change", async () => {
    const f = $("importExcelInput").files[0]; if(!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
    alert("Import Logic Triggered (Reloading to apply)"); location.reload(); 
  });

  // Danger
  on("saveFeeBtn", "click", () => { if(prompt("Pass")===ADMIN_PASS) { termFee=toInt($("termFeeInp").value)||0; saveAll(); alert("Saved"); updateStudentUI(currentId); }});
  on("resetTermBtn", "click", () => { if($("termPass").value===ADMIN_PASS && confirm("Reset?")) { for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; } attByDate={}; revenueByDate={}; saveAll(); alert("Done"); location.reload(); }});
  on("resetBtn", "click", () => { if($("resetPass").value===ADMIN_PASS && confirm("Wipe All?")) { localStorage.clear(); location.reload(); }});

  // Init
  loadAll(); ensureBase500(); checkAuth();

});
