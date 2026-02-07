/* =============================================
   Center Attendance System V9.2 - (Manager Safety Edition)
   Features: Fix Attendance, Financial Integrity on Delete
   ============================================= */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  // ====== STORAGE KEYS (Fixed) ======
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v6";      
  const K_EXTRA_IDS = "ca_extra_ids_v6";     
  const K_ATT_BY_DATE = "ca_att_by_date_v6"; 
  const K_TERM_FEE = "ca_term_fee_v6"; 
  const K_REVENUE = "ca_revenue_v6"; 
  const K_DELETED = "ca_deleted_v9"; 
  const K_DARK_MODE = "ca_dark_mode";

  // ====== DOM ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  // Top Bar
  const totalStudentsCount = $("totalStudentsCount");
  const openAllStudentsBtn = $("openAllStudentsBtn");
  const todayCountTop = $("todayCountTop");
  const todayRevenue = $("todayRevenue"); 
  const termFeeInp = $("termFeeInp");
  const saveFeeBtn = $("saveFeeBtn");
  const darkModeBtn = $("darkModeBtn");

  // Login & Main App
  const loginBox = $("loginBox");
  const appBox = $("appBox");
  const userInp = $("user");
  const passInp = $("pass");
  const togglePassBtn = $("togglePass");
  const loginBtn = $("loginBtn");
  const loginMsg = $("loginMsg");
  const logoutBtn = $("logoutBtn");

  // Excel
  const exportExcelBtn = $("exportExcelBtn");
  const importExcelInput = $("importExcelInput");

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
  const reportMoney = $("reportMoney"); 
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
  
  // Payment Elements
  const stTotalPaid = $("stTotalPaid"); 
  const newPaymentInput = $("newPaymentInput"); 
  const addPaymentBtn = $("addPaymentBtn"); 
  const correctPayBtn = $("correctPayBtn");
  const paymentBadge = $("paymentBadge");
  
  // Notes
  const newNoteInp = $("newNoteInp");
  const addNoteBtn = $("addNoteBtn");
  const stNotes = $("stNotes");

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const deleteStudentBtn = $("deleteStudentBtn");
  const studentMsg = $("studentMsg");
  const attList = $("attList");

  // Modals
  const allStudentsModal = $("allStudentsModal");
  const closeModalBtn = $("closeModalBtn");
  const allStudentsTable = $("allStudentsTable") ? $("allStudentsTable").querySelector("tbody") : null;
  const filterClass = $("filterClass"); 
  const filterStatus = $("filterStatus");

  const recycleBinModal = $("recycleBinModal");
  const closeBinBtn = $("closeBinBtn");
  const binList = $("binList");
  const openBinBtn = $("openBinBtn");
  const emptyBinBtn = $("emptyBinBtn");

  // Danger Zone
  const resetTermBtn = $("resetTermBtn");
  const termPass = $("termPass");
  const resetBtn = $("resetBtn");
  const resetPass = $("resetPass");
  const resetMsg = $("resetMsg");

  // ====== STATE ======
  let students = {};              
  let deletedStudents = {}; 
  let extraIds = [];              
  let attByDate = {};             
  let revenueByDate = {}; 
  let currentId = null;
  let termFee = 0;
  let isDarkMode = false;

  // ====== SOUND ======
  const playBeep = (type = "success") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = type === "success" ? 880 : 440; 
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

  const getSmartDate = () => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2,0)}-${String(d.getMonth()+1).padStart(2,0)}`;
  }

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
    localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
    localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
    localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
    localStorage.setItem(K_TERM_FEE, String(termFee));
    localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
    updateTopStats();
  };

  const loadAll = () => {
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    termFeeInp.value = termFee > 0 ? termFee : "";

    if(localStorage.getItem(K_DARK_MODE) === "1") toggleDarkMode(true);

    try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}") || {}; } catch { students = {}; }
    try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}") || {}; } catch { deletedStudents = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}") || {}; } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]") || []; } catch { extraIds = []; }
    try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}") || {}; } catch { attByDate = {}; }

    // Fix Nulls
    if(!attByDate) attByDate = {};
    if(!revenueByDate) revenueByDate = {};

    updateTopStats();
  };

  const updateTopStats = () => {
    const filledCount = Object.values(students).filter(st => isFilledStudent(st)).length;
    totalStudentsCount.textContent = filledCount;

    const today = nowDateStr();
    const todayList = attByDate[today] || [];
    todayCountTop.textContent = todayList.length;

    const money = revenueByDate[today] || 0;
    todayRevenue.textContent = money + " ج";
  };

  const ensureBase500 = () => {
    const hasAny = Object.keys(students).length > 0;
    if (hasAny) return;
    for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
      if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i);
    }
    saveAll();
  };

  const makeEmptyStudent = (id) => ({
    id, name: "", className: "", phone: "", paid: 0, 
    notes: "", joinedDate: nowDateStr(), attendanceDates: [] 
  });

  const existsId = (id) => !!students[String(id)];
  const getStudent = (id) => students[String(id)] || null;
  const setStudent = (st) => { students[String(st.id)] = st; saveAll(); };

  const isFilledStudent = (st) => {
    if (!st) return false;
    return !!((st.name && st.name.trim()) || (st.phone && st.phone.trim()) || (st.paid > 0));
  };

  // ====== ATTENDANCE LOGIC (FIXED) ======
  const addAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "ID غير موجود" };

    // Ensure array exists
    if (!Array.isArray(st.attendanceDates)) st.attendanceDates = [];
    if (st.attendanceDates.includes(dateStr)) return { ok: false, msg: "حاضر بالفعل" };

    st.attendanceDates.push(dateStr);
    st.attendanceDates.sort();

    // Ensure Daily Log Exists
    if (!attByDate[dateStr]) attByDate[dateStr] = [];
    if (!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);

    setStudent(st);
    saveAll();
    playBeep("success"); 

    return { ok: true, msg: "تم تسجيل الحضور ✅" };
  };

  const removeAttendance = (id, dateStr) => {
    const st = getStudent(id);
    if (!st) return { ok: false, msg: "غير موجود" };

    if(st.attendanceDates) st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
    
    if (attByDate[dateStr]) {
      attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
    }
    setStudent(st);
    saveAll();
    return { ok: true, msg: "تم إلغاء الحضور ✖" };
  };

  // ====== RECYCLE BIN & FINANCIAL INTEGRITY (FIXED) ======
  const moveToBin = (id) => {
      const st = getStudent(id);
      if(!st || !isFilledStudent(st)) {
          alert("الطالب فارغ بالفعل");
          return; 
      }

      // --- FINANCIAL CHECK (THE MANAGER FIX) ---
      let deductMoney = false;
      if (st.paid > 0) {
          // Ask Manager Logic
          if(confirm(`⚠️ تنبيه مالي هام!\nهذا الطالب دفع مبلغ (${st.paid} ج).\n\nهل تريد خصم هذا المبلغ من خزنة اليوم (إيراد اليوم) قبل الحذف؟\n(اضغط OK للخصم .. اضغط Cancel للحذف فقط)`)) {
              deductMoney = true;
          }
      }

      if(deductMoney) {
          const today = nowDateStr();
          revenueByDate[today] = (revenueByDate[today] || 0) - st.paid;
          // Ensure Revenue doesn't go below 0 visually? (Optional, but let's keep math real)
      }

      // Move to Bin
      deletedStudents[id] = JSON.parse(JSON.stringify(st));
      
      // Clear Slot
      students[id] = makeEmptyStudent(id);
      if(id > BASE_MAX_ID) {
          delete students[id];
          extraIds = extraIds.filter(x => x !== id);
      }
      
      saveAll();
      
      let msg = "تم نقل الطالب للسلة 🗑️";
      if(deductMoney) msg += "\nوتم خصم المبلغ من الخزنة 📉";
      alert(msg);
      
      updateStudentUI(null);
      renderReport(nowDateStr()); // Update Report immediately
  };

  const restoreFromBin = (id) => {
      const binSt = deletedStudents[id];
      if(!binSt) return;
      const currentSt = students[id];

      // Smart Check
      if (currentSt && isFilledStudent(currentSt)) {
          if(!confirm(`⚠️ المكان مشغول بالطالب "${currentSt.name}".\nهل تريد استبداله؟`)) return; 
      }
      
      students[id] = binSt; 
      delete deletedStudents[id]; 
      if(id > BASE_MAX_ID && !extraIds.includes(id)) extraIds.push(id);

      saveAll();
      renderBinList();
      updateTopStats();
      recycleBinModal.classList.add("hidden");
      openStudent(id);
      alert("تمت الاستعادة ✅");
  };

  // ====== DARK MODE ======
  const toggleDarkMode = (forceState = null) => {
      if(forceState !== null) isDarkMode = forceState;
      else isDarkMode = !isDarkMode;
      
      if(isDarkMode) {
          document.body.classList.add("dark-mode");
          darkModeBtn.textContent = "☀️";
          localStorage.setItem(K_DARK_MODE, "1");
      } else {
          document.body.classList.remove("dark-mode");
          darkModeBtn.textContent = "🌙";
          localStorage.setItem(K_DARK_MODE, "0");
      }
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
      stTotalPaid.value = ""; 
      newPaymentInput.value = ""; 
      stNotes.value = "";
      newBadge.classList.add("hidden");
      paymentBadge.classList.add("hidden");
      attList.innerHTML = `<div class="mutedCenter">— افتح طالب —</div>`;
      deleteStudentBtn.style.display = "none"; 
      return;
    }

    deleteStudentBtn.style.display = "inline-flex";
    stName.value = st.name || "";
    stClass.value = st.className || "";
    stPhone.value = st.phone || "";
    stNotes.value = st.notes || ""; 
    stTotalPaid.value = (st.paid || 0) + " جنيه"; 
    newPaymentInput.value = ""; 

    const paidVal = parseInt(st.paid) || 0;
    paymentBadge.classList.remove("hidden");
    paymentBadge.className = "paymentBadge"; 
    
    if (termFee > 0) {
      if (paidVal >= termFee) {
        paymentBadge.textContent = "✅ خالص"; paymentBadge.classList.add("paid");
      } else if (paidVal > 0) {
        paymentBadge.textContent = `⚠️ باقي ${termFee - paidVal}`; paymentBadge.classList.add("partial");
      } else {
        paymentBadge.textContent = "🔴 لم يدفع"; paymentBadge.classList.add("unpaid");
      }
    } else {
      if (paidVal > 0) {
         paymentBadge.textContent = `💰 مدفوع: ${paidVal}`; paymentBadge.classList.add("partial");
      } else {
         paymentBadge.textContent = "—"; paymentBadge.style.background = "#eee";
      }
    }

    const today = nowDateStr();
    const dates = st.attendanceDates || [];
    const hasToday = dates.includes(today);

    studentIdPill.textContent = `ID: ${st.id}`;
    todayStatus.textContent = hasToday ? "حاضر ✅" : "غياب ✖";
    todayStatus.style.color = hasToday ? "#2ea44f" : "#cf222e";
    daysCount.textContent = `${dates.length} مرة`;
    const last = dates.length ? dates[dates.length - 1] : "";
    lastAttend.textContent = last ? prettyDate(last) : "—";

    const last25 = [...dates].sort().slice(-25).reverse();
    attList.innerHTML = last25.length 
      ? last25.map(d => `<div class="item">${escapeHtml(prettyDate(d))}</div>`).join("")
      : `<div class="mutedCenter">— لا يوجد حضور —</div>`;
      
    if (dates.length === 0 && st.name) newBadge.classList.remove("hidden");
    else newBadge.classList.add("hidden");
  };

  const renderReport = (dateStr) => {
    reportDateLabel.textContent = `تاريخ: ${prettyDate(dateStr)}`;
    // Check Date Key Exists
    const ids = attByDate[dateStr] || [];
    reportCount.textContent = `${ids.length} طالب`;
    const money = revenueByDate[dateStr] || 0;
    reportMoney.textContent = money + " ج";

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

  // ====== BIN RENDER ======
  const renderBinList = () => {
      const ids = Object.keys(deletedStudents);
      if(ids.length === 0) {
          binList.innerHTML = `<div class="mutedCenter">السلة فارغة</div>`;
          return;
      }
      binList.innerHTML = ids.map(id => {
          const st = deletedStudents[id];
          return `
            <div class="binItem">
                <div><b>(${st.id}) ${escapeHtml(st.name)}</b></div>
                <div>
                    <button class="btn success smallBtn" onclick="window.restoreSt(${st.id})">استعادة</button>
                    <button class="btn danger smallBtn" onclick="window.permaDelete(${st.id})">حذف</button>
                </div>
            </div>`;
      }).join("");
  };

  // Global onclicks
  window.restoreSt = restoreFromBin;
  window.permaDelete = (id) => {
      if(!confirm("حذف نهائي؟")) return;
      delete deletedStudents[id];
      saveAll();
      renderBinList();
  };

  // ====== LISTENERS ======
  if(deleteStudentBtn) deleteStudentBtn.addEventListener("click", () => {
      if(!currentId) return;
      if(confirm(`⚠️ تحذير!\nهل تريد حذف الطالب (${currentId})؟`)) moveToBin(currentId);
  });

  // Attendance Buttons (The Fix)
  markTodayBtn.addEventListener("click", () => {
    if(!currentId) return;
    const res = addAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(currentId); renderReport(nowDateStr());
  });

  unmarkTodayBtn.addEventListener("click", () => {
    if(!currentId) return;
    const res = removeAttendance(currentId, nowDateStr());
    showMsg(studentMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(currentId); renderReport(nowDateStr());
  });

  quickAttendBtn.addEventListener("click", () => {
    const id = toInt(quickAttendId.value);
    if (!id || !existsId(id)) { showMsg(quickMsg, "ID خطأ", "err"); return; }
    const res = addAttendance(id, nowDateStr());
    showMsg(quickMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(id); renderReport(nowDateStr()); quickAttendId.value = ""; quickAttendId.focus();
  });

  // Other Actions
  if(openAllStudentsBtn) openAllStudentsBtn.addEventListener("click", () => { 
      // Need to define renderAllStudents inside or scope logic? 
      // Simplified Logic for Modal
      if(!allStudentsTable) return;
      allStudentsModal.classList.remove("hidden");
      // Trigger render
      filterClass.dispatchEvent(new Event('change'));
  });

  // Need to define renderAllStudents function here to be accessible
  const renderAllStudents = () => {
      if(!allStudentsTable) return;
      const fClass = filterClass.value.toLowerCase();
      const fStatus = filterStatus.value;
      const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
      
      allStudentsTable.innerHTML = "";
      let visibleCount = 0;

      filled.forEach(st => {
          const stC = (st.className || "").toLowerCase();
          const paid = st.paid || 0;
          let statusKey = "unpaid";
          if(termFee > 0) {
              if(paid >= termFee) statusKey = "paid";
              else if(paid > 0) statusKey = "partial";
          } else {
              if(paid > 0) statusKey = "partial";
          }
          if(fClass !== "all" && !stC.includes(fClass)) return; 
          if(fStatus !== "all" && fStatus !== statusKey) return; 

          visibleCount++;
          const tr = document.createElement("tr");
          let statusTxt = "🔴";
          if(statusKey === "paid") statusTxt = "✅ خالص";
          if(statusKey === "partial") statusTxt = `⚠️ باقي ${termFee>0 ? termFee-paid : ""}`;
          
          tr.innerHTML = `<td>${st.id}</td><td>${escapeHtml(st.name)}</td><td>${escapeHtml(st.className)}</td><td>${paid}</td><td>${statusTxt}</td>`;
          tr.style.cursor = "pointer";
          tr.onclick = () => { allStudentsModal.classList.add("hidden"); openStudent(st.id); };
          allStudentsTable.appendChild(tr);
      });
      if(visibleCount === 0) allStudentsTable.innerHTML = `<tr><td colspan="5" class="mutedCenter">لا توجد نتائج</td></tr>`;
  };

  const updateClassFilter = () => {
      const classes = new Set();
      Object.values(students).forEach(st => {
          if(isFilledStudent(st) && st.className) classes.add(st.className.trim());
      });
      filterClass.innerHTML = `<option value="all">-- كل المجموعات --</option>` + 
        Array.from(classes).sort().map(c => `<option value="${c}">${c}</option>`).join("");
  };

  if(filterClass) filterClass.addEventListener("change", renderAllStudents);
  if(filterStatus) filterStatus.addEventListener("change", renderAllStudents);
  if(openAllStudentsBtn) openAllStudentsBtn.addEventListener("click", () => {
      updateClassFilter();
      renderAllStudents();
      allStudentsModal.classList.remove("hidden");
  });
  if(closeModalBtn) closeModalBtn.addEventListener("click", () => allStudentsModal.classList.add("hidden"));

  if(darkModeBtn) darkModeBtn.addEventListener("click", () => toggleDarkMode());

  if(openBinBtn) openBinBtn.addEventListener("click", () => { renderBinList(); recycleBinModal.classList.remove("hidden"); });
  if(closeBinBtn) closeBinBtn.addEventListener("click", () => recycleBinModal.classList.add("hidden"));
  if(emptyBinBtn) emptyBinBtn.addEventListener("click", () => {
      if(confirm("تحذير نهائي!")) { deletedStudents = {}; saveAll(); renderBinList(); }
  });

  if(addNoteBtn) addNoteBtn.addEventListener("click", () => {
      if(!currentId) return;
      const txt = newNoteInp.value.trim();
      if(!txt) return;
      const st = getStudent(currentId);
      const stamp = `[${getSmartDate()}]`;
      st.notes = (st.notes ? st.notes + "\n" : "") + `${stamp} ${txt}`;
      setStudent(st); updateStudentUI(currentId); newNoteInp.value = "";
  });

  if(correctPayBtn) correctPayBtn.addEventListener("click", () => {
      if(!currentId) return;
      const amount = prompt("أدخل المبلغ المراد خصمه:");
      const val = parseInt(amount);
      if(!val || val <= 0) return;
      const st = getStudent(currentId);
      st.paid = Math.max(0, (st.paid || 0) - val);
      const today = nowDateStr();
      revenueByDate[today] = Math.max(0, (revenueByDate[today] || 0) - val);
      setStudent(st); saveAll(); 
      alert(`تم خصم ${val} ج ✅`); updateStudentUI(currentId); renderReport(reportDate.value || today);
  });

  waBtn.addEventListener("click", () => {
    const phone = stPhone.value.trim().replace(/[^0-9]/g, ""); 
    if (phone.length < 10) return alert("رقم الهاتف غير صحيح");
    let finalPhone = phone.startsWith("20") ? phone : (phone.startsWith("01") ? "20"+phone.substring(1) : "20"+phone);
    window.open(`https://wa.me/${finalPhone}`, "_blank");
  });

  addPaymentBtn.addEventListener("click", () => {
    if(!currentId) return alert("افتح طالب أولاً");
    const amountVal = parseInt(newPaymentInput.value);
    if(isNaN(amountVal) || amountVal === 0) return alert("أدخل مبلغ صحيح");
    const st = getStudent(currentId);
    const oldTotal = parseInt(st.paid) || 0;
    st.paid = oldTotal + amountVal;
    const today = nowDateStr();
    revenueByDate[today] = (revenueByDate[today] || 0) + amountVal;
    setStudent(st); saveAll(); 
    playBeep("success"); 
    alert(`تم إيداع ${amountVal} ج بنجاح ✅`);
    updateStudentUI(currentId); renderReport(reportDate.value || today);
  });

  saveFeeBtn.addEventListener("click", () => {
      const pass = prompt("🔐 أدخل كلمة مرور المسؤول لتعديل المصاريف:");
      if(pass !== ADMIN_PASS) return alert("كلمة المرور خطأ!");
      termFee = toInt(termFeeInp.value) || 0; saveAll();
      alert(`تم الحفظ: ${termFee}`); if(currentId) updateStudentUI(currentId); 
  });

  addNewBtn.addEventListener("click", () => {
    const id = toInt(newId.value);
    if (!id || existsId(id)) { showMsg(addMsg, "ID غير صحيح أو موجود", "err"); return; }
    students[String(id)] = makeEmptyStudent(id);
    if (id < BASE_MIN_ID || id > BASE_MAX_ID) extraIds.push(id);
    saveAll(); showMsg(addMsg, `تم إضافة ${id}.. جاري الفتح...`, "ok");
    newId.value = ""; setTimeout(() => openStudent(id), 100);
  });

  copyReportBtn.addEventListener("click", () => {
     const d = reportDate.value || nowDateStr();
     const count = reportCount.textContent; const money = reportMoney.textContent; 
     const newStCount = Object.values(students).filter(s => s.joinedDate === d).length;
     const text = `📊 *تقرير السنتر اليومي*\n📅 التاريخ: ${prettyDate(d)}\n\n👥 *الطلاب:*\n- الحضور: ${count}\n- عدد الطلاب الجدد: ${newStCount} طالب\n\n💰 *الماليات (الخزنة):*\n- إيراد اليوم: ${money}\n\n---\nتم الاستخراج من اللوحة 🎓`;
     if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyReportBtn.textContent; copyReportBtn.textContent = "تم النسخ ✅";
            setTimeout(() => copyReportBtn.textContent = originalText, 2000);
        }).catch(() => alert("النسخ غير مدعوم"));
     } else alert("النسخ غير مدعوم");
  });

  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) return;
    const st = getStudent(currentId);
    st.name = stName.value.trim(); st.className = stClass.value.trim();
    st.phone = stPhone.value.trim(); 
    setStudent(st); playBeep("success"); showMsg(studentMsg, "تم الحفظ ✅", "ok");
    updateStudentUI(currentId); updateTopStats();
  });

  reportBtn.addEventListener("click", () => renderReport(reportDate.value));

  resetTermBtn.addEventListener("click", () => {
    if (termPass.value !== ADMIN_PASS) { showMsg(resetMsg, "كلمة المرور خطأ!", "err"); return; }
    if (!confirm("تأكيد تصفير الترم؟")) return;
    for (const key in students) { students[key].attendanceDates = []; students[key].paid = 0; }
    attByDate = {}; revenueByDate = {}; saveAll(); termPass.value = ""; showMsg(resetMsg, "تم التصفير!", "ok");
    updateStudentUI(currentId); renderReport(nowDateStr());
  });

  resetBtn.addEventListener("click", () => {
    if (resetPass.value !== ADMIN_PASS) { showMsg(resetMsg, "كلمة المرور خطأ!", "err"); return; }
    if (!confirm("تحذير! مسح كلي؟")) return;
    localStorage.clear(); 
    students = {}; extraIds = []; attByDate = {}; revenueByDate={}; currentId = null; termFee=0;
    ensureBase500(); loadAll(); updateStudentUI(null); renderReport(nowDateStr());
    showMsg(resetMsg, "تمت إعادة الضبط.", "ok");
  });

  loginBtn.addEventListener("click", () => {
    if (userInp.value === ADMIN_USER && passInp.value === ADMIN_PASS) { setAuth(true); showApp(); } else showMsg(loginMsg, "خطأ!", "err");
  });

  logoutBtn.addEventListener("click", () => { setAuth(false); showLogin(); });
  togglePassBtn?.addEventListener("click", () => passInp.type = passInp.type==="password"?"text":"password");

  exportExcelBtn.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","الاسم","الصف","موبايل","مدفوع","ملاحظات"]];
    filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes]));
    const wsAtt = [["التاريخ","ID"]];
    Object.keys(attByDate).sort().forEach(d => attByDate[d].forEach(id => wsAtt.push([d, id])));
    const wsRev = [["التاريخ", "الإيراد"]];
    Object.keys(revenueByDate).sort().forEach(d => wsRev.push([d, revenueByDate[d]]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAtt), "Attendance_Log");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsRev), "Revenue_Log");
    XLSX.writeFile(wb, `Center_Full_Backup_${nowDateStr()}.xlsx`);
  });

  importExcelInput.addEventListener("change", async () => {
    const f = importExcelInput.files[0]; if(!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
    const sName = wb.SheetNames.find(n => n.includes("Student")) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sName], {header:1, defval:""});
    const head = rows[0].map(x => String(x).toLowerCase().trim());
    const iID = head.findIndex(x=>x.includes("id"));
    if (iID === -1) { alert("خطأ: لا يوجد عمود ID"); return; }
    const iName = head.findIndex(x=>x.includes("اسم")||x.includes("name"));
    const iPhone = head.findIndex(x=>x.includes("موبايل")||x.includes("phone"));
    const iPaid = head.findIndex(x=>x.includes("مدفوع")||x.includes("paid"));
    const iNote = head.findIndex(x=>x.includes("ملاحظات")||x.includes("note"));
    students = {}; extraIds = []; attByDate = {}; revenueByDate = {}; ensureBase500();
    for(let r=1; r<rows.length; r++) {
      const row = rows[r]; const id = toInt(row[iID]);
      if(id) {
        if(!students[id]) { students[id] = makeEmptyStudent(id); if(id>BASE_MAX_ID) extraIds.push(id); }
        if(iName!==-1) students[id].name = row[iName];
        if(iPhone!==-1) students[id].phone = row[iPhone];
        if(iPaid!==-1) students[id].paid = toInt(row[iPaid]) || 0;
        if(iNote!==-1) students[id].notes = row[iNote];
      }
    }
    const attSheetName = wb.SheetNames.find(n => n.includes("Attendance"));
    if(attSheetName) {
        const attRows = XLSX.utils.sheet_to_json(wb.Sheets[attSheetName], {header:1});
        for(let r=1; r<attRows.length; r++) {
            const dateStr = attRows[r][0]; const sId = attRows[r][1];
            if(dateStr && sId) {
                if(!attByDate[dateStr]) attByDate[dateStr] = [];
                attByDate[dateStr].push(sId);
                if(students[sId] && !students[sId].attendanceDates.includes(dateStr)) students[sId].attendanceDates.push(dateStr);
            }
        }
    }
    const revSheetName = wb.SheetNames.find(n => n.includes("Revenue"));
    if(revSheetName) {
        const revRows = XLSX.utils.sheet_to_json(wb.Sheets[revSheetName], {header:1});
        for(let r=1; r<revRows.length; r++) if(revRows[r][0]) revenueByDate[revRows[r][0]] = toInt(revRows[r][1]) || 0;
    }
    saveAll(); alert("تم استعادة النسخة الاحتياطية بالكامل (طلاب + تاريخ + خزنة) ✅"); location.reload(); 
  });

  const showLogin = () => { loginBox.classList.remove("hidden"); appBox.classList.add("hidden"); };
  const showApp = () => { 
    loginBox.classList.add("hidden"); appBox.classList.remove("hidden");
    reportDate.value = nowDateStr(); renderReport(nowDateStr()); updateTopStats();
    const qId = toInt(new URL(window.location.href).searchParams.get("id"));
    if(qId && existsId(qId)) { updateStudentUI(qId); addAttendance(qId, nowDateStr()); }
  };

  loadAll(); ensureBase500(); isAuth() ? showApp() : showLogin();
})();
