/* =============================================
   Center System V-PRO (FINAL EDITION)
   - Kept: All Core Data Logic, Export, Import.
   - NEW: Bottom Navigation, Notebook, Cash Drawer Logic.
   - NEW: Toasts, Confetti, Undo Delete (5s), Live Feed.
   - NEW: Grouped Daily Report, Simple Modal Restore.
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
    const K_NOTEBOOK = "ca_notebook_v1"; // مفتاح حفظ النوته
  
    // Global State
    let students = {}; let deletedStudents = {}; let extraIds = [];              
    let attByDate = {}; let revenueByDate = {}; 
    let currentId = null; let termFee = 0; let currentLang = "ar";
    let currentPage = 1; let currentFilteredList = []; 
    let recentScans = []; 
  
    // Helpers
    const $ = (id) => document.getElementById(id);
    const on = (id, event, handler) => { const el=$(id); if(el) el.addEventListener(event, handler); };
    const nowDateStr = () => new Date().toISOString().split('T')[0];
    const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
    const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
  
    // ====== 2. UI PRO Features ======
    const showToast = (msg, type = "success") => {
        let container = $("toastContainer");
        if(!container) return;
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
        toast.innerHTML = `<span>⚠️ ${msg}</span> <button class="btn smallBtn" id="tempUndoBtn" style="margin-right:15px; padding:5px 10px;">تراجع ↩️</button>`;
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
        for(let i=0; i<35; i++) {
            const conf = document.createElement("div"); conf.className = "confetti";
            conf.style.left = Math.random() * 100 + "vw";
            conf.style.backgroundColor = ['#2ea44f', '#2f6bff', '#d69e2e', '#cf222e', '#9b59b6'][Math.floor(Math.random()*5)];
            conf.style.animationDuration = (Math.random() * 2 + 1) + "s";
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 3000);
        }
    };
  
    const updateLiveFeed = (st) => {
        recentScans.unshift({ name: st.name || "بدون اسم", id: st.id, cls: st.className || "عام", time: new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) });
        if(recentScans.length > 5) recentScans.pop();
        const feed = $("liveFeedBox");
        if(feed) {
            feed.innerHTML = recentScans.map(s => 
                `<div class="feed-item"><span class="feed-time">${s.time}</span> <b>${s.name}</b> <span class="badge" style="background:var(--primary);">${s.cls}</span> <span>#${s.id}</span></div>`
            ).join("");
        }
    };
  
    window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById('sec' + tabId);
    if(target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btnTab' + tabId);
    if(activeBtn) activeBtn.classList.add('active');
  };
  
    // Sounds
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext||window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            if(type==="money") { 
                osc.type = "sine"; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5);
            } else if(type==="success") {
                osc.frequency.setValueAtTime(587, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3);
            } else { 
                osc.type = "sawtooth"; osc.frequency.setValueAtTime(150, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2); osc.start(); osc.stop(ctx.currentTime + 0.2);
            }
        } catch(e) {}
    };
  
    const makeEmptyStudent = (id) => ({ id: id, name: "", className: "", phone: "", paid: 0, notes: "", joinedDate: nowDateStr(), attendanceDates: [] });
  
    // ====== 3. Core Logic & Storage ======
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
  
      const savedTheme = localStorage.getItem(K_THEME) || "classic"; applyTheme(savedTheme);
      const savedBg = localStorage.getItem(K_BG_IMAGE); if(savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;
      
      if($("termFeeInp")) $("termFeeInp").value = termFee > 0 ? termFee : "";
      if($("centerNotebook")) $("centerNotebook").value = localStorage.getItem(K_NOTEBOOK) || "";
  
      updateTopStats();
    };
  
    const ensureBase500 = () => {
      for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i); }
      saveAll();
    };
  
    const applyTheme = (theme) => {
        document.body.className = ""; 
        if(theme === "dark") document.body.classList.add("theme-dark");
        else if(theme === "glass") document.body.classList.add("theme-glass");
        localStorage.setItem(K_THEME, theme);
        if($("themeSelector")) $("themeSelector").value = theme;
    };
  
    // ====== 4. Auth & Permissions ======
    const checkAuth = () => {
        const isAuth = localStorage.getItem(K_AUTH);
        if(isAuth === "1") {
            currentUserRole = localStorage.getItem(K_ROLE) || "admin";
            $("loginBox").style.display = "none"; $("loginBox").classList.add("hidden");
            $("appBox").style.display = "block"; $("appBox").classList.remove("hidden");
            showApp();
        } else {
            $("loginBox").style.display = "block"; $("loginBox").classList.remove("hidden");
            $("appBox").style.display = "none"; $("appBox").classList.add("hidden");
        }
    };
  
    const applyPermissions = () => {
        const isAdmin = (currentUserRole === "admin");
        document.querySelectorAll(".adminOnly").forEach(el => {
            if(isAdmin) el.classList.remove("hidden"); else el.classList.add("hidden");
       if(!isAdmin) {
            if($("deleteStudentBtn")) $("deleteStudentBtn").classList.add("hidden");
            if($("correctPayBtn")) $("correctPayBtn").classList.add("hidden");
        }
  
    const doLogin = () => {
        const u = $("user").value.trim(); const p = $("pass").value.trim();
        if(u === ADMIN_USER && p === ADMIN_PASS) { localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); checkAuth(); } 
        else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) { localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "assistant"); checkAuth(); } 
        else { showToast("خطأ في بيانات الدخول!", "err"); playSound("error"); }
    };
  
    const doLogout = () => { localStorage.removeItem(K_AUTH); localStorage.removeItem(K_ROLE); location.reload(); };
  
    // ====== 5. Main UI ======
    const showApp = () => {
        applyPermissions();
        $("reportDate").value = nowDateStr();
        renderReport(nowDateStr());
        updateTopStats();
        window.switchTab('Home'); 
        setTimeout(checkQR, 500); 
    };
  
    const updateTopStats = () => {
        const filledCount = Object.values(students).filter(s => s.name || s.paid>0).length;
        const todayCount = (attByDate[nowDateStr()] || []).length;
        const revenue = revenueByDate[nowDateStr()] || 0;
        
        if($("totalStudentsCount")) $("totalStudentsCount").textContent = filledCount;
        if($("todayCountTop")) $("todayCountTop").textContent = todayCount;
        if($("todayRevenue")) $("todayRevenue").textContent = revenue + " ج";
    };
  
    // ====== 6. Student Operations ======
    const updateStudentUI = (id) => {
      currentId = id; const st = students[id];
      if (!st) return; 
  
      $("studentIdPill").textContent = `ID: ${id}`;
      $("stName").value = st.name || ""; $("stClass").value = st.className || ""; 
      $("stPhone").value = st.phone || ""; $("stNotes").value = st.notes || ""; 
      
      const paid = st.paid || 0; const req = termFee;
      let percent = 0; let statusClass = "";
      
      if(req > 0) {
          percent = Math.min((paid/req)*100, 100);
          if(paid >= req) statusClass = "status-border-green";
          else if(paid > 0) statusClass = "status-border-yellow";
          else statusClass = "status-border-red";
      }
      
      const card = document.querySelector(".studentCard");
      if(card) {
          card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
          if(statusClass) card.classList.add(statusClass);
      }
  
      if($("stTotalPaid")) {
          $("stTotalPaid").value = paid + " ج";
          $("stTotalPaid").style.background = req > 0 ? `linear-gradient(to left, #d4edda ${percent}%, #f0f2f5 ${percent}%)` : "#f0f2f5";
      }
  
      $("newPaymentInput").value = ""; $("newNoteInp").value = "";
  
      const today = nowDateStr(); const dates = st.attendanceDates || []; const isPresent = dates.includes(today);
      
      if(isPresent) { $("todayStatus").textContent = "✅ حاضر"; $("todayStatus").style.color = "green"; $("stAvatar").classList.add("present"); } 
      else { $("todayStatus").textContent = "✖ غياب"; $("todayStatus").style.color = "red"; $("stAvatar").classList.remove("present"); }
  
      $("daysCount").innerHTML = `🔥 ${dates.length} أيام`;
      $("attList").innerHTML = dates.slice().reverse().slice(0,20).map(d=>`<div class="item">${prettyDate(d)}</div>`).join("");
      if(dates.length === 0 && st.name) $("newBadge").classList.remove("hidden"); else $("newBadge").classList.add("hidden");
    };
  
    const addAttendance = (id, dateStr) => {
        const st = students[id];
        if(!st) return {ok:false, msg:"ID غير مسجل"};
        if(!st.attendanceDates.includes(dateStr)) {
            st.attendanceDates.push(dateStr);
            if(!attByDate[dateStr]) attByDate[dateStr] = [];
            if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
            saveAll(); playSound("success"); updateLiveFeed(st);
            return {ok:true, msg: "تم تسجيل الحضور ✅"};
        }
        playSound("error"); return {ok:false, msg: "حاضر مسبقاً ⚠️"};
    };
  
    const removeAttendance = (id, dateStr) => {
      const st = students[id]; if(!st) return;
      st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
      if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
      saveAll();
    };
  
    // ====== 7. Lists & Tables ======
    const renderList = () => {
        const filterGroup = $("filterClass").value; 
        const filterStatus = $("filterStatus").value; 
        const filterAttend = $("filterAttend").value; 
        
        const sel = $("filterClass");
        if(sel.options.length <= 1) { 
            const allClasses = new Set();
            Object.values(students).forEach(s => { if(s.className) allClasses.add(s.className); });
            allClasses.forEach(c => { const opt = document.createElement("option"); opt.value = c; opt.innerText = c; sel.appendChild(opt); });
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
  
        const q = $("tableSearchInp").value.toLowerCase();
        if(q) { currentFilteredList = currentFilteredList.filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q)); }
  
        currentPage = 1; renderPage();
    };
  
    const renderPage = () => {
        const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = currentFilteredList.slice(start, end);
        const today = nowDateStr();
  
        pageItems.forEach(s => {
            const tr = document.createElement("tr");
            let pBar = `<div style="width:100%; background:#eee; height:5px; border-radius:3px; margin-top:4px;"><div style="width:${termFee>0?Math.min((s.paid/termFee)*100,100):0}%; background:var(--success); height:100%; border-radius:3px;"></div></div>`;
            const attendTxt = (s.attendanceDates||[]).includes(today) ? "✅" : "➖";
  
            tr.innerHTML = `<td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td>
                            <td>${s.id}</td><td><b>${s.name}</b></td>
                            <td><span class="badge" style="background:var(--primary);">${s.className}</span></td>
                            <td>${s.paid} ج ${pBar}</td><td>${attendTxt}</td>`;
            tr.addEventListener("click", (e) => { if(e.target.type !== "checkbox") { window.switchTab('Home'); window.extOpen(s.id); } });
            tb.appendChild(tr);
        });
  
        $("pageIndicator").textContent = `صفحة ${currentPage} / ${Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1}`;
        $("prevPageBtn").disabled = currentPage === 1;
        $("nextPageBtn").disabled = end >= currentFilteredList.length;
    };
  
    // المودال القديم
    const renderSimpleTable = () => {
        const tb = $("simpleStudentsTable").querySelector("tbody"); if(!tb) return;
        tb.innerHTML = "";
        const filled = Object.values(students).filter(s => s.name || s.paid > 0);
        filled.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${s.id}</td><td><b>${s.name}</b></td><td>${s.className}</td>`;
            tr.style.cursor = "pointer";
            tr.onclick = () => { $("allStudentsModal").classList.add("hidden"); window.switchTab('Home'); window.extOpen(s.id); };
            tb.appendChild(tr);
        });
    };
  
    const handleBulk = () => {
        const boxes = document.querySelectorAll(".stCheckbox:checked");
        if($("selectedCount")) $("selectedCount").textContent = boxes.length;
        if($("bulkActionBar")) { if(boxes.length > 0) $("bulkActionBar").classList.remove("hidden"); else $("bulkActionBar").classList.add("hidden"); }
    };
  
    // ====== 8. Bindings ======
    on("loginBtn", "click", doLogin); on("logoutBtn", "click", doLogout);
    on("togglePass", "click", () => { const p=$("pass"); p.type = p.type==="password"?"text":"password"; });
  
    on("btnTabHome", "click", () => window.switchTab('Home'));
    on("btnTabStudents", "click", () => { window.switchTab('Students'); renderList(); });
    on("btnTabAdmin", "click", () => window.switchTab('Admin'));
  
    on("themeSelector", "change", (e) => applyTheme(e.target.value));
    
    // إعدادات المطبخ
    on("saveFeeBtn", "click", () => {
        if(prompt("كلمة مرور الإدارة:") === ADMIN_PASS) {
            termFee = toInt($("termFeeInp").value) || 0; saveAll(); showToast("تم حفظ المصاريف ✅"); if(currentId) updateStudentUI(currentId);
        } else showToast("كلمة مرور خاطئة ❌", "err");
    });
  
    on("saveNotebookBtn", "click", () => {
        const text = $("centerNotebook").value;
        localStorage.setItem(K_NOTEBOOK, text);
        showToast("تم حفظ النوته بنجاح 📝");
        playSound("success");
    });
  
    on("saveFinanceBtn", "click", () => {
        const exp = toInt($("dailyExpenses").value) || 0;
        const drawer = toInt($("cashInDrawer").value) || 0;
        const rev = revenueByDate[nowDateStr()] || 0;
        
        const expected = rev - exp;
        const diff = drawer - expected;
        
        if(diff === 0) showToast(`الدرج مظبوط تماماً ✅ (الصافي: ${expected} ج)`, "success");
        else if(diff > 0) showToast(`في زيادة في الدرج: ${diff} ج ⚠️`, "warning");
        else showToast(`في عجز في الدرج: ${Math.abs(diff)} ج ❌`, "err");
    });
  
    // البحث والسكان
    on("quickAttendBtn", "click", () => {
        const id = toInt($("quickAttendId").value); const res = addAttendance(id, nowDateStr());
        showToast(res.msg, res.ok?"success":"warning");
        updateStudentUI(id); renderReport(nowDateStr());
        $("quickAttendId").value = ""; $("quickAttendId").focus();
    });
  
    on("openBtn", "click", () => window.extOpen(toInt($("openId").value)));
    on("searchAny", "input", (e) => {
        const q = e.target.value.toLowerCase(); const res = $("searchMsg");
        if(!q) { if(res) res.style.display="none"; return; }
        const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && String(s.phone).includes(q))).slice(0,5);
        if(res) {
            res.style.display = "block";
            res.innerHTML = found.map(s => `<div class="item" onclick="window.extOpen(${s.id})"><b>${s.name}</b> (${s.id})</div>`).join("");
        }
    });
  
    on("addNewBtn", "click", () => {
        const id = toInt($("newId").value);
        if(!id || !!students[String(id)]) { showToast("الكود مسجل مسبقاً ❌", "err"); return; }
        students[String(id)] = makeEmptyStudent(id);
        if(id<BASE_MIN_ID || id>BASE_MAX_ID) extraIds.push(id);
        saveAll(); window.extOpen(id); showToast("تم إضافة الطالب بنجاح ✅");
    });
  
    // أزرار الطالب المفتوح
    on("saveStudentBtn", "click", () => {
        if(!currentId) return; const s = students[currentId];
        s.name = $("stName").value; s.className = $("stClass").value; s.phone = $("stPhone").value;
        saveAll(); playSound("success"); showToast("تم حفظ البيانات 💾"); updateTopStats();
    });
  
    on("addNoteBtn", "click", () => {
        if(!currentId) return; const txt = $("newNoteInp").value.trim(); if(!txt) return;
        const now = new Date(); const stamp = `[${now.toISOString().split('T')[0]}]`;
        students[currentId].notes = `${stamp} : ${txt}\n${students[currentId].notes || ""}`;
        saveAll(); updateStudentUI(currentId); showToast("تم إضافة الملحوظة 📝");
    });
  
    on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
    on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); showToast("تم تسجيل الغياب ✖", "warning"); }});
  
    on("addPaymentBtn", "click", () => {
        if(!currentId) return; const v = parseInt($("newPaymentInput").value); if(!v) return;
        const st = students[currentId]; st.paid = (st.paid||0) + v;
        revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + v;
        saveAll(); playSound("money"); 
        
        if(termFee > 0 && st.paid >= termFee) { fireConfetti(); showToast(`اكتملت المصاريف بنجاح! 💰`); }
        else showToast(`تم إيداع ${v} ج 💰`);
  
        updateStudentUI(currentId); renderReport(nowDateStr());
        if(st.phone) {
            const msg = `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} جنيه في حسابك بنجاح ✅\nإجمالي المدفوع: ${st.paid} جنيه.\n\n-- إدارة السنتر --`;
            // تأخير فتح الواتساب ثانية عشان العميل يلحق يشوف الرسالة وتأثير الاحتفال
            setTimeout(() => { window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank'); }, 1000);
        }
    });
  
    on("correctPayBtn", "click", () => {
        if(!currentId) return; const v = parseInt(prompt("قيمة الخصم:")); if(!v) return;
        students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
        revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
        saveAll(); showToast("تم الخصم بنجاح ⚠️", "warning"); updateStudentUI(currentId); renderReport(nowDateStr());
    });
  
  on("deleteStudentBtn", "click", () => { 
      if(!currentId) return;
      if(!confirm("⚠️ هل أنت متأكد أنك تريد حذف هذا الطالب نهائياً؟")) return;
      const targetId = currentId; const st = students[targetId];
      const backupSt = JSON.parse(JSON.stringify(st));
      let deducted = 0;
      if(st.paid > 0 && confirm(`هل تريد خصم مدفوعات الطالب (${st.paid} ج) من إيراد اليوم؟`)) deducted = st.paid;
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
    on("waBtn", "click", () => { const ph = $("stPhone").value; if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); else showToast("لا يوجد رقم هاتف!", "err"); });
  
    // ====== 9. Tables, Pagination, Bulk ======
    if($("filterClass")) $("filterClass").addEventListener("change", renderList);
    if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);
    if($("filterAttend")) $("filterAttend").addEventListener("change", renderList);
    if($("tableSearchInp")) $("tableSearchInp").addEventListener("input", renderList);
    on("prevPageBtn", "click", () => { if(currentPage>1) { currentPage--; renderPage(); }});
    on("nextPageBtn", "click", () => { currentPage++; renderPage(); });
  
    document.addEventListener("change", (e) => {
        if(e.target.classList.contains("stCheckbox")) handleBulk();
        if(e.target.id === "selectAllCheckbox") { document.querySelectorAll(".stCheckbox").forEach(c => c.checked = e.target.checked); handleBulk(); }
    });
  
    on("bulkAttendBtn", "click", () => {
        let count = 0; document.querySelectorAll(".stCheckbox:checked").forEach(b => { if(addAttendance(b.dataset.id, nowDateStr()).ok) count++; });
        showToast(`تم تسجيل حضور ${count} طالب 👥`); renderList(); handleBulk();
    });
    
    on("bulkAbsentBtn", "click", () => {
        document.querySelectorAll(".stCheckbox:checked").forEach(b => removeAttendance(b.dataset.id, nowDateStr()));
        showToast("تم تسجيل الغياب ✖", "warning"); renderList();
    });
// ====== 10. Reports & WhatsApp Copy (V-PRO Updated) ======
    const renderReport = (d) => {
        const list = $("reportList"); if(!list) return;
        const ids = attByDate[d] || [];
        if($("reportDateLabel")) $("reportDateLabel").textContent = prettyDate(d);
        if($("reportCount")) $("reportCount").textContent = ids.length;
        if($("reportMoney")) $("reportMoney").textContent = (revenueByDate[d]||0) + " ج";
        
        if(!ids.length) { 
            list.innerHTML = "<div class='mutedCenter' style='padding:20px;'>لا يوجد حضور مسجل لهذا اليوم</div>"; 
            return; 
        }
        
        let groups = {};
        let groupMoney = {}; 

        ids.forEach(id => {
            const st = students[id];
            let c = (st && st.className) ? st.className.trim() : "عام";
            if(!groups[c]) { groups[c] = []; groupMoney[c] = 0; }
            groups[c].push(id);
            groupMoney[c] += (st && st.paid) ? st.paid : 0; 
        });
  
        const getTagColor = (str) => {
            const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return colors[Math.abs(hash) % colors.length];
        };

        let html = "";
        for(let g in groups) {
            const gColor = getTagColor(g);
            html += `
            <div style="background:#fff; padding:15px; margin-top:12px; border-radius:12px; border-right: 6px solid ${gColor}; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <b style="color:${gColor}; font-size:1.1em;">🏷️ ${g}</b> 
                    <span style="font-weight:bold; color:#2c3e50; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:5px;">💰 ${groupMoney[g]} ج</span>
                </div>
                <div style="font-size: 0.85em; color:#7f8c8d; margin-bottom:10px;">عدد الحضور: ${groups[g].length} طالب</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${groups[g].map(id => `
                        <span class="badge" 
                              style="cursor:pointer; background:#fff; border:1px solid ${gColor}; color:${gColor}; font-size:12px; transition:0.2s;" 
                              onmouseover="this.style.background='${gColor}'; this.style.color='#fff'" 
                              onmouseout="this.style.background='#fff'; this.style.color='${gColor}'" 
                              onclick="window.extOpen('${id}')">#${id}</span>
                    `).join("")}
                </div>
            </div>`;
        }
        list.innerHTML = html;
    };
  
    on("reportBtn", "click", () => renderReport($("reportDate").value));
  
    on("copyReportBtn", "click", () => {
        const today = $("reportDate").value || nowDateStr();
        const ids = attByDate[today] || []; const rev = revenueByDate[today] || 0;
        
        let txt = `📊 *تقرير السنتر: ${prettyDate(today)}*\n\n`;
        let groups = {};
        ids.forEach(id => { 
            let c = (students[id] && students[id].className) ? students[id].className.trim() : "عام"; 
            if(!groups[c]) groups[c] = 0; groups[c]++; 
        });
        
        for(let g in groups) { txt += `📘 ${g}: ${groups[g]} طالب\n`; }
        txt += `\n👥 إجمالي الحضور: ${ids.length}\n💰 إجمالي الإيراد: ${rev} ج\n\n-- Center V-PRO --`;
        
        navigator.clipboard.writeText(txt).then(() => showToast("تم النسخ للواتساب بنجاح 📋"));
    });
        
        let txt = `📊 *تقرير السنتر: ${prettyDate(today)}*\n\n`;
        let groups = {};
        ids.forEach(id => { 
            let c = (students[id] && students[id].className) ? students[id].className.trim() : "عام"; 
            if(!groups[c]) groups[c] = 0; groups[c]++; 
        });
        
        for(let g in groups) { txt += `📘 ${g}: ${groups[g]} طالب\n`; }
        txt += `\n👥 إجمالي الحضور: ${ids.length}\n💰 إجمالي الإيراد: ${rev} ج\n\n-- Center V-PRO --`;
        
        navigator.clipboard.writeText(txt).then(() => showToast("تم النسخ للواتساب بنجاح 📋"));
    });
  
    // ====== 11. Modals, Export & Danger Zone ======
    on("openAllStudentsBtn", "click", () => { renderSimpleTable(); $("allStudentsModal").classList.remove("hidden"); });
    on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));
  
    on("exportExcelBtn", "click", () => {
        if (typeof XLSX === "undefined") return showToast("مكتبة الإكسيل غير موجودة!", "err");
        const filled = Object.values(students).filter(st => st.name || st.paid>0).sort((a,b)=>a.id-b.id);
        const wsData = [["كود", "الاسم", "المجموعة", "رقم الموبايل", "المدفوع", "ملاحظات", "سجل الحضور"]];
        filled.forEach(st => { wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes, (st.attendanceDates||[]).join(", ")]); });
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "الطلاب");
        XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
        playSound("success"); showToast("تم تصدير ملف الإكسيل 📊");
    });
    on("importExcelInput", "change", async () => {
        const f = $("importExcelInput").files[0]; if(!f) return;
        const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
        if(!confirm("تحذير: هذا سيمسح البيانات الحالية. متأكد؟")) return;
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        students = {}; attByDate = {}; revenueByDate = {}; extraIds = [];
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) students[String(i)] = makeEmptyStudent(i);
        
        rows.forEach(row => {
            const id = parseInt(row["كود"] || row["ID"]);
            if(id) {
                let st = makeEmptyStudent(id);
                st.name = row["الاسم"] || row["Name"] || ""; st.className = row["المجموعة"] || row["Class"] || "";
                st.phone = row["رقم الموبايل"] || row["Phone"] || ""; st.paid = parseInt(row["المدفوع"] || row["Paid"] || 0);
                st.notes = row["ملاحظات"] || row["Notes"] || "";
                let histStr = row["سجل الحضور"] || row["History"] || Object.values(row)[6] || "";
                if(histStr && typeof histStr==='string') {
                    const dates = histStr.split(",").map(s => s.trim()).filter(s => s); st.attendanceDates = dates;
                    dates.forEach(d => { if(!attByDate[d]) attByDate[d] = []; if(!attByDate[d].includes(id)) attByDate[d].push(id); });
                }
                students[String(id)] = st; if(id > BASE_MAX_ID) extraIds.push(id);
            }
        });
        saveAll(); showToast("تم استيراد البيانات ✅"); setTimeout(() => location.reload(), 1000);
    });
  
    on("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
    on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
    on("emptyBinBtn", "click", () => { if(confirm("حذف نهائي؟")) { deletedStudents={}; saveAll(); renderBinList(); }});
  
    const renderBinList = () => {
        const bl = $("binList"); if(!bl) return; const ids = Object.keys(deletedStudents);
        if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter" style="padding:20px;">السلة فارغة</div>`; return; }
        bl.innerHTML = ids.map(id => { const s = deletedStudents[id]; return `<div class="item flexBetween"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${s.id})">استرجاع</button></div>`; }).join("");
    };
  
    window.restoreSt = (id) => {
        if(students[id] && (students[id].name || students[id].paid>0)) { if(!confirm("مكان الطالب مشغول حالياً. الكتابة فوقه؟")) return; }
        const st = deletedStudents[id];
        if(st.paid > 0 && confirm(`استرجاع مصاريف الطالب (${st.paid} ج) للإيرادات؟`)) { revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + st.paid; }
        students[id] = st; delete deletedStudents[id]; saveAll(); renderBinList(); updateTopStats();
        showToast("تم استرجاع الطالب ✅"); window.switchTab('Home'); window.extOpen(id);
    };
  
    on("resetTermBtn", "click", () => { 
        if(prompt("باسورد الأدمن:") === ADMIN_PASS && confirm("تصفير الفلوس والغياب؟")) { 
            for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; } 
            attByDate={}; revenueByDate={}; saveAll(); alert("تم تصفير الترم ✅"); location.reload(); 
        }
    });
    
    on("resetBtn", "click", () => { 
        if(prompt("باسورد الأدمن:") === ADMIN_PASS && confirm("مسح كل البيانات (ضبط مصنع)؟")) { localStorage.clear(); location.reload(); }
    });
  
    // Global Access
    window.extOpen = (id) => { 
        $("searchAny").value = ""; if($("searchMsg")) $("searchMsg").style.display="none"; 
        updateStudentUI(id); 
        const card = document.querySelector(".studentCard"); if(card) card.scrollIntoView({behavior:"smooth", block:"start"}); 
   const existsId = (id) => !!students[String(id)];
    const checkQR = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const qrId = toInt(urlParams.get("id"));
      if (qrId && existsId(qrId)) { addAttendance(qrId, nowDateStr()); window.extOpen(qrId); window.history.replaceState(null, null, window.location.pathname); }
    };
  
    // Init
    loadAll(); ensureBase500(); checkAuth();
});
