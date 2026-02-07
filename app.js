/* =============================================
   Center Attendance System V9 - (Final Masterpiece)
   Features: Filters, Recycle Bin, Payment Correction, Smart Notes, Dark Mode
   ============================================= */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  // ====== STORAGE KEYS ======
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v6";      
  const K_EXTRA_IDS = "ca_extra_ids_v6";     
  const K_ATT_BY_DATE = "ca_att_by_date_v6"; 
  const K_TERM_FEE = "ca_term_fee_v6"; 
  const K_REVENUE = "ca_revenue_v6"; 
  const K_BIN = "ca_recycle_bin_v9"; // New Key
  const K_THEME = "ca_theme_mode";   // New Key

  // ====== DOM ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  // Top Bar
  const totalStudentsCount = $("totalStudentsCount");
  const openAllStudentsBtn = $("openAllStudentsBtn");
  const todayCountTop = $("todayCountTop");
  const todayRevenue = $("todayRevenue"); 
  const termFeeInp = $("termFeeInp");
  const saveFeeBtn = $("saveFeeBtn");
  const themeBtn = $("themeBtn"); // Dark Mode

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
  const correctPaymentBtn = $("correctPaymentBtn"); // Correction
  const paymentBadge = $("paymentBadge");
  
  const stNotes = $("stNotes");

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const deleteStudentBtn = $("deleteStudentBtn"); // Delete
  const studentMsg = $("studentMsg");
  const attList = $("attList");

  // Recycle Bin Elements
  const recycleBinCard = $("recycleBinCard");
  const toggleBinBtn = $("toggleBinBtn");
  const recycleBinList = $("recycleBinList");
  const emptyBinBtn = $("emptyBinBtn");

  // Modal Elements
  const allStudentsModal = $("allStudentsModal");
  const closeModalBtn = $("closeModalBtn");
  const allStudentsTable = $("allStudentsTable").querySelector("tbody");
  const filterGroup = $("filterGroup");     // Filter 1
  const filterPayment = $("filterPayment"); // Filter 2

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
  let revenueByDate = {}; 
  let recycleBin = []; // New State
  let currentId = null;
  let termFee = 0;

  // ====== SOUND ======
  const playBeep = (type = "success") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = type === "success" ? 880 : (type === "error" ? 300 : 600); 
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
    localStorage.setItem(K_TERM_FEE, String(termFee));
    localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
    localStorage.setItem(K_BIN, JSON.stringify(recycleBin)); // Save Bin
    updateTopStats();
    renderRecycleBin();
  };

  const loadAll = () => {
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    termFeeInp.value = termFee > 0 ? termFee : "";

    // Load Theme
    if (localStorage.getItem(K_THEME) === "dark") {
        document.body.classList.add("dark-mode");
    }

    let sRaw = localStorage.getItem(K_STUDENTS);
    if(!sRaw) sRaw = localStorage.getItem("ca_students_v5") || localStorage.getItem("ca_students_v4");
    
    try { students = JSON.parse(sRaw || "{}") || {}; } catch { students = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}") || {}; } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]") || []; } catch { extraIds = []; }
    try { recycleBin = JSON.parse(localStorage.getItem(K_BIN) || "[]") || []; } catch { recycleBin = []; }
    
    let aRaw = localStorage.getItem(K_ATT_BY_DATE);
    if(!aRaw) aRaw = localStorage.getItem("ca_att_by_date_v5");
    try { attByDate = JSON.parse(aRaw || "{}") || {}; } catch { attByDate = {}; }

    updateTopStats();
    renderRecycleBin();
  };

  const updateTopStats = () => {
    const filledCount = Object.values(students).filter(st => st.name && st.name.trim().length > 0).length;
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
      students[String(i)] = makeEmptyStudent(i);
    }
    extraIds = [];
    attByDate = {};
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
      // Clear UI
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
      return;
    }

    // Load Data
    stName.value = st.name || "";
    stClass.value = st.className || "";
    stPhone.value = st.phone || "";

    // SMART NOTES: Prepend Date if empty or new line needed
    // This gives the "WhatsApp Chat" feel
    const todayDateTag = `[${nowDateStr()}]`;
    let currentNotes = st.notes || "";
    if (!currentNotes.endsWith(" ")) currentNotes += " "; // ensure space
    
    // Only append date if the last entry wasn't today (simple check)
    if (!currentNotes.includes(todayDateTag)) {
        if(currentNotes.trim().length > 0) currentNotes += "\n\n";
        currentNotes += `${todayDateTag} `;
    }
    stNotes.value = currentNotes.trimStart(); 

    
    // Payment UI
    stTotalPaid.value = (st.paid || 0) + " جنيه"; 
    newPaymentInput.value = ""; 

    // Payment Badge
    const paidVal = parseInt(st.paid) || 0;
    paymentBadge.classList.remove("hidden");
    paymentBadge.className = "paymentBadge"; 
    
    if (termFee > 0) {
      if (paidVal >= termFee) {
        paymentBadge.textContent = "✅ خالص المصاريف";
        paymentBadge.classList.add("paid");
      } else if (paidVal > 0) {
        const remaining = termFee - paidVal;
        paymentBadge.textContent = `⚠️ دافع جزء (باقي ${remaining})`;
        paymentBadge.classList.add("partial");
      } else {
        paymentBadge.textContent = "🔴 لم يدفع شيئاً";
        paymentBadge.classList.add("unpaid");
      }
    } else {
      if (paidVal > 0) {
         paymentBadge.textContent = `💰 إجمالي المدفوع: ${paidVal}`;
         paymentBadge.classList.add("partial");
      } else {
         paymentBadge.textContent = "— لم يتم تحديد مصاريف للترم —";
         paymentBadge.style.background = "#eee";
      }
    }

    // Attendance UI
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
      
    // New Student Logic
    if (dates.length === 0 && st.name) newBadge.classList.remove("hidden");
    else newBadge.classList.add("hidden");
  };

  const renderReport = (dateStr) => {
    reportDateLabel.textContent = `تاريخ: ${prettyDate(dateStr)}`;
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

  // ====== MODAL & FILTERS ======
  const renderModalTable = () => {
    // 1. Get raw list
    let list = Object.values(students).filter(st => isFilledStudent(st));
    
    // 2. Apply Filters
    const gVal = filterGroup.value;
    const pVal = filterPayment.value;

    // Filter by Group
    if (gVal !== "all") {
        list = list.filter(st => (st.className || "").trim() === gVal);
    }

    // Filter by Payment
    if (pVal !== "all") {
        list = list.filter(st => {
            const paid = st.paid || 0;
            if (pVal === "paid") return termFee > 0 && paid >= termFee;
            if (pVal === "unpaid") return paid === 0;
            if (pVal === "partial") return paid > 0 && (termFee === 0 || paid < termFee);
            return true;
        });
    }

    // 3. Sort by ID
    list.sort((a,b) => a.id - b.id);

    // 4. Render
    allStudentsTable.innerHTML = "";
    if (list.length === 0) {
        allStudentsTable.innerHTML = `<tr><td colspan="5" class="mutedCenter">لا توجد نتائج مطابقة للفلاتر</td></tr>`;
        return;
    }

    list.forEach(st => {
        const tr = document.createElement("tr");
        const paid = st.paid || 0;
        let status = "—";
        let statusColor = "#555";
        
        if(termFee > 0) {
            if(paid >= termFee) { status = "✅ خالص"; statusColor = "green"; }
            else if(paid > 0) { status = `⚠️ باقي ${termFee - paid}`; statusColor = "#d29922"; }
            else { status = "🔴 لم يدفع"; statusColor = "red"; }
        } else {
            if(paid > 0) status = `دافع ${paid}`;
        }
        
        tr.innerHTML = `
          <td>${st.id}</td>
          <td>${escapeHtml(st.name)}</td>
          <td>${escapeHtml(st.className)}</td>
          <td>${paid}</td>
          <td style="color:${statusColor}; font-weight:bold;">${status}</td>
        `;
        tr.style.cursor = "pointer";
        tr.onclick = () => {
            allStudentsModal.classList.add("hidden");
            openStudent(st.id);
        };
        allStudentsTable.appendChild(tr);
    });
  };

  openAllStudentsBtn.addEventListener("click", () => {
    // Populate Group Filter Dynamically
    const groups = new Set();
    Object.values(students).forEach(st => {
        if(st.className && st.className.trim()) groups.add(st.className.trim());
    });
    
    filterGroup.innerHTML = `<option value="all">📚 كل المجموعات</option>`;
    groups.forEach(g => {
        const op = document.createElement("option");
        op.value = g;
        op.textContent = g;
        filterGroup.appendChild(op);
    });

    // Reset Filters
    filterGroup.value = "all";
    filterPayment.value = "all";

    renderModalTable();
    allStudentsModal.classList.remove("hidden");
  });

  // Re-render on filter change
  filterGroup.addEventListener("change", renderModalTable);
  filterPayment.addEventListener("change", renderModalTable);

  closeModalBtn.addEventListener("click", () => allStudentsModal.classList.add("hidden"));

  // ====== RECYCLE BIN LOGIC ======
  const renderRecycleBin = () => {
    if (recycleBin.length === 0) {
        recycleBinList.innerHTML = `<div class="mutedCenter">السلة فارغة ✅</div>`;
        emptyBinBtn.classList.add("hidden");
        return;
    }
    
    emptyBinBtn.classList.remove("hidden");
    recycleBinList.innerHTML = recycleBin.map((st, index) => `
        <div class="binItem">
            <span>#${st.id} - ${escapeHtml(st.name)}</span>
            <div>
                <button class="btn success smallBtn" onclick="window.restoreStudent(${index})">استعادة</button>
            </div>
        </div>
    `).join("");
  };

  // Global functions for inline HTML calls (Restore)
  window.restoreStudent = (index) => {
    const st = recycleBin[index];
    if (existsId(st.id)) {
        alert(`لا يمكن الاستعادة! الـ ID ${st.id} مستخدم حالياً لطالب آخر.`);
        return;
    }
    // Restore
    students[String(st.id)] = st;
    recycleBin.splice(index, 1);
    saveAll();
    alert("تم استعادة الطالب بنجاح ✅");
  };

  toggleBinBtn.addEventListener("click", () => {
      recycleBinList.classList.toggle("hidden");
      emptyBinBtn.classList.toggle("hidden"); // Toggle Empty btn too if bin not empty
      if(recycleBin.length === 0) emptyBinBtn.classList.add("hidden"); 
  });

  emptyBinBtn.addEventListener("click", () => {
      if(!confirm("⚠️ هل أنت متأكد؟ سيتم حذف هؤلاء الطلاب نهائياً ولا يمكن استرجاعهم.")) return;
      recycleBin = [];
      saveAll();
      alert("تم تفريغ السلة");
  });

  // ====== DELETE STUDENT (The Red Button) ======
  deleteStudentBtn.addEventListener("click", () => {
      if(!currentId) return;
      if(!confirm("⚠️ تحذير هام!\nهل أنت متأكد من حذف هذا الطالب؟\nسيتم نقله إلى سلة المحذوفات.")) return;

      const st = getStudent(currentId);
      
      // Move to Bin
      recycleBin.push(st);
      
      // Remove from Active
      delete students[String(currentId)];
      
      // If it was an extra ID, clean it up
      const idx = extraIds.indexOf(currentId);
      if(idx > -1) extraIds.splice(idx, 1);

      // Create a fresh empty slot if it was a base ID
      if(currentId >= BASE_MIN_ID && currentId <= BASE_MAX_ID) {
          students[String(currentId)] = makeEmptyStudent(currentId);
      }

      saveAll();
      playBeep("success"); // Confirmed sound
      alert("تم حذف الطالب ونقله للسلة ♻️");
      
      // Clear UI
      currentId = null;
      updateStudentUI(null);
  });

  // ====== PAYMENT CORRECTION (DEDUCT) ======
  correctPaymentBtn.addEventListener("click", () => {
    if(!currentId) return;
    const st = getStudent(currentId);
    
    const amount = prompt(`⚠️ تصحيح الرصيد (خصم)\nالطالب دافع حالياً: ${st.paid} ج\nأدخل المبلغ المراد خصمه (مثال: 100):`);
    if(!amount) return;
    
    const val = parseInt(amount);
    if(isNaN(val) || val <= 0) return alert("مبلغ غير صحيح");
    
    if(val > st.paid) return alert("خطأ! المبلغ المراد خصمه أكبر من المدفوع.");

    // Apply Deduction
    st.paid -= val;
    
    // Deduct from Revenue too
    const today = nowDateStr();
    if(revenueByDate[today]) {
        revenueByDate[today] -= val;
        if(revenueByDate[today] < 0) revenueByDate[today] = 0; // Safety
    }

    setStudent(st);
    saveAll();
    alert(`تم خصم ${val} ج بنجاح. الرصيد الجديد: ${st.paid}`);
    updateStudentUI(currentId);
    renderReport(today);
  });

  // ====== DARK MODE ======
  themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem(K_THEME, isDark ? "dark" : "light");
  });

  // ====== SEARCH & OPEN ======
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
  
  openBtn.addEventListener("click", () => openStudent(toInt(openId.value)));

  searchAny.addEventListener("input", () => {
    const q = String(searchAny.value || "").trim().toLowerCase();
    if (!q) { searchMsg.style.display = "none"; return; }

    const matches = Object.values(students).filter(st => isFilledStudent(st))
      .filter(st => {
        const name = String(st.name || "").toLowerCase();
        const phone = String(st.phone || "").toLowerCase();
        const sId = String(st.id);
        return name.includes(q) || phone.includes(q) || sId.includes(q);
      }).slice(0, 10);

    if (!matches.length) {
      searchMsg.innerHTML = `<div style="padding:10px; color:#cf222e;">لا توجد نتائج...</div>`;
      searchMsg.style.display = "block"; return;
    }

    const html = matches.map(st => `
        <div class="resultItem" data-id="${st.id}">
          <strong>${escapeHtml(st.name||"بدون اسم")}</strong> 
          <span style="float:left; font-size:12px; color:#666;">#${st.id}</span>
          <br><span style="font-size:12px; color:#888;">📞 ${escapeHtml(st.phone || "—")}</span>
        </div>`).join("");

    searchMsg.innerHTML = `<div class="resultsList">${html}</div>`;
    searchMsg.style.display = "block"; 
    searchMsg.querySelectorAll(".resultItem").forEach(div => {
      div.addEventListener("click", () => openStudent(toInt(div.getAttribute("data-id"))));
    });
  });

  // ====== ACTIONS ======
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

    setStudent(st);
    saveAll(); 
    alert(`تم إيداع ${amountVal} ج بنجاح ✅`);
    updateStudentUI(currentId);
    renderReport(reportDate.value || today);
  });

  saveFeeBtn.addEventListener("click", () => {
      const pass = prompt("🔐 أدخل كلمة مرور المسؤول لتعديل المصاريف:");
      if(pass !== ADMIN_PASS) return alert("كلمة المرور خطأ!");
      termFee = toInt(termFeeInp.value) || 0;
      saveAll();
      alert(`تم الحفظ: ${termFee}`);
      if(currentId) updateStudentUI(currentId); 
  });

  addNewBtn.addEventListener("click", () => {
    const id = toInt(newId.value);
    if (!id || existsId(id)) { showMsg(addMsg, "ID غير صحيح أو موجود", "err"); return; }
    students[String(id)] = makeEmptyStudent(id);
    if (id < BASE_MIN_ID || id > BASE_MAX_ID) extraIds.push(id);
    saveAll();
    showMsg(addMsg, `تم إضافة ${id}.. جاري الفتح...`, "ok");
    newId.value = "";
    setTimeout(() => openStudent(id), 100);
  });

  copyReportBtn.addEventListener("click", () => {
     const d = reportDate.value || nowDateStr();
     const count = reportCount.textContent; 
     const money = reportMoney.textContent; 
     const newStCount = Object.values(students).filter(s => s.joinedDate === d).length;
     const text = 
`📊 *تقرير السنتر اليومي*
📅 التاريخ: ${prettyDate(d)}

👥 *الطلاب:*
- الحضور: ${count}
- عدد الطلاب الجدد: ${newStCount} طالب

💰 *الماليات (الخزنة):*
- إيراد اليوم: ${money}

---
تم الاستخراج من اللوحة 🎓`;
     
     if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyReportBtn.textContent;
            copyReportBtn.textContent = "تم النسخ ✅";
            setTimeout(() => copyReportBtn.textContent = originalText, 2000);
        }).catch(() => alert("النسخ غير مدعوم"));
     } else alert("النسخ غير مدعوم");
  });

  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) return;
    const st = getStudent(currentId);
    st.name = stName.value.trim();
    st.className = stClass.value.trim();
    st.phone = stPhone.value.trim();
    st.notes = stNotes.value.trim(); // Save whatever is in the box
    setStudent(st);
    playBeep("success"); 
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

  // Reset Actions
  resetTermBtn.addEventListener("click", () => {
    if (termPass.value !== ADMIN_PASS) { showMsg(resetMsg, "كلمة المرور خطأ!", "err"); return; }
    if (!confirm("تأكيد تصفير الترم؟")) return;
    for (const key in students) { students[key].attendanceDates = []; students[key].paid = 0; }
    attByDate = {}; revenueByDate = {}; 
    saveAll(); termPass.value = ""; showMsg(resetMsg, "تم التصفير!", "ok");
    updateStudentUI(currentId); renderReport(nowDateStr());
  });

  resetBtn.addEventListener("click", () => {
    if (resetPass.value !== ADMIN_PASS) { showMsg(resetMsg, "كلمة المرور خطأ!", "err"); return; }
    if (!confirm("تحذير! مسح كلي؟")) return;
    localStorage.clear(); 
    students = {}; extraIds = []; attByDate = {}; revenueByDate={}; currentId = null; termFee=0;
    recycleBin = []; // Clear bin too
    ensureBase500(); loadAll(); updateStudentUI(null); renderReport(nowDateStr());
    showMsg(resetMsg, "تمت إعادة الضبط.", "ok");
  });

  // Standard
  loginBtn.addEventListener("click", () => {
    if (userInp.value === ADMIN_USER && passInp.value === ADMIN_PASS) { setAuth(true); showApp(); } 
    else showMsg(loginMsg, "خطأ!", "err");
  });
  quickAttendBtn.addEventListener("click", () => {
    const id = toInt(quickAttendId.value);
    if (!id || !existsId(id)) { showMsg(quickMsg, "ID خطأ", "err"); return; }
    const res = addAttendance(id, nowDateStr());
    showMsg(quickMsg, res.msg, res.ok?"ok":"err");
    updateStudentUI(id); renderReport(nowDateStr());
    quickAttendId.value = ""; quickAttendId.focus();
  });
  logoutBtn.addEventListener("click", () => { setAuth(false); showLogin(); });
  togglePassBtn?.addEventListener("click", () => passInp.type = passInp.type==="password"?"text":"password");

  // ====== EXCEL EXPORT/IMPORT ======
  exportExcelBtn.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    
    // Sheet 1: Students
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","الاسم","الصف","موبايل","مدفوع","ملاحظات"]];
    filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes]));
    
    // Sheet 2: Attendance History
    const wsAtt = [["التاريخ","ID"]];
    Object.keys(attByDate).sort().forEach(d => {
       attByDate[d].forEach(id => wsAtt.push([d, id]));
    });

    // Sheet 3: Revenue History
    const wsRev = [["التاريخ", "الإيراد"]];
    Object.keys(revenueByDate).sort().forEach(d => {
        wsRev.push([d, revenueByDate[d]]);
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAtt), "Attendance_Log");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsRev), "Revenue_Log");
    XLSX.writeFile(wb, `Center_Full_Backup_${nowDateStr()}.xlsx`);
  });

  importExcelInput.addEventListener("change", async () => {
    const f = importExcelInput.files[0]; if(!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
    
    // 1. Import Students
    const sName = wb.SheetNames.find(n => n.includes("Student")) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sName], {header:1, defval:""});
    const head = rows[0].map(x => String(x).toLowerCase().trim());
    const iID = head.findIndex(x=>x.includes("id"));
    if (iID === -1) { alert("خطأ: لا يوجد عمود ID"); return; }
    
    const iName = head.findIndex(x=>x.includes("اسم")||x.includes("name"));
    const iPhone = head.findIndex(x=>x.includes("موبايل")||x.includes("phone"));
    const iPaid = head.findIndex(x=>x.includes("مدفوع")||x.includes("paid"));
    const iNote = head.findIndex(x=>x.includes("ملاحظات")||x.includes("note"));

    // Reset Data
    students = {}; extraIds = []; attByDate = {}; revenueByDate = {}; recycleBin = [];
    ensureBase500();

    // Fill Students
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

    // 2. Import Attendance Log
    const attSheetName = wb.SheetNames.find(n => n.includes("Attendance"));
    if(attSheetName) {
        const attRows = XLSX.utils.sheet_to_json(wb.Sheets[attSheetName], {header:1});
        for(let r=1; r<attRows.length; r++) {
            const dateStr = attRows[r][0];
            const sId = attRows[r][1];
            if(dateStr && sId) {
                if(!attByDate[dateStr]) attByDate[dateStr] = [];
                attByDate[dateStr].push(sId);
                if(students[sId] && !students[sId].attendanceDates.includes(dateStr)) {
                    students[sId].attendanceDates.push(dateStr);
                }
            }
        }
    }

    // 3. Import Revenue Log
    const revSheetName = wb.SheetNames.find(n => n.includes("Revenue"));
    if(revSheetName) {
        const revRows = XLSX.utils.sheet_to_json(wb.Sheets[revSheetName], {header:1});
        for(let r=1; r<revRows.length; r++) {
            const dateStr = revRows[r][0];
            const amount = revRows[r][1];
            if(dateStr) revenueByDate[dateStr] = toInt(amount) || 0;
        }
    }

    saveAll(); 
    alert("تم استعادة النسخة الاحتياطية بالكامل (طلاب + تاريخ + خزنة) ✅"); 
    location.reload(); 
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
