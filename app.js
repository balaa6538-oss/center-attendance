/* =============================================
   Center Attendance System V7 - (Ultimate Pro)
   Features: Student List Modal, Smart Report, Payment Logic
   ============================================= */

(() => {
  // ====== SETTINGS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  // ====== STORAGE KEYS ======
  // Using V6 keys to keep data from previous version
  const K_AUTH = "ca_auth";
  const K_STUDENTS = "ca_students_v6";      
  const K_EXTRA_IDS = "ca_extra_ids_v6";     
  const K_ATT_BY_DATE = "ca_att_by_date_v6"; 
  const K_TERM_FEE = "ca_term_fee_v6"; 
  const K_REVENUE = "ca_revenue_v6"; 

  // ====== DOM ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  // Top Bar
  const totalStudentsCount = $("totalStudentsCount");
  const openAllStudentsBtn = $("openAllStudentsBtn"); // The Button to open List
  const todayCountTop = $("todayCountTop");
  const todayRevenue = $("todayRevenue"); 
  const termFeeInp = $("termFeeInp");
  const saveFeeBtn = $("saveFeeBtn");

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
  const paymentBadge = $("paymentBadge");
  
  const stNotes = $("stNotes");

  const saveStudentBtn = $("saveStudentBtn");
  const markTodayBtn = $("markTodayBtn");
  const unmarkTodayBtn = $("unmarkTodayBtn");
  const studentMsg = $("studentMsg");
  const attList = $("attList");

  // Modal Elements (The New List)
  const allStudentsModal = $("allStudentsModal");
  const closeModalBtn = $("closeModalBtn");
  const allStudentsTable = $("allStudentsTable").querySelector("tbody");

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
      // High pitch for success, lower for generic
      osc.frequency.value = type === "success" ? 880 : 600; 
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
    updateTopStats();
  };

  const loadAll = () => {
    termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
    termFeeInp.value = termFee > 0 ? termFee : "";

    let sRaw = localStorage.getItem(K_STUDENTS);
    // Backward compat check
    if(!sRaw) sRaw = localStorage.getItem("ca_students_v5") || localStorage.getItem("ca_students_v4");
    
    try { students = JSON.parse(sRaw || "{}") || {}; } catch { students = {}; }
    try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}") || {}; } catch { revenueByDate = {}; }
    try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]") || []; } catch { extraIds = []; }
    let aRaw = localStorage.getItem(K_ATT_BY_DATE);
    if(!aRaw) aRaw = localStorage.getItem("ca_att_by_date_v5");
    try { attByDate = JSON.parse(aRaw || "{}") || {}; } catch { attByDate = {}; }

    updateTopStats();
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
    stNotes.value = st.notes || ""; 
    
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
      
    // New Student Logic (Remains until first attendance)
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

  // ====== ALL STUDENTS MODAL (THE NEW LIST) ======
  openAllStudentsBtn.addEventListener("click", () => {
    // 1. Get all filled students
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    allStudentsTable.innerHTML = "";
    
    if(filled.length === 0) {
      allStudentsTable.innerHTML = `<tr><td colspan="5" class="mutedCenter">لا يوجد طلاب مسجلين</td></tr>`;
    } else {
      filled.forEach(st => {
        const tr = document.createElement("tr");
        const paid = st.paid || 0;
        let status = "—";
        let statusColor = "#555";
        
        // Status Logic
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
          <td>${escapeHtml(st.phone)}</td>
          <td>${paid}</td>
          <td style="color:${statusColor}; font-weight:bold;">${status}</td>
        `;
        // Make row clickable to open student
        tr.style.cursor = "pointer";
        tr.onclick = () => {
            allStudentsModal.classList.add("hidden");
            openStudent(st.id);
        };
        allStudentsTable.appendChild(tr);
      });
    }
    allStudentsModal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => allStudentsModal.classList.add("hidden"));

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

  // ====== BUTTON ACTIONS ======
  waBtn.addEventListener("click", () => {
    const phone = stPhone.value.trim().replace(/[^0-9]/g, ""); 
    if (phone.length < 10) return alert("رقم الهاتف غير صحيح");
    let finalPhone = phone.startsWith("20") ? phone : (phone.startsWith("01") ? "20"+phone.substring(1) : "20"+phone);
    window.open(`https://wa.me/${finalPhone}`, "_blank");
  });

  // DEPOSIT (FINANCIAL ONLY - No Auto Save of Name)
  addPaymentBtn.addEventListener("click", () => {
    if(!currentId) return alert("افتح طالب أولاً");
    
    // Check if user entered an amount
    const amountVal = parseInt(newPaymentInput.value);
    if(isNaN(amountVal) || amountVal === 0) return alert("أدخل مبلغ صحيح");

    const st = getStudent(currentId);
    
    // Update Money Only
    const oldTotal = parseInt(st.paid) || 0;
    st.paid = oldTotal + amountVal;
    
    const today = nowDateStr();
    revenueByDate[today] = (revenueByDate[today] || 0) + amountVal;

    setStudent(st);
    saveAll(); 

    // Feedback
    alert(`تم إيداع ${amountVal} ج بنجاح ✅\n(تذكر حفظ بيانات الطالب إذا قمت بتعديلها)`);
    updateStudentUI(currentId);
    renderReport(reportDate.value || today);
  });

  // Secure Fee Save
  saveFeeBtn.addEventListener("click", () => {
      const pass = prompt("🔐 أدخل كلمة مرور المسؤول لتعديل المصاريف:");
      if(pass !== ADMIN_PASS) return alert("كلمة المرور خطأ!");
      termFee = toInt(termFeeInp.value) || 0;
      saveAll();
      alert(`تم الحفظ: ${termFee}`);
      if(currentId) updateStudentUI(currentId); 
  });

  // Add New Student
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

  // Copy Report (FIXED: NUMBER ONLY)
  copyReportBtn.addEventListener("click", () => {
     const d = reportDate.value || nowDateStr();
     const count = reportCount.textContent; 
     const money = reportMoney.textContent; 
     
     // Count number of new students
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
        navigator.clipboard.writeText(text)
        .then(() => {
            const originalText = copyReportBtn.textContent;
            copyReportBtn.textContent = "تم النسخ ✅";
            setTimeout(() => copyReportBtn.textContent = originalText, 2000);
        })
        .catch(() => alert("النسخ غير مدعوم"));
     } else alert("النسخ غير مدعوم");
  });

  // Save Button (WITH SOUND)
  saveStudentBtn.addEventListener("click", () => {
    if (!currentId) return;
    const st = getStudent(currentId);
    st.name = stName.value.trim();
    st.className = stClass.value.trim();
    st.phone = stPhone.value.trim();
    st.notes = stNotes.value.trim();
    setStudent(st);
    
    playBeep("success"); // 🎉 Sound Effect
    showMsg(studentMsg, "تم الحفظ ✅", "ok");
    
    updateStudentUI(currentId);
    updateTopStats();
  });

  // Attendance Buttons
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

  // Excel
  exportExcelBtn.addEventListener("click", () => {
    if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
    const filled = Object.values(students).filter(st => isFilledStudent(st)).sort((a,b)=>a.id-b.id);
    const wsData = [["ID","الاسم","الصف","موبايل","مدفوع","ملاحظات","أيام الحضور"]];
    filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes, st.attendanceDates.length]));
    const wsAtt = [["التاريخ","ID","الاسم"]];
    Object.keys(attByDate).sort().forEach(d => attByDate[d].forEach(id => wsAtt.push([d, id, getStudent(id)?.name||""])));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "الطلاب");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAtt), "سجل الحضور");
    XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
  });

  importExcelInput.addEventListener("change", async () => {
    const f = importExcelInput.files[0]; if(!f) return;
    const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:""});
    const head = rows[0].map(x => String(x).toLowerCase().trim());
    const iID = head.findIndex(x=>x.includes("id"));
    if (iID === -1) { alert("خطأ: لا يوجد عمود ID"); return; }
    const iName = head.findIndex(x=>x.includes("اسم"));
    const iPhone = head.findIndex(x=>x.includes("موبايل"));
    const iPaid = head.findIndex(x=>x.includes("مدفوع"));
    const iNote = head.findIndex(x=>x.includes("ملاحظات"));
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
    saveAll(); alert("تم الاستيراد"); location.reload(); 
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
