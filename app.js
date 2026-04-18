/* =============================================
   Center System V-PRO MAX (OFFICIAL FINAL)
   - الكامل: ترجمة، ماليات، مجموعات، ستريك، باسورد.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    console.log("System V-PRO MAX: Starting full engine...");

    // ====== 1. الإعدادات والثوابت ======
    const ADMIN_USER = "Admin"; 
    const ADMIN_PASS = "####1111"; 
    const ASST_USER  = "User";  
    const ASST_PASS  = "11112222"; 
    
    let currentUserRole = "admin";
    const BASE_MIN_ID = 1; 
    const BASE_MAX_ID = 500; 
    const ITEMS_PER_PAGE = 50;

    // مفاتيح التخزين (LocalStorage)
    const K_AUTH = "ca_auth_v2";
    const K_ROLE = "ca_role_v1";
    const K_STUDENTS = "ca_students_v6";
    const K_EXTRA_IDS = "ca_extra_ids_v6";
    const K_ATT_BY_DATE = "ca_att_by_date_v6";
    const K_REVENUE = "ca_revenue_v6";
    const K_DELETED = "ca_deleted_v9";
    const K_THEME = "ca_theme_v1";
    const K_LANG = "ca_lang";
    const K_LAST_BACKUP = "ca_last_backup";
    const K_BG_IMAGE = "ca_bg_image";
    const K_NOTEBOOK = "ca_notebook_v1";
    const K_GROUP_FEES = "ca_group_fees_v1";
    const K_EXPENSES = "ca_expenses_v1";

    // الحالة العامة للبرنامج
    let students = {}; 
    let deletedStudents = {}; 
    let extraIds = []; 
    let attByDate = {}; 
    let revenueByDate = {}; 
    let groupFees = {}; 
    let expensesByDate = {};
    
    let currentId = null;
    let currentLang = localStorage.getItem(K_LANG) || "ar";
    let currentPage = 1;
    let currentFilteredList = [];
    let recentScans = [];
    let isRevHidden = false;
    let passSuccessCallback = null;

    // ====== 2. دوال المساعدة (Helpers) ======
    const $ = (id) => document.getElementById(id);
    const on = (id, event, handler) => { 
        const el = $(id); 
        if(el) el.addEventListener(event, handler); 
    };
    const nowDateStr = () => new Date().toISOString().split('T')[0];
    const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
    const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? 0 : n; };

    // ====== 3. القاموس الشامل (Translation System) ======
    const dict = {
        "login_title": { ar: "دخول لوحة السنتر", en: "Center Login Dashboard" },
        "login_desc": { ar: "الدخول للمسؤول فقط", en: "Authorized personnel only" },
        "login_btn": { ar: "دخول", en: "Login" },
        "brand_name": { ar: "لوحة السنتر V-PRO", en: "Center V-PRO Dashboard" },
        "stat_students": { ar: "👥 مسجلين:", en: "👥 Enrolled:" },
        "stat_attend": { ar: "✅ حضور:", en: "✅ Attend:" },
        "stat_revenue": { ar: "💰 إيراد:", en: "💰 Revenue:" },
        "btn_logout": { ar: "خروج 🚪", en: "Logout 🚪" },
        "quick_title": { ar: "سريع (QR)", en: "Quick Record (QR)" },
        "btn_record": { ar: "سجل حضور", en: "Record Attendance" },
        "lbl_last_scan": { ar: "آخر حضور تم تسجيله ⏱️", en: "Recent Activity ⏱️" },
        "wait_scan": { ar: "بانتظار مسح كود...", en: "Waiting for scan activity..." },
        "search_title": { ar: "بحث شامل", en: "Global Search" },
        "btn_open": { ar: "فتح", en: "Open Profile" },
        "search_plc": { ar: "الاسم / الرقم / الكود...", en: "Name / Phone / ID Number..." },
        "add_title": { ar: "+ إضافة طالب جديد", en: "+ Register New Student" },
        "btn_add_open": { ar: "إضافة وفتح", en: "Add & View" },
        "st_details": { ar: "بيانات الطالب", en: "Student Information" },
        "badge_new": { ar: "جديد", en: "NEW" },
        "rank_normal": { ar: "🟢 عادي", en: "🟢 Normal" },
        "rank_warn": { ar: "⚠️ إنذار", en: "⚠️ Warning" },
        "lbl_name": { ar: "الاسم الكامل", en: "Full Name" },
        "lbl_class": { ar: "الصف / المجموعة", en: "Class / Group Name" },
        "lbl_phone": { ar: "رقم الموبايل", en: "Phone Number" },
        "lbl_finance": { ar: "نظام المصاريف والتحصيل", en: "Tuition & Finance System" },
        "lbl_total_paid": { ar: "💰 إجمالي المدفوع:", en: "💰 Total Paid:" },
        "btn_discount": { ar: "خصم", en: "Discount" },
        "lbl_remaining": { ar: "⚠️ المتبقي:", en: "⚠️ Remaining:" },
        "lbl_new_pay": { ar: "➕ دفعة جديدة:", en: "➕ New Payment:" },
        "btn_deposit": { ar: "إيداع", en: "Deposit" },
        "lbl_notes": { ar: "ملاحظات (مؤرخة)", en: "Dated Notes" },
        "note_plc": { ar: "إضافة ملحوظة...", en: "Add a new note..." },
        "btn_add_note": { ar: "إضافة", en: "Add Note" },
        "btn_save_st": { ar: "حفظ البيانات 💾", en: "Save Profile 💾" },
        "btn_mark_present": { ar: "✅ حضور", en: "✅ Mark Present" },
        "btn_mark_absent": { ar: "✖ غياب", en: "✖ Mark Absent" },
        "btn_delete": { ar: "🗑️ حذف", en: "🗑️ Delete Student" },
        "lbl_history": { ar: "سجل تواريخ الحضور", en: "Attendance Log History" },
        "adv_search_title": { ar: "قائمة البحث المتقدم", en: "Advanced Students List" },
        "search_tbl_plc": { ar: "🔍 ابحث في الجدول...", en: "🔍 Search table records..." },
        "flt_all_classes": { ar: "كل المجموعات", en: "All Groups" },
        "flt_all_fin": { ar: "كل الحالات المالية", en: "All Finance Status" },
        "flt_paid": { ar: "✅ خالص", en: "✅ Paid" },
        "flt_partial": { ar: "⚠️ جزء", en: "⚠️ Partial" },
        "flt_unpaid": { ar: "🔴 لم يدفع", en: "🔴 Unpaid" },
        "flt_all_att": { ar: "كل الحضور", en: "All Attendance" },
        "flt_att_only": { ar: "✅ الحضور فقط", en: "✅ Present" },
        "flt_abs_only": { ar: "✖ الغياب فقط", en: "✖ Absent" },
        "lbl_selected": { ar: "تم تحديد", en: "Selected" },
        "tbl_name": { ar: "الاسم", en: "Student Name" },
        "tbl_class": { ar: "المجموعة", en: "Class" },
        "tbl_paid": { ar: "المدفوع", en: "Paid Amount" },
        "tbl_today": { ar: "حضور اليوم", en: "Today" },
        "btn_prev": { ar: "السابق", en: "Previous" },
        "btn_next": { ar: "التالي", en: "Next" },
        "fin_summary_title": { ar: "📊 الملخص المالي العام", en: "📊 Financial Summary" },
        "fin_today_net": { ar: "صافي ربح اليوم", en: "Today's Net Profit" },
        "fin_month_net": { ar: "صافي ربح الشهر الحالي", en: "Monthly Net Profit" },
        "exp_title": { ar: "🔻 تسجيل مصروفات اليوم", en: "🔻 Record Daily Expenses" },
        "exp_amt_plc": { ar: "المبلغ (مثال: 150)", en: "Amount (e.g. 150)" },
        "exp_rsn_plc": { ar: "سبب الصرف (مثال: ورق)", en: "Reason (e.g. Papers)" },
        "btn_save_exp": { ar: "خصم وحفظ", en: "Save & Deduct" },
        "report_title": { ar: "تقرير الحضور والماليات", en: "Attendance & Finance Report" },
        "btn_copy_wa": { ar: "نسخ التقرير للمدير 📋", en: "Copy for Manager 📋" },
        "btn_view": { ar: "عرض", en: "View Report" },
        "badge_date": { ar: "التاريخ:", en: "Date:" },
        "badge_count": { ar: "العدد:", en: "Total Students:" },
        "badge_rev": { ar: "إيراد:", en: "Gross Revenue:" },
        "badge_exp": { ar: "مصروف:", en: "Total Expenses:" },
        "chart_title": { ar: "📈 لوحة أرباح الأسبوع", en: "📈 Weekly Performance Chart" },
        "settings_title": { ar: "⚙️ إعدادات النظام (V-PRO)", en: "⚙️ System Configuration" },
        "note_title": { ar: "📝 مفكرة السنتر السريعة", en: "📝 Quick Notebook" },
        "note_plc_main": { ar: "اكتب ملاحظاتك هنا...", en: "Type your notes here..." },
        "set_data_title": { ar: "💾 البيانات والنسخ الاحتياطي", en: "💾 Data Management" },
        "btn_export_ex": { ar: "📥 تصدير البيانات (Excel)", en: "📥 Export to Excel" },
        "btn_import_ex": { ar: "📤 استيراد بيانات (Excel)", en: "📤 Import from Excel" },
        "btn_recycle": { ar: "🗑️ سلة المحذوفات", en: "🗑️ Recycle Bin" },
        "set_ui_title": { ar: "🎨 المظهر والتخصيص", en: "🎨 UI Customization" },
        "lbl_theme": { ar: "ثيم البرنامج:", en: "Active Theme:" },
        "theme_cls": { ar: "🔵 كلاسيك", en: "🔵 Classic Light" },
        "theme_dark": { ar: "🌑 ليلي", en: "🌑 Dark Night" },
        "theme_glass": { ar: "🧊 زجاجي", en: "🧊 Modern Glass" },
        "btn_change_bg": { ar: "🖼️ تغيير الخلفية", en: "🖼️ Change Background" },
        "btn_change_lang": { ar: "🌐 تغيير اللغة (Ar / En)", en: "🌐 Switch Language" },
        "set_fin_title": { ar: "💰 إعدادات مالية", en: "💰 Group Pricing" },
        "btn_group_fees": { ar: "⚙️ إدارة مصاريف المجموعات", en: "⚙️ Manage Group Fees" },
        "set_danger_title": { ar: "⚠️ منطقة الخطر", en: "⚠️ Danger Zone" },
        "btn_reset_term": { ar: "🔄 تصفير الترم", en: "🔄 Reset All Term Data" },
        "btn_factory_reset": { ar: "❌ مسح النظام بالكامل", en: "❌ Full System Reset" },
        "nav_settings": { ar: "الإعدادات", en: "Settings" },
        "nav_revenue": { ar: "الماليات", en: "Finances" },
        "nav_home": { ar: "الرئيسية", en: "Home" },
        "nav_students": { ar: "الطلاب", en: "Students List" },
        "pass_req_title": { ar: "مطلوب صلاحية الإدارة", en: "Admin Authorization Required" },
        "pass_req_desc": { ar: "يرجى إدخال كلمة مرور الأدمن للمتابعة.", en: "Please enter master password to proceed." },
        "btn_cancel": { ar: "إلغاء", en: "Cancel" },
        "btn_confirm": { ar: "تأكيد ✔️", en: "Confirm ✔️" },
        "modal_all_st": { ar: "قائمة الطلاب المسجلين", en: "Registered Students" },
        "btn_empty_bin": { ar: "إفراغ السلة نهائياً", en: "Empty Bin Permanently" },
        "modal_today_att": { ar: "👥 حضور اليوم مفصل", en: "👥 Detailed Today's List" },
        "btn_close": { ar: "إغلاق ✖", en: "Close Window ✖" },
        "modal_grp_fees": { ar: "⚙️ تخصيص مصاريف المجموعات", en: "⚙️ Group Fee Management" },
        "grp_fees_desc": { ar: "تم جلب المجموعات تلقائياً من بيانات الطلاب.", en: "System auto-detected these groups from student records." },
        "btn_save_changes": { ar: "حفظ التعديلات 💾", en: "Save All Changes 💾" },
        
        // رسائل السيستم
        "msg_saved": { ar: "تم الحفظ بنجاح ✅", en: "Progress saved successfully ✅" },
        "msg_err_pass": { ar: "كلمة مرور خاطئة ❌", en: "Wrong Password Attempt ❌" },
        "msg_id_exist": { ar: "هذا الكود مسجل لمستخدم آخر! ❌", en: "This ID is already taken! ❌" },
        "msg_added": { ar: "تم إضافة الطالب بنجاح ✅", en: "New student registered successfully ✅" },
        "msg_discount": { ar: "تم تطبيق الخصم ⚠️", en: "Discount applied to student ⚠️" },
        "msg_deposit": { ar: "تم إيداع المبلغ بنجاح 💰", en: "Amount deposited successfully 💰" },
        "msg_complete": { ar: "اكتملت المصاريف بنجاح! احتفال 🎊💰", en: "Fees completed! Milestone reached 🎊💰" },
        "msg_att_ok": { ar: "تم تسجيل الحضور ✅", en: "Student marked as present ✅" },
        "msg_att_warn": { ar: "هذا الطالب مسجل حضور مسبقاً! ⚠️", en: "Attendance already recorded for today! ⚠️" },
        "msg_abs_ok": { ar: "تم تسجيل الغياب وإزالة التاريخ ✖", en: "Marked as absent for today ✖" },
        "msg_deleted": { ar: "تم حذف الطالب ونقله للسلة", en: "Student moved to recycle bin" },
        "msg_undo": { ar: "تم التراجع عن الحذف بنجاح ✅", en: "Restoration completed successfully ✅" },
        "msg_copied": { ar: "تم نسخ التقرير للواتساب 📋", en: "Report copied to clipboard 📋" },
        "msg_exp_saved": { ar: "تم تسجيل المصروف بنجاح 🔻", en: "Expense recorded and deducted 🔻" },
        "txt_free": { ar: "✅ مسجل بدون مصاريف (مجاني)", en: "✅ Registered for Free" },
        "txt_paid_full": { ar: "✅ خالص (مكتمل الدفع)", en: "✅ Fully Paid Status" },
        "txt_streak": { ar: "حصص متتالية", en: "Consecutive Classes" },
        "wa_net": { ar: "💵 صافي الربح", en: "💵 Net Profit" },
        "wa_exp": { ar: "🔻 المصروفات", en: "🔻 Expenses" }
    };
    
    const t = (key) => (dict[key] && dict[key][currentLang]) ? dict[key][currentLang] : key;

    // ====== 4. وظائف الواجهة (UI Logic) ======
    const showToast = (msg, type = "success") => {
        let container = $("toastContainer"); if(!container) return;
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
        let container = $("toastContainer"); if(!container) return;
        const toast = document.createElement("div"); 
        toast.className = `toast toast-warning undo-toast`;
        const undoTxt = currentLang === 'ar' ? 'تراجع ↩️' : 'Undo ↩️';
        toast.innerHTML = `<span>⚠️ ${msg}</span> <button class="btn smallBtn" id="tempUndoBtn" style="margin-right:15px; padding:5px 10px;">${undoTxt}</button>`;
        container.appendChild(toast); 
        let isUndone = false;
        toast.querySelector("#tempUndoBtn").onclick = () => { isUndone = true; onUndo(); toast.remove(); };
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
        recentScans.unshift({ 
            name: st.name || "بدون اسم", 
            id: st.id, 
            cls: st.className || "عام", 
            time: new Date().toLocaleTimeString(currentLang==='ar'?'ar-EG':'en-US', {hour:'2-digit', minute:'2-digit'}) 
        });
        if(recentScans.length > 5) recentScans.pop();
        const feed = $("liveFeedBox");
        if(feed) {
            feed.innerHTML = recentScans.map(s => 
                `<div class="feed-item"><span class="feed-time">${s.time}</span> <b>${s.name}</b> <span class="badge" style="background:var(--primary);">${s.cls}</span> <span>#${s.id}</span></div>`
            ).join("");
        }
    };

    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext||window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            if(type==="money") { 
                osc.type="sine"; osc.frequency.setValueAtTime(1200, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); 
                osc.start(); osc.stop(ctx.currentTime + 0.5); 
            } else if(type==="success") {
                osc.frequency.setValueAtTime(587, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.1, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); 
                osc.start(); osc.stop(ctx.currentTime + 0.3); 
            }
        } catch(e) {}
    };

    // ====== 5. التخزين والبيانات (Data Layer) ======
    const saveAll = () => {
      localStorage.setItem(K_STUDENTS, JSON.stringify(students));
      localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
      localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
      localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
      localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
      localStorage.setItem(K_GROUP_FEES, JSON.stringify(groupFees)); 
      localStorage.setItem(K_EXPENSES, JSON.stringify(expensesByDate));
      updateTopStats(); 
      updateFinanceSummary(); 
      renderCharts();
    };

    const loadAll = () => {
      try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}"); } catch { students = {}; }
      try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}"); } catch { deletedStudents = {}; }
      try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}"); } catch { revenueByDate = {}; }
      try { expensesByDate = JSON.parse(localStorage.getItem(K_EXPENSES) || "{}"); } catch { expensesByDate = {}; }
      try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]"); } catch { extraIds = []; }
      try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}"); } catch { attByDate = {}; }
      try { groupFees = JSON.parse(localStorage.getItem(K_GROUP_FEES) || "{}"); } catch { groupFees = {}; }
      
      const savedTheme = localStorage.getItem(K_THEME) || "classic"; 
      applyTheme(savedTheme);
      
      const savedBg = localStorage.getItem(K_BG_IMAGE); 
      if(savedBg) { 
          document.body.style.backgroundImage = `url('${savedBg}')`; 
          document.body.style.backgroundSize = "cover"; 
          document.body.style.backgroundAttachment = "fixed"; 
      }
      
      if($("centerNotebook")) $("centerNotebook").value = localStorage.getItem(K_NOTEBOOK) || "";
      
      updateTopStats(); 
      updateFinanceSummary(); 
      renderCharts();
    };

    const ensureBase500 = () => {
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { 
            if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i); 
        }
        saveAll();
    };

    // ====== 6. الصلاحيات والباسورد (Auth) ======
    const checkAuth = () => {
        if(localStorage.getItem(K_AUTH) === "1") {
            currentUserRole = localStorage.getItem(K_ROLE) || "admin";
            $("loginBox").classList.add("hidden");
            $("appBox").classList.remove("hidden");
            showApp();
        } else {
            $("loginBox").classList.remove("hidden");
            $("appBox").classList.add("hidden");
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

    const askAdminPass = (cb) => {
        $("customPassInput").value = "";
        passSuccessCallback = cb;
        $("customPassModal").classList.remove("hidden");
        setTimeout(() => $("customPassInput").focus(), 100);
    };

    on("customPassConfirm", "click", () => {
        if($("customPassInput").value === ADMIN_PASS) {
            $("customPassModal").classList.add("hidden");
            if(passSuccessCallback) passSuccessCallback();
        } else {
            showToast(t("msg_err_pass"), "err");
            $("customPassInput").value = ""; $("customPassInput").focus();
        }
    });
    on("customPassCancel", "click", () => $("customPassModal").classList.add("hidden"));

    on("loginBtn", "click", () => {
        const u = $("user").value.trim(); const p = $("pass").value.trim();
        if(u === ADMIN_USER && p === ADMIN_PASS) { 
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); 
            checkAuth(); 
        } else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) { 
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "assistant"); 
            checkAuth(); 
        } else { 
            showToast(t("msg_err_pass"), "err"); playSound("error"); 
        }
    });
    on("logoutBtn", "click", () => { 
        localStorage.removeItem(K_AUTH); localStorage.removeItem(K_ROLE); 
        location.reload(); 
    });

    // ====== 7. دوال الطالب الأساسية (Student Core) ======
    
    // حساب الستريك الذكي حسب حصص المجموعة
    const calculateSmartStreak = (st) => {
        if(!st.attendanceDates || st.attendanceDates.length === 0) return 0;
        let c = (st.className || "").trim() || "عام";
        
        let classDates = new Set();
        for(let d in attByDate) {
            for(let id of attByDate[d]) {
                let s = students[id];
                if(s && (s.className || "").trim() === c) { classDates.add(d); break; }
            }
        }
        let sortedDates = Array.from(classDates).sort((a,b) => new Date(b) - new Date(a));
        
        let streak = 0, today = nowDateStr();
        for(let d of sortedDates) {
            if(st.attendanceDates.includes(d)) streak++;
            else {
                if(d === today) continue; // لو لسه مسجلش حضور النهارده ميكسرش الستريك
                break; 
            }
        }
        return streak;
    };

    const updateStudentUI = (id) => {
        currentId = id; const st = students[id]; if (!st) return; 
        
        $("studentIdPill").textContent = `ID: ${id}`;
        $("stName").value = st.name || ""; 
        $("stClass").value = st.className || ""; 
        $("stPhone").value = st.phone || ""; 
        $("stNotes").value = st.notes || ""; 
        
        const paid = st.paid || 0; 
        let stClassName = (st.className || "").trim();
        let req = stClassName && groupFees[stClassName] !== undefined ? toInt(groupFees[stClassName]) : 0;
        
        // حسبة المتبقي والشريط
        let remain = req - paid;
        let percent = req > 0 ? Math.min((paid/req)*100, 100) : 0;
        
        let statusClass = "";
        if(req > 0) {
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

        let remBox = $("remainingBox");
        if(req === 0) {
            remBox.className = "remain-box remain-green";
            remBox.innerHTML = `✅ ${t("txt_free")}`;
        } else if(remain <= 0) {
            remBox.className = "remain-box remain-green";
            remBox.innerHTML = `✅ ${t("txt_paid_full")}`;
        } else {
            remBox.className = "remain-box remain-red";
            remBox.innerHTML = `${t("lbl_remaining")} <span id="stRemainingAmt">${remain}</span> ج`;
        }

        // الرتبة
        let r = st.rank || "normal";
        $("rankNormalBtn").className = "st-rank-btn " + (r === "normal" ? "active-normal" : "");
        $("rankVipBtn").className = "st-rank-btn " + (r === "vip" ? "active-vip" : "");
        $("rankWarnBtn").className = "st-rank-btn " + (r === "warn" ? "active-warn" : "");

        // الحضور والستريك
        const today = nowDateStr(), dates = st.attendanceDates || [], isPresent = dates.includes(today);
        const statusEl = $("todayStatus");
        if(isPresent) {
            statusEl.textContent = t("btn_mark_present");
            statusEl.style.color = "green";
            $("stAvatar").classList.add("present");
        } else {
            statusEl.textContent = t("btn_mark_absent");
            statusEl.style.color = "red";
            $("stAvatar").classList.remove("present");
        }

        let streakCount = calculateSmartStreak(st);
        $("daysCount").innerHTML = `🔥 ${streakCount} ${t("txt_streak")}`;
        $("attList").innerHTML = dates.slice().reverse().slice(0,20).map(d=>`<div class="item">${prettyDate(d)}</div>`).join("");
        if(dates.length === 0 && st.name) $("newBadge").classList.remove("hidden"); else $("newBadge").classList.add("hidden");
    };

    const setRank = (r) => {
        if(!currentId) return;
        students[currentId].rank = r;
        saveAll(); updateStudentUI(currentId);
        showToast(t("msg_saved"));
    };
    on("rankNormalBtn", "click", () => setRank("normal"));
    on("rankVipBtn", "click", () => setRank("vip"));
    on("rankWarnBtn", "click", () => setRank("warn"));

    const addAttendance = (id, dateStr) => {
        const st = students[id]; if(!st) return {ok:false};
        if(!st.attendanceDates.includes(dateStr)) {
            st.attendanceDates.push(dateStr);
            if(!attByDate[dateStr]) attByDate[dateStr] = [];
            if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
            saveAll(); playSound("success"); updateLiveFeed(st);
            return {ok:true, msg: t("msg_att_ok")};
        }
        playSound("error"); return {ok:false, msg: t("msg_att_warn")};
    };

    const removeAttendance = (id, dateStr) => {
        const st = students[id]; if(!st) return;
        st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
        if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
        saveAll();
    };

    // ====== 8. إدارة المجموعات والماليات ======
    
    // مودال تخصيص مصاريف المجموعات
    on("openGroupFeesBtn", "click", () => {
        askAdminPass(() => {
            let uniqueGroups = new Set();
            Object.values(students).forEach(s => {
                if(s.name || s.paid > 0) {
                    let c = (s.className || "").trim();
                    if(c) uniqueGroups.add(c);
                }
            });
            if(uniqueGroups.size === 0) uniqueGroups.add("عام");

            let html = "";
            uniqueGroups.forEach(g => {
                let currentFee = groupFees[g] || 0;
                html += `
                <div class="group-fee-row">
                    <label>📘 ${g}</label>
                    <div><input type="number" class="inp fee-input-val" data-group="${g}" value="${currentFee}"> ج</div>
                </div>`;
            });
            $("groupFeesList").innerHTML = html;
            $("groupFeesModal").classList.remove("hidden");
        });
    });
    on("closeGroupFeesModal", "click", () => $("groupFeesModal").classList.add("hidden"));
    on("saveGroupFeesBtn", "click", () => {
        document.querySelectorAll(".fee-input-val").forEach(inp => {
            groupFees[inp.getAttribute("data-group")] = toInt(inp.value);
        });
        saveAll(); $("groupFeesModal").classList.add("hidden");
        showToast(t("msg_saved"));
        if(currentId) updateStudentUI(currentId);
    });

    // تسجيل مصروف جديد
    on("saveExpenseBtn", "click", () => {
        const amt = toInt($("expenseAmtInp").value);
        const rsn = $("expenseReasonInp").value.trim();
        if(!amt || !rsn) { showToast(currentLang==='ar'?'أدخل المبلغ والسبب!':'Fill all data!', 'err'); return; }
        const today = nowDateStr();
        if(!expensesByDate[today]) expensesByDate[today] = [];
        expensesByDate[today].push({ amount: amt, reason: rsn });
        saveAll();
        $("expenseAmtInp").value = ""; $("expenseReasonInp").value = "";
        showToast(t("msg_exp_saved"));
        renderReport(today);
    });

    const updateFinanceSummary = () => {
        const today = nowDateStr();
        const tRev = revenueByDate[today] || 0;
        const tExp = (expensesByDate[today] || []).reduce((sum, ex) => sum + ex.amount, 0);
        if($("todayNetProfit")) $("todayNetProfit").textContent = (tRev - tExp) + " ج";

        const currentMonth = today.slice(0, 7); 
        let mRev = 0, mExp = 0;
        for(let d in revenueByDate) { if(d.startsWith(currentMonth)) mRev += revenueByDate[d]; }
        for(let d in expensesByDate) { if(d.startsWith(currentMonth)) expensesByDate[d].forEach(ex => mExp += ex.amount); }
        if($("monthNetProfit")) $("monthNetProfit").textContent = (mRev - mExp) + " ج";
    };

    // ====== 9. جداول الطلاب والبحث ======
    const renderList = () => {
        const filterGroup = $("filterClass").value, 
              filterStatus = $("filterStatus").value, 
              filterAttend = $("filterAttend").value; 
        
        const sel = $("filterClass");
        if(sel.options.length <= 1) { 
            const allClasses = new Set();
            Object.values(students).forEach(s => { if(s.name && s.className) allClasses.add(s.className.trim()); });
            allClasses.forEach(c => { const opt = document.createElement("option"); opt.value = c; opt.innerText = c; sel.appendChild(opt); });
        }

        const filled = Object.values(students).filter(s => s.name || s.paid > 0);
        const today = nowDateStr(); 

        currentFilteredList = filled.filter(s => {
            if(filterGroup !== "all" && s.className !== filterGroup) return false;
            if(filterStatus !== "all") {
                const p = s.paid || 0; 
                let req = groupFees[(s.className || "").trim()] || 0;
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
        if(q) currentFilteredList = currentFilteredList.filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q));
        
        currentPage = 1; renderPage();
    };

    const renderPage = () => {
        const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
        const start = (currentPage - 1) * ITEMS_PER_PAGE, end = start + ITEMS_PER_PAGE;
        const pageItems = currentFilteredList.slice(start, end);
        const today = nowDateStr();

        pageItems.forEach(s => {
            const tr = document.createElement("tr");
            let req = groupFees[(s.className || "").trim()] || 0;
            let percent = req > 0 ? Math.min((s.paid/req)*100, 100) : 0;
            let pBar = `<div style="width:100%; background:#eee; height:5px; border-radius:3px;"><div style="width:${percent}%; background:var(--success); height:100%; border-radius:3px;"></div></div>`;
            const attendTxt = (s.attendanceDates||[]).includes(today) ? "✅" : "➖";
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');

            tr.innerHTML = `<td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td>
                            <td>${s.id}</td><td><b>${s.name}</b>${rankIcon}</td>
                            <td><span class="badge" style="background:var(--primary);">${s.className}</span></td>
                            <td>${s.paid} ج ${pBar}</td><td>${attendTxt}</td>`;
            tr.onclick = (e) => { if(e.target.type !== "checkbox") { window.switchTab('Home'); window.extOpen(s.id); } };
            tb.appendChild(tr);
        });
        $("pageIndicator").textContent = `${currentPage} / ${Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1}`;
        $("prevPageBtn").disabled = (currentPage === 1);
        $("nextPageBtn").disabled = (end >= currentFilteredList.length);
    };

    const renderSimpleTable = () => {
        const tb = $("simpleStudentsTable").querySelector("tbody"); if(!tb) return; tb.innerHTML = "";
        Object.values(students).filter(s => s.name || s.paid > 0).forEach(s => {
            const tr = document.createElement("tr");
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');
            tr.innerHTML = `<td>${s.id}</td><td><b>${s.name}</b>${rankIcon}</td><td>${s.className}</td>`;
            tr.style.cursor = "pointer";
            tr.onclick = () => { $("allStudentsModal").classList.add("hidden"); window.switchTab('Home'); window.extOpen(s.id); };
            tb.appendChild(tr);
        });
    };

    const handleBulk = () => {
        const boxes = document.querySelectorAll(".stCheckbox:checked");
        $("selectedCount").textContent = boxes.length;
        if(boxes.length > 0) $("bulkActionBar").classList.remove("hidden"); 
        else $("bulkActionBar").classList.add("hidden");
    };

    // ====== 10. التقارير والواتساب (Reports) ======
    const renderReport = (d) => {
        const list = $("reportList"); if(!list) return;
        const ids = attByDate[d] || [];
        const rev = revenueByDate[d] || 0;
        const expArr = expensesByDate[d] || [];
        const totalExp = expArr.reduce((sum, ex) => sum + ex.amount, 0);

        if($("reportDateLabel")) $("reportDateLabel").textContent = prettyDate(d);
        if($("reportCount")) $("reportCount").textContent = ids.length;
        if($("reportMoney")) $("reportMoney").textContent = rev + " ج";
        if($("reportExpense")) $("reportExpense").textContent = totalExp + " ج";
        
        if(!ids.length && expArr.length === 0) { list.innerHTML = `<div class='mutedCenter'>${t("wait_scan")}</div>`; return; }
        
        let groups = {}, groupMoney = {}; 
        ids.forEach(id => {
            const st = students[id]; let c = (st && st.className) ? st.className.trim() : "عام";
            if(!groups[c]) { groups[c] = []; groupMoney[c] = 0; }
            groups[c].push(id); groupMoney[c] += (st && st.paid) ? st.paid : 0; 
        });

        let html = "";
        for(let g in groups) {
            html += `
            <div style="background:#fff; padding:15px; margin-top:12px; border-radius:12px; border-right: 5px solid var(--primary); box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <b style="color:var(--primary);">🏷️ ${g}</b> 
                    <span style="font-weight:bold; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:5px;">💰 ${groupMoney[g]} ج</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${groups[g].map(id => `<span class="badge" style="cursor:pointer;" onclick="window.extOpen('${id}')">#${id}</span>`).join("")}
                </div>
            </div>`;
        }
        
        if(expArr.length > 0) {
            html += `<h4 style="margin-top:15px; color:var(--danger);">${t("wa_exp")}</h4><ul style="color:#d9534f; font-size:14px;">`;
            expArr.forEach(ex => { html += `<li>${ex.amount} ج - ${ex.reason}</li>`; });
            html += `</ul>`;
        }
        list.innerHTML = html;
    };

    on("copyReportBtn", "click", () => {
        const d = $("reportDate").value || nowDateStr();
        const ids = attByDate[d] || []; const rev = revenueByDate[d] || 0;
        const expArr = expensesByDate[d] || [];
        const totalExp = expArr.reduce((sum, ex) => sum + ex.amount, 0);

        let txt = `📊 *${t("report_title")}: ${prettyDate(d)}*\n\n`;
        let groups = {};
        ids.forEach(id => { let c = (students[id] && students[id].className) ? students[id].className.trim() : "عام"; if(!groups[c]) groups[c] = 0; groups[c]++; });
        for(let g in groups) { txt += `📘 ${g}: ${groups[g]} طالب\n`; }
        
        txt += `\n👥 ${t("badge_count")} ${ids.length}`;
        txt += `\n💰 ${t("badge_rev")} ${rev} ج`;
        
        if(expArr.length > 0) {
            txt += `\n\n🔻 *${t("wa_exp")}:*`;
            expArr.forEach(ex => { txt += `\n- ${ex.amount} ج (${ex.reason})`; });
            txt += `\n\n💵 *${t("wa_net")}: ${rev - totalExp} ج*`;
        }
        txt += `\n\n-- ${t("brand_name")} --`;
        navigator.clipboard.writeText(txt).then(() => showToast(t("msg_copied")));
    });

    // ====== 11. الرسم البياني (Weekly Chart) ======
    const renderCharts = () => {
        const box = $("weeklyChartBox"); if(!box) return;
        let days = [];
        for(let i=6; i>=0; i--) { 
            let d = new Date(); d.setDate(d.getDate() - i); 
            days.push(d.toISOString().split('T')[0]); 
        }
        let maxNet = 0;
        let chartData = days.map(d => {
            let rev = revenueByDate[d] || 0;
            let exp = (expensesByDate[d] || []).reduce((sum, ex) => sum + ex.amount, 0);
            let net = rev - exp;
            if(net > maxNet) maxNet = net;
            return { date: d, net: net };
        });
        if(maxNet <= 0) maxNet = 100;
        
        box.innerHTML = chartData.map(item => {
            let h = Math.max(0, (item.net / maxNet) * 100);
            let dayName = new Date(item.date).toLocaleDateString(currentLang==='ar'?'ar-EG':'en-US', {weekday: 'short'});
            return `
            <div class="chart-bar-wrap">
                <span style="font-size:10px; color:#666; margin-bottom:5px;">${item.net}</span>
                <div class="chart-bar" style="height:${h}%; background:${item.net>0?'var(--success)':'#ccc'};"></div>
                <div class="chart-label">${dayName}</div>
            </div>`;
        }).join("");
    };

    // ====== 12. أزرار الأكشن (Events) ======
    on("quickAttendBtn", "click", () => {
        const id = toInt($("quickAttendId").value); 
        if(!id) return;
        const res = addAttendance(id, nowDateStr());
        showToast(res.msg, res.ok?"success":"warning");
        updateStudentUI(id); renderReport(nowDateStr());
        $("quickAttendId").value = ""; $("quickAttendId").focus();
    });
    on("openBtn", "click", () => window.extOpen(toInt($("openId").value)));
    on("searchAny", "input", (e) => {
        const q = e.target.value.toLowerCase();
        if(!q) { $("searchMsg").style.display="none"; return; }
        const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && s.phone.includes(q))).slice(0,5);
        $("searchMsg").style.display = "block";
        $("searchMsg").innerHTML = found.map(s => `<div class="item" onclick="window.extOpen(${s.id})"><b>${s.name}</b> (${s.id})</div>`).join("");
    });
    on("addNewBtn", "click", () => {
        const id = toInt($("newId").value);
        if(!id || students[String(id)] && (students[String(id)].name)) { showToast(t("msg_id_exist"), "err"); return; }
        students[String(id)] = makeEmptyStudent(id);
        if(id<BASE_MIN_ID || id>BASE_MAX_ID) extraIds.push(id);
        saveAll(); window.extOpen(id); showToast(t("msg_added"));
    });
    on("saveStudentBtn", "click", () => {
        if(!currentId) return; const s = students[currentId];
        s.name = $("stName").value; s.className = $("stClass").value; s.phone = $("stPhone").value;
        saveAll(); showToast(t("msg_saved"));
    });
    on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
    on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); showToast(t("msg_abs_ok"), "warning"); }});
    on("addPaymentBtn", "click", () => {
        if(!currentId) return; const v = toInt($("newPaymentInput").value); if(!v) return;
        const st = students[currentId]; st.paid += v;
        const today = nowDateStr(); revenueByDate[today] = (revenueByDate[today]||0) + v;
        saveAll(); playSound("money");
        let req = groupFees[(st.className || "").trim()] || 0;
        if(req > 0 && st.paid >= req) { fireConfetti(); showToast(t("msg_complete")); } else showToast(t("msg_deposit"));
        updateStudentUI(currentId); renderReport(today);
        if(st.phone) {
            const msg = `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} ج ✅\nإجمالي المدفوع: ${st.paid} ج.\n\n-- ${t("brand_name")} --`;
            setTimeout(() => { window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank'); }, 1000);
        }
    });
    on("correctPayBtn", "click", () => {
        if(!currentId) return; const v = toInt(prompt(currentLang==='ar'?"خصم مبلغ:":"Deduct amount:")); if(!v) return;
        students[currentId].paid = Math.max(0, students[currentId].paid - v);
        const today = nowDateStr(); revenueByDate[today] = Math.max(0, (revenueByDate[today]||0) - v);
        saveAll(); showToast(t("msg_discount"), "warning"); updateStudentUI(currentId); renderReport(today);
    });
    on("deleteStudentBtn", "click", () => {
        if(!currentId) return;
        if(!confirm(t("pass_req_desc"))) return;
        const targetId = currentId, st = students[targetId], backup = JSON.parse(JSON.stringify(st));
        let deducted = 0; if(st.paid > 0 && confirm(currentLang==='ar'?'خصم مدفوعاته من إيراد اليوم؟':'Deduct from revenue?')) deducted = st.paid;
        revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) - deducted;
        deletedStudents[targetId] = backup; students[targetId] = makeEmptyStudent(targetId);
        saveAll(); updateStudentUI(null); window.switchTab('Home');
        showUndoToast(t("msg_deleted"), () => {
            students[targetId] = backup; delete deletedStudents[targetId];
            revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) + deducted;
            saveAll(); window.extOpen(targetId); showToast(t("msg_undo"));
        });
    });
    on("waBtn", "click", () => { const ph = $("stPhone").value; if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); });

    // ====== 13. إعدادات النظام وتغيير اللغة ======
    const applyLanguage = () => {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if(dict[key] && dict[key][currentLang]) el.innerHTML = dict[key][currentLang];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if(dict[key] && dict[key][currentLang]) el.placeholder = dict[key][currentLang];
        });
        const langBtn = $("changeLangBtn");
        if(langBtn) langBtn.innerText = currentLang === "ar" ? "🌐 تغيير اللغة (Ar / En)" : "🌐 Switch Language (En/Ar)";
        const nav = document.querySelector('.bottom-nav');
        if(nav) nav.style.flexDirection = currentLang === "ar" ? "row" : "row-reverse";
    };

    on("changeLangBtn", "click", () => {
        currentLang = (currentLang === "ar") ? "en" : "ar";
        localStorage.setItem(K_LANG, currentLang);
        applyLanguage();
    });

    on("exportExcelBtn", "click", () => {
        const filled = Object.values(students).filter(st => st.name || st.paid>0).sort((a,b)=>a.id-b.id);
        const wsData = [["ID", "Name", "Class", "Phone", "Paid", "Rank", "History"]];
        filled.forEach(s => wsData.push([s.id, s.name, s.className, s.phone, s.paid, s.rank, (s.attendanceDates||[]).join(",")]));
        const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
        localStorage.setItem(K_LAST_BACKUP, nowDateStr());
        $("btnTabAdmin").classList.remove("needs-backup");
        showToast(t("msg_saved"));
    });

    on("importExcelBtnFake", "click", () => $("importExcelInput").click());
    on("importExcelInput", "change", async (e) => {
        const f = e.target.files[0]; if(!f) return;
        const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if(!confirm(currentLang==='ar'?'تحذير: سيتم مسح البيانات الحالية!':'Warning: Overwrite current data?')) return;
        students = {}; attByDate = {}; revenueByDate = {}; expensesByDate = {};
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) students[String(i)] = makeEmptyStudent(i);
        rows.forEach(row => {
            const id = toInt(row["ID"] || row["كود"]);
            if(id) {
                let st = makeEmptyStudent(id);
                st.name = row["Name"] || row["الاسم"] || ""; st.className = row["Class"] || row["المجموعة"] || "";
                st.phone = String(row["Phone"] || row["رقم الموبايل"] || ""); st.paid = toInt(row["Paid"] || row["المدفوع"]);
                st.rank = row["Rank"] || row["التصنيف"] || "normal";
                let h = row["History"] || row["سجل الحضور"] || "";
                if(h) {
                    st.attendanceDates = h.split(",").map(d=>d.trim());
                    st.attendanceDates.forEach(d => { if(!attByDate[d]) attByDate[d]=[]; attByDate[d].push(id); });
                }
                students[String(id)] = st;
            }
        });
        saveAll(); showToast(t("msg_saved")); location.reload();
    });

    on("themeSelector", "change", (e) => applyTheme(e.target.value));
    on("removeBgBtn", "click", () => { document.body.style.backgroundImage = "none"; localStorage.removeItem(K_BG_IMAGE); showToast(t("msg_saved")); });

    // ====== 14. التشغيل النهائي (Initialization) ======
    window.extOpen = (id) => { 
        if(!id) return;
        $("searchAny").value = ""; $("searchMsg").style.display="none"; 
        updateStudentUI(id); 
        const card = document.querySelector(".studentCard"); 
        if(card) card.scrollIntoView({behavior:"smooth", block:"start"}); 
    };

    const checkDailyBackup = () => {
        const last = localStorage.getItem(K_LAST_BACKUP), today = nowDateStr();
        if(last !== today) {
            $("btnTabAdmin").classList.add("needs-backup");
            setTimeout(() => showToast(currentLang==='ar'?'⚠️ تذكير: لم تقم بتصدير نسخة Excel اليوم!':'⚠️ Backup reminder!', 'warning'), 3000);
        }
    };

    const checkQR = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const qrId = toInt(urlParams.get("id"));
        if (qrId && students[String(qrId)]) { addAttendance(qrId, nowDateStr()); window.extOpen(qrId); window.history.replaceState(null, null, window.location.pathname); }
    };

    loadAll(); 
    ensureBase500(); 
    checkAuth();
    applyLanguage(); 
    checkDailyBackup();
    setTimeout(checkQR, 500);

    // ربط أزرار الصفحات
    on("btnTabHome", "click", () => window.switchTab('Home'));
    on("btnTabStudents", "click", () => { window.switchTab('Students'); renderList(); });
    on("btnTabRevenue", "click", () => { window.switchTab('Revenue'); renderCharts(); updateFinanceSummary(); });
    on("btnTabAdmin", "click", () => window.switchTab('Admin'));
    
    // ربط checkbox الجدول
    document.addEventListener("change", (e) => {
        if(e.target.classList.contains("stCheckbox")) handleBulk();
        if(e.target.id === "selectAllCheckbox") { document.querySelectorAll(".stCheckbox").forEach(c => c.checked = e.target.checked); handleBulk(); }
    });

    on("prevPageBtn", "click", () => { if(currentPage>1) { currentPage--; renderPage(); }});
    on("nextPageBtn", "click", () => { currentPage++; renderPage(); });

    on("openAllStudentsBtn", "click", () => { renderSimpleTable(); $("allStudentsModal").classList.remove("hidden"); });
    on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));
});
