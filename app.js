/* =============================================================================
   Center System V-PRO MAX (THE ULTIMATE SHIELD EDITION - FIXED)
   -----------------------------------------------------------------------------
   - 100% Full Translation Dictionary (Arabic / English)
   - Smart Consecutive Attendance (Group-based Streak)
   - Advanced Financial Module (Expenses, Daily/Monthly Net Profit)
   - Dynamic Group Fee Management (Auto Class Detection)
   - High-Security Custom Password Modal
   - WhatsApp Manager Report (Automated Formatting)
   - Weekly Analytics Chart & Performance Tracking
   - Full Data Recovery & Recycle Bin Logic
   - Hoisting Fixed: ZERO ReferenceErrors.
   ============================================================================= */

document.addEventListener('DOMContentLoaded', function() {
    console.log("V-PRO MAX Engine: Initializing System...");

    // ==========================================
    // 1. CONFIGURATION & AUTHENTICATION
    // ==========================================
    const ADMIN_USER = "Admin"; 
    const ADMIN_PASS = "####1111"; // باسورد الإدارة
    const ASST_USER  = "User";  
    const ASST_PASS  = "11112222"; // باسورد المساعد
    
    const BASE_MIN_ID = 1; 
    const BASE_MAX_ID = 500; 
    const ITEMS_PER_PAGE = 50;

    // مفاتيح التخزين المحلية (LocalStorage Keys)
    const K_AUTH         = "ca_auth_v2";
    const K_ROLE         = "ca_role_v1";
    const K_STUDENTS     = "ca_students_v6";
    const K_EXTRA_IDS    = "ca_extra_ids_v6";
    const K_ATT_BY_DATE  = "ca_att_by_date_v6";
    const K_REVENUE      = "ca_revenue_v6";
    const K_DELETED      = "ca_deleted_v9";
    const K_THEME        = "ca_theme_v1";
    const K_LANG         = "ca_lang";
    const K_LAST_BACKUP  = "ca_last_backup";
    const K_BG_IMAGE     = "ca_bg_image";
    const K_NOTEBOOK     = "ca_notebook_v1";
    const K_GROUP_FEES   = "ca_group_fees_v1";
    const K_EXPENSES     = "ca_expenses_v1";

    // ==========================================
    // 2. GLOBAL SYSTEM STATE (المتغيرات العامة)
    // ==========================================
    let students         = {}; 
    let deletedStudents  = {}; 
    let extraIds         = []; 
    let attByDate        = {}; 
    let revenueByDate    = {}; 
    let groupFees        = {}; 
    let expensesByDate   = {};
    
    let currentId        = null;
    let currentUserRole  = "admin";
    let currentPage      = 1;
    let currentFilteredList = [];
    let recentScans      = [];
    let isRevHidden      = false;
    let passSuccessCallback = null;
    let currentLang      = localStorage.getItem(K_LANG) || "ar";

    // ==========================================
    // 3. THE COMPREHENSIVE DICTIONARY (القاموس)
    // ==========================================
    const dict = {
        "login_title": { ar: "دخول لوحة السنتر", en: "Center Login Dashboard" },
        "login_desc": { ar: "الدخول للمسؤول فقط", en: "Authorized Access Only" },
        "login_btn": { ar: "دخول", en: "Login" },
        "brand_name": { ar: "لوحة السنتر V-PRO", en: "V-PRO Dashboard" },
        "stat_students": { ar: "👥 مسجلين:", en: "👥 Enrolled:" },
        "stat_attend": { ar: "✅ حضور:", en: "✅ Attend:" },
        "stat_revenue": { ar: "💰 إيراد:", en: "💰 Revenue:" },
        "btn_logout": { ar: "خروج 🚪", en: "Logout 🚪" },
        "quick_title": { ar: "سريع (QR)", en: "Quick Record (QR)" },
        "btn_record": { ar: "سجل حضور", en: "Record" },
        "lbl_last_scan": { ar: "آخر حضور تم تسجيله ⏱️", en: "Recent Activity ⏱️" },
        "wait_scan": { ar: "بانتظار مسح كود...", en: "Waiting for scan..." },
        "search_title": { ar: "بحث شامل", en: "Global Search" },
        "btn_open": { ar: "فتح", en: "Open Profile" },
        "search_plc": { ar: "الاسم / الرقم / الكود...", en: "Name / Phone / ID..." },
        "search_tbl_plc": { ar: "🔍 ابحث في الجدول...", en: "🔍 Search table..." },
        "add_title": { ar: "+ إضافة طالب جديد", en: "+ New Student" },
        "btn_add_open": { ar: "إضافة وفتح", en: "Add & Open" },
        "st_details": { ar: "بيانات الطالب", en: "Student Information" },
        "badge_new": { ar: "جديد", en: "NEW" },
        "rank_normal": { ar: "🟢 عادي", en: "🟢 Normal" },
        "rank_warn": { ar: "⚠️ إنذار", en: "⚠️ Warning" },
        "lbl_name": { ar: "الاسم", en: "Name" },
        "lbl_class": { ar: "الصف / المجموعة", en: "Class / Group" },
        "lbl_phone": { ar: "رقم الموبايل", en: "Phone Number" },
        "lbl_finance": { ar: "نظام المصاريف", en: "Tuition System" },
        "lbl_total_paid": { ar: "💰 إجمالي المدفوع:", en: "💰 Total Paid:" },
        "btn_discount": { ar: "خصم", en: "Discount" },
        "lbl_remaining": { ar: "⚠️ المتبقي:", en: "⚠️ Remaining:" },
        "lbl_new_pay": { ar: "➕ دفعة جديدة:", en: "➕ New Payment:" },
        "btn_deposit": { ar: "إيداع", en: "Deposit" },
        "lbl_notes": { ar: "ملاحظات (مؤرخة)", en: "Dated Notes" },
        "note_plc": { ar: "إضافة ملحوظة...", en: "Add a note..." },
        "btn_add_note": { ar: "إضافة", en: "Add Note" },
        "btn_save_st": { ar: "حفظ البيانات 💾", en: "Save Data 💾" },
        "btn_mark_present": { ar: "✅ حضور", en: "✅ Present" },
        "btn_mark_absent": { ar: "✖ غياب", en: "✖ Absent" },
        "btn_delete": { ar: "🗑️ حذف", en: "🗑️ Delete" },
        "lbl_history": { ar: "سجل التواريخ", en: "Attendance History" },
        "adv_search_title": { ar: "قائمة البحث المتقدم", en: "Advanced Search" },
        "flt_all_classes": { ar: "كل المجموعات", en: "All Groups" },
        "flt_all_fin": { ar: "كل الحالات المالية", en: "All Finance" },
        "flt_paid": { ar: "✅ خالص", en: "✅ Paid" },
        "flt_partial": { ar: "⚠️ جزء", en: "⚠️ Partial" },
        "flt_unpaid": { ar: "🔴 لم يدفع", en: "🔴 Unpaid" },
        "flt_all_att": { ar: "كل الحضور", en: "All Attendance" },
        "flt_att_only": { ar: "✅ الحضور فقط", en: "✅ Present Only" },
        "flt_abs_only": { ar: "✖ الغياب فقط", en: "✖ Absent Only" },
        "lbl_selected": { ar: "تم تحديد", en: "Selected" },
        "tbl_name": { ar: "الاسم", en: "Name" },
        "tbl_class": { ar: "المجموعة", en: "Class" },
        "tbl_paid": { ar: "المدفوع", en: "Paid" },
        "tbl_today": { ar: "حضور اليوم", en: "Today" },
        "btn_prev": { ar: "السابق", en: "Prev" },
        "btn_next": { ar: "التالي", en: "Next" },
        "fin_summary_title": { ar: "📊 الملخص المالي", en: "📊 Financial Summary" },
        "fin_today_net": { ar: "صافي ربح اليوم", en: "Today's Profit" },
        "fin_month_net": { ar: "صافي ربح الشهر الحالي", en: "Monthly Profit" },
        "exp_title": { ar: "🔻 تسجيل مصروفات اليوم", en: "🔻 Daily Expenses" },
        "exp_amt_plc": { ar: "المبلغ (مثال: 150)", en: "Amount" },
        "exp_rsn_plc": { ar: "سبب الصرف (مثال: ورق)", en: "Reason" },
        "btn_save_exp": { ar: "خصم وحفظ", en: "Deduct & Save" },
        "report_title": { ar: "تقرير الحضور والماليات", en: "Attendance & Finance Report" },
        "btn_copy_wa": { ar: "نسخ التقرير للمدير 📋", en: "Copy for Manager 📋" },
        "btn_view": { ar: "عرض", en: "View Report" },
        "badge_date": { ar: "التاريخ:", en: "Date:" },
        "badge_count": { ar: "العدد:", en: "Count:" },
        "badge_rev": { ar: "إيراد:", en: "Revenue:" },
        "badge_exp": { ar: "مصروف:", en: "Expenses:" },
        "chart_title": { ar: "📈 لوحة أرباح الأسبوع", en: "📈 Weekly Performance Chart" },
        "settings_title": { ar: "⚙️ إعدادات النظام", en: "⚙️ System Settings" },
        "note_title": { ar: "📝 مفكرة السنتر السريعة", en: "📝 Quick Notebook" },
        "note_plc_main": { ar: "اكتب ملاحظاتك هنا...", en: "Type your notes here..." },
        "set_data_title": { ar: "💾 البيانات والنسخ الاحتياطي", en: "💾 Data Management" },
        "btn_export_ex": { ar: "📥 تصدير البيانات (Excel)", en: "📥 Export to Excel" },
        "btn_import_ex": { ar: "📤 استيراد بيانات (Excel)", en: "📤 Import from Excel" },
        "btn_recycle": { ar: "🗑️ سلة المحذوفات", en: "🗑️ Recycle Bin" },
        "set_ui_title": { ar: "🎨 المظهر والتخصيص", en: "🎨 UI & Theme" },
        "lbl_theme": { ar: "ثيم البرنامج:", en: "App Theme:" },
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
        "nav_students": { ar: "الطلاب", en: "Students" },
        "pass_req_title": { ar: "مطلوب صلاحية الإدارة", en: "Admin Auth Required" },
        "pass_req_desc": { ar: "يرجى إدخال كلمة مرور الأدمن للمتابعة.", en: "Enter master password to continue." },
        "btn_cancel": { ar: "إلغاء", en: "Cancel" },
        "btn_confirm": { ar: "تأكيد ✔️", en: "Confirm ✔️" },
        "modal_all_st": { ar: "قائمة الطلاب المسجلين", en: "Registered Students List" },
        "btn_empty_bin": { ar: "إفراغ السلة نهائياً", en: "Empty Bin Permanently" },
        "modal_today_att": { ar: "👥 حضور اليوم مفصل", en: "👥 Detailed Attendance" },
        "btn_close": { ar: "إغلاق ✖", en: "Close Window ✖" },
        "modal_grp_fees": { ar: "⚙️ تخصيص مصاريف المجموعات", en: "⚙️ Manage Group Pricing" },
        "grp_fees_desc": { ar: "تم جلب المجموعات تلقائياً من بيانات الطلاب.", en: "Groups are auto-detected from student records." },
        "btn_save_changes": { ar: "حفظ التعديلات 💾", en: "Save Changes 💾" },
        "msg_saved": { ar: "تم الحفظ بنجاح ✅", en: "Progress saved! ✅" },
        "msg_err_pass": { ar: "كلمة مرور خاطئة ❌", en: "Incorrect Password! ❌" },
        "msg_att_ok": { ar: "تم تسجيل الحضور ✅", en: "Attendance Recorded ✅" },
        "msg_att_warn": { ar: "حاضر مسبقاً ⚠️", en: "Already marked present! ⚠️" },
        "msg_added": { ar: "تم إضافة الطالب بنجاح ✅", en: "Student registered! ✅" },
        "msg_deleted": { ar: "تم حذف الطالب ونقله للسلة", en: "Student moved to recycle bin" },
        "msg_undo": { ar: "تم التراجع بنجاح ✅", en: "Action Undone ✅" },
        "msg_copied": { ar: "تم نسخ التقرير 📋", en: "Report Copied 📋" },
        "txt_streak": { ar: "حصة متتالية", en: "Classes Streak" },
        "txt_paid_full": { ar: "✅ خالص (مكتمل الدفع)", en: "✅ Fully Paid" },
        "txt_free": { ar: "✅ مسجل بدون مصاريف", en: "✅ Enrolled for Free" },
        "wa_net": { ar: "💵 صافي الربح", en: "💵 Net Profit" },
        "wa_exp": { ar: "🔻 المصروفات", en: "🔻 Expenses" }
    };

    // ==========================================
    // 4. CORE UTILITY FUNCTIONS (Hoisted)
    // ==========================================
    function $(id) { 
        return document.getElementById(id); 
    }

    function on(id, event, handler) { 
        const el = $(id); 
        if(el) el.addEventListener(event, handler); 
    }

    function t(key) { 
        return (dict[key] && dict[key][currentLang]) ? dict[key][currentLang] : key; 
    }

    function nowDateStr() { 
        return new Date().toISOString().split('T')[0]; 
    }

    function prettyDate(d) { 
        return d ? d.split("-").reverse().join("-") : "—"; 
    }

    function toInt(v) { 
        const n = parseInt(v); 
        return isNaN(n) ? 0 : n; 
    }

    function showToast(msg, type = "success") {
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
    }

    function showUndoToast(msg, onUndo) {
        let container = $("toastContainer"); 
        if(!container) return;
        const toast = document.createElement("div"); 
        toast.className = `toast toast-warning undo-toast`;
        const undoTxt = currentLang === 'ar' ? 'تراجع ↩️' : 'Undo ↩️';
        toast.innerHTML = `<span>⚠️ ${msg}</span> <button class="btn smallBtn" id="tempUndoBtn" style="margin-right:15px; padding:5px 10px;">${undoTxt}</button>`;
        container.appendChild(toast); 
        let isUndone = false;
        toast.querySelector("#tempUndoBtn").onclick = () => { 
            isUndone = true; 
            onUndo(); 
            toast.remove(); 
        };
        setTimeout(() => { 
            if(!isUndone) { 
                toast.style.animation = "slideOut 0.3s forwards"; 
                setTimeout(() => toast.remove(), 300); 
            } 
        }, 5000);
    }

    function fireConfetti() {
        for(let i = 0; i < 35; i++) {
            const conf = document.createElement("div"); 
            conf.className = "confetti";
            conf.style.left = Math.random() * 100 + "vw"; 
            conf.style.backgroundColor = ['#2ea44f', '#2f6bff', '#d69e2e', '#cf222e', '#9b59b6'][Math.floor(Math.random()*5)];
            conf.style.animationDuration = (Math.random() * 2 + 1) + "s"; 
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 3000);
        }
    }

    function playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); 
            const gain = ctx.createGain();
            osc.connect(gain); 
            gain.connect(ctx.destination);
            
            if(type === "money") { 
                osc.type = "sine"; 
                osc.frequency.setValueAtTime(1200, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); 
                osc.start(); 
                osc.stop(ctx.currentTime + 0.5); 
            } else if(type === "success") {
                osc.frequency.setValueAtTime(587, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.1, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); 
                osc.start(); 
                osc.stop(ctx.currentTime + 0.3); 
            }
        } catch(e) {
            console.log("Audio not supported or blocked.");
        }
    }

    function makeEmptyStudent(id) {
        return { 
            id: id, 
            name: "", 
            className: "", 
            phone: "", 
            paid: 0, 
            notes: "", 
            rank: "normal", 
            joinedDate: nowDateStr(), 
            attendanceDates: [] 
        };
    }

    // ==== FIX 1: الدوال دي لازم تبقى Global عشان الواجهة تشوفها ====
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
        const target = $("sec" + tabId); 
        if(target) target.classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = $("btnTab" + tabId); 
        if(activeBtn) activeBtn.classList.add('active');
    };

    window.extOpen = function(id) {
        if(!id || !students[String(id)]) {
            showToast(currentLang === 'ar' ? "الطالب غير مسجل" : "Student not found", "err");
            return;
        }
        window.switchTab('Home'); // بيضمن إنك ترجع للرئيسية الأول
        $("searchAny").value = ""; 
        if($("searchMsg")) $("searchMsg").style.display = "none";
        
        updateStudentUI(String(id)); 
        const card = document.querySelector(".studentCard"); 
        if(card) card.scrollIntoView({behavior:"smooth", block:"start"}); 
    };

    // ==========================================
    // 5. DATA MANAGEMENT (Storage Layer)
    // ==========================================
    function saveAll() {
        try {
            localStorage.setItem(K_STUDENTS, JSON.stringify(students));
            localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
            localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
            localStorage.setItem(K_GROUP_FEES, JSON.stringify(groupFees)); 
            localStorage.setItem(K_EXPENSES, JSON.stringify(expensesByDate));
            localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
            updateTopStats(); 
            updateFinanceSummary(); 
            renderCharts();
        } catch(e) { 
            console.error("Quota Exceeded", e);
            showToast("الذاكرة ممتلئة! يرجى حذف الخلفية لتوفير مساحة", "err"); 
        }
    }

    function loadAll() {
        try {
            students       = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}");
            revenueByDate  = JSON.parse(localStorage.getItem(K_REVENUE) || "{}");
            expensesByDate = JSON.parse(localStorage.getItem(K_EXPENSES) || "{}");
            attByDate      = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}");
            groupFees      = JSON.parse(localStorage.getItem(K_GROUP_FEES) || "{}");
            deletedStudents= JSON.parse(localStorage.getItem(K_DELETED) || "{}");
            
            applyTheme(localStorage.getItem(K_THEME) || "classic");
            
            const savedBg = localStorage.getItem(K_BG_IMAGE); 
            if(savedBg) { 
                document.body.style.backgroundImage = `url('${savedBg}')`; 
                document.body.style.backgroundSize = "cover"; 
                document.body.style.backgroundAttachment = "fixed"; 
            }
            
            if($("centerNotebook")) {
                $("centerNotebook").value = localStorage.getItem(K_NOTEBOOK) || "";
            }
            
            updateTopStats(); 
            updateFinanceSummary(); 
            renderCharts();
        } catch(e) { 
            console.error("Data Load Error", e);
        }
    }

    function ensureBase500() {
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { 
            if(!students[String(i)]) {
                students[String(i)] = makeEmptyStudent(i); 
            }
        }
        saveAll();
    }

    // ==========================================
    // 6. UI & AUTHENTICATION LOGIC
    // ==========================================
    function checkAuth() {
        if(localStorage.getItem(K_AUTH) === "1") {
            currentUserRole = localStorage.getItem(K_ROLE) || "admin";
            $("loginBox").classList.add("hidden");
            $("appBox").classList.remove("hidden");
            showApp();
        } else {
            $("loginBox").classList.remove("hidden");
            $("appBox").classList.add("hidden");
        }
    }

    function showApp() {
        applyPermissions();
        $("reportDate").value = nowDateStr();
        renderReport(nowDateStr());
        updateTopStats();
        window.switchTab('Home');
    }

    function applyPermissions() {
        const isAdmin = (currentUserRole === "admin");
        document.querySelectorAll(".adminOnly").forEach(el => {
            if(isAdmin) el.classList.remove("hidden"); 
            else el.classList.add("hidden"); 
        });
        if(!isAdmin) {
            if($("deleteStudentBtn")) $("deleteStudentBtn").classList.add("hidden");
            if($("correctPayBtn")) $("correctPayBtn").classList.add("hidden");
        }
    }

    function askAdminPass(cb) {
        $("customPassInput").value = "";
        passSuccessCallback = cb;
        $("customPassModal").classList.remove("hidden");
        setTimeout(() => $("customPassInput").focus(), 100);
    }

    function updateTopStats() {
        const filledCount = Object.values(students).filter(s => s.name || s.paid > 0).length;
        const todayCount = (attByDate[nowDateStr()] || []).length;
        const revenue = revenueByDate[nowDateStr()] || 0;
        
        if($("totalStudentsCount")) $("totalStudentsCount").textContent = filledCount;
        if($("todayCountTop")) $("todayCountTop").textContent = todayCount;
        
        if($("todayRevenue")) {
            $("todayRevenue").textContent = isRevHidden ? "******" : revenue + " ج";
        }
        if($("toggleRevBtn")) {
            $("toggleRevBtn").textContent = isRevHidden ? "👁️‍🗨️" : "👁️";
        }
    }

    function updateLiveFeed(st) {
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
    }

    // ==========================================
    // 7. STUDENT PROFILE & SMART STREAK
    // ==========================================
    function calculateSmartStreak(st) {
        if(!st.attendanceDates || st.attendanceDates.length === 0) return 0;
        let c = (st.className || "").trim();
        if(!c) c = "عام";
        
        let classDates = new Set();
        for(let d in attByDate) {
            for(let id of attByDate[d]) {
                let s = students[id];
                if(s && (s.className || "").trim() === c) { 
                    classDates.add(d); 
                    break; 
                }
            }
        }
        let sortedDates = Array.from(classDates).sort((a,b) => new Date(b) - new Date(a));
        
        let streak = 0;
        let today = nowDateStr();
        for(let d of sortedDates) {
            if(st.attendanceDates.includes(d)) {
                streak++;
            } else {
                if(d === today) continue; 
                break; 
            }
        }
        return streak;
    }

    function updateStudentUI(id) {
        currentId = id; 
        const st = students[id]; 
        if (!st) return; 
        
        $("studentIdPill").textContent = `ID: ${id}`;
        $("stName").value = st.name || ""; 
        $("stClass").value = st.className || ""; 
        $("stPhone").value = st.phone || ""; 
        $("stNotes").value = st.notes || ""; 
        
        const paid = st.paid || 0; 
        let stClassName = (st.className || "").trim();
        let req = stClassName && groupFees[stClassName] !== undefined ? toInt(groupFees[stClassName]) : 0;
        
        let remain = req - paid;
        let percent = req > 0 ? Math.min((paid/req)*100, 100) : 0;
        
        const card = document.querySelector(".studentCard");
        if(card) {
            card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
            if(req > 0) {
                if(paid >= req) card.classList.add("status-border-green");
                else if(paid > 0) card.classList.add("status-border-yellow");
                else card.classList.add("status-border-red");
            }
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

        let r = st.rank || "normal";
        $("rankNormalBtn").className = "st-rank-btn " + (r === "normal" ? "active-normal" : "");
        $("rankVipBtn").className = "st-rank-btn " + (r === "vip" ? "active-vip" : "");
        $("rankWarnBtn").className = "st-rank-btn " + (r === "warn" ? "active-warn" : "");

        const today = nowDateStr();
        const dates = st.attendanceDates || [];
        const isPresent = dates.includes(today);
        
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
        
        $("attList").innerHTML = dates.slice().reverse().slice(0,20).map(d => `<div class="item">${prettyDate(d)}</div>`).join("");
        
        if(dates.length === 0 && st.name) {
            $("newBadge").classList.remove("hidden"); 
        } else {
            $("newBadge").classList.add("hidden");
        }
    }

    function addAttendance(id, d) {
        const s = students[String(id)];
        if(!s) return { ok: false, msg: "Student not found" };
        
        if(!s.attendanceDates.includes(d)) {
            s.attendanceDates.push(d); 
            if(!attByDate[d]) attByDate[d] = []; 
            attByDate[d].push(id); 
            saveAll(); 
            updateLiveFeed(s);
            playSound("success");
            return { ok: true, msg: t("msg_att_ok") };
        }
        playSound("error");
        return { ok: false, msg: t("msg_att_warn") };
    }

    function removeAttendance(id, d) {
        const s = students[String(id)]; 
        if(!s) return;
        s.attendanceDates = s.attendanceDates.filter(date => date !== d);
        if(attByDate[d]) {
            attByDate[d] = attByDate[d].filter(x => x !== id);
        }
        saveAll();
    }

    // ==========================================
    // 8. FINANCIAL & ANALYTICS MODULE
    // ==========================================
    function updateFinanceSummary() {
        const today = nowDateStr();
        const tRev = revenueByDate[today] || 0;
        const tExp = (expensesByDate[today] || []).reduce((sum, ex) => sum + ex.amount, 0);
        
        if($("todayNetProfit")) {
            $("todayNetProfit").textContent = (tRev - tExp);
        }

        const currentMonth = today.slice(0, 7); 
        let mRev = 0;
        let mExp = 0;
        
        for(let d in revenueByDate) { 
            if(d.startsWith(currentMonth)) mRev += revenueByDate[d]; 
        }
        
        for(let d in expensesByDate) { 
            if(d.startsWith(currentMonth)) { 
                expensesByDate[d].forEach(ex => mExp += ex.amount); 
            } 
        }
        
        if($("monthNetProfit")) {
            $("monthNetProfit").textContent = (mRev - mExp);
        }
    }

    function renderCharts() {
        const box = $("weeklyChartBox"); 
        if(!box) return;
        
        let days = []; 
        for(let i=6; i>=0; i--) { 
            let d = new Date(); 
            d.setDate(d.getDate() - i); 
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
        
        if(maxNet <= 0) maxNet = 100; // Default scale if no revenue
        
        let html = "";
        chartData.forEach(item => {
            let h = Math.max(5, (item.net / maxNet) * 100);
            let dayName = new Date(item.date).toLocaleDateString(currentLang==='ar'?'ar-EG':'en-US', {weekday: 'short'});
            let barColor = item.net > 0 ? "var(--success)" : "#ccc";
            
            html += `
            <div class="chart-bar-wrap">
                <span style="font-size:10px; color:#666; margin-bottom:5px; font-weight:bold;">${item.net}</span>
                <div class="chart-bar" style="height:${h}%; background:${barColor};"></div>
                <div class="chart-label">${dayName}</div>
            </div>`;
        });
        box.innerHTML = html;
    }

    // ==========================================
    // 9. TABLE & SEARCH ENGINE
    // ==========================================
    function renderList() {
        const fClass = $("filterClass").value;
        const fStatus = $("filterStatus").value;
        const fAttend = $("filterAttend").value;
        
        const sel = $("filterClass");
        
        if(sel.options.length <= 1) { 
            const allClasses = new Set();
            Object.values(students).forEach(s => { 
                if(s.name && s.className) allClasses.add(s.className.trim()); 
            });
            allClasses.forEach(c => { 
                const opt = document.createElement("option"); 
                opt.value = c; 
                opt.innerText = c; 
                sel.appendChild(opt); 
            });
        }

        const filled = Object.values(students).filter(s => s.name || s.paid > 0);
        const today = nowDateStr(); 

        currentFilteredList = filled.filter(s => {
            if(fClass !== "all" && s.className !== fClass) return false;
            
            let req = groupFees[(s.className || "").trim()] || 0;
            
            if(fStatus === "paid" && (s.paid < req || req === 0)) return false;
            if(fStatus === "partial" && (s.paid === 0 || s.paid >= req)) return false;
            if(fStatus === "unpaid" && s.paid > 0) return false;
            
            const isP = (s.attendanceDates || []).includes(today);
            if(fAttend === "present" && !isP) return false;
            if(fAttend === "absent" && isP) return false;
            
            return true;
        });

        const q = $("tableSearchInp").value.toLowerCase();
        if(q) {
            currentFilteredList = currentFilteredList.filter(s => 
                (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q)
            );
        }
        
        currentPage = 1; 
        renderPage();
    }

    function renderPage() {
        const tb = $("allStudentsTable").querySelector("tbody"); 
        tb.innerHTML = "";
        
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = currentFilteredList.slice(start, end);
        const today = nowDateStr();

        pageItems.forEach(s => {
            const tr = document.createElement("tr");
            
            let req = groupFees[(s.className || "").trim()] || 0;
            let percent = req > 0 ? Math.min((s.paid/req)*100, 100) : 0;
            let pBar = `<div style="width:100%; background:#eee; height:5px; border-radius:3px;"><div style="width:${percent}%; height:100%; background:var(--success); border-radius:3px;"></div></div>`;
            
            const attendTxt = (s.attendanceDates || []).includes(today) ? "✅" : "➖";
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');

            tr.innerHTML = `
                <td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td>
                <td>${s.id}</td>
                <td><b>${s.name}</b>${rankIcon}</td>
                <td><span class="badge" style="background:var(--primary);">${s.className}</span></td>
                <td>${s.paid} ج ${pBar}</td>
                <td>${attendTxt}</td>`;
            
            tr.onclick = (e) => { 
                if(e.target.type !== "checkbox") { 
                    window.extOpen(s.id); 
                } 
            };
            tb.appendChild(tr);
        });
        
        $("pageIndicator").textContent = `${currentPage} / ${Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1}`;
        $("prevPageBtn").disabled = (currentPage === 1);
        $("nextPageBtn").disabled = (end >= currentFilteredList.length);
    }

    function renderSimpleTable() {
        const tb = $("simpleStudentsTable").querySelector("tbody"); 
        if(!tb) return; 
        tb.innerHTML = "";
        
        Object.values(students).filter(s => s.name || s.paid > 0).forEach(s => {
            const tr = document.createElement("tr");
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');
            
            tr.innerHTML = `<td>${s.id}</td><td><b>${s.name}</b>${rankIcon}</td><td>${s.className}</td>`;
            tr.style.cursor = "pointer";
            
            tr.onclick = () => { 
                $("allStudentsModal").classList.add("hidden"); 
                window.extOpen(s.id); 
            };
            tb.appendChild(tr);
        });
    }

    function handleBulk() {
        const boxes = document.querySelectorAll(".stCheckbox:checked");
        if($("selectedCount")) $("selectedCount").textContent = boxes.length;
        
        if(boxes.length > 0) {
            $("bulkActionBar").classList.remove("hidden");
        } else {
            $("bulkActionBar").classList.add("hidden");
        }
    }

    function renderReport(d) {
        const list = $("reportList"); 
        if(!list) return;
        
        const ids = attByDate[d] || [];
        const rev = revenueByDate[d] || 0;
        const expArr = expensesByDate[d] || [];
        const totalExp = expArr.reduce((sum, ex) => sum + ex.amount, 0);
        
        if($("reportDateLabel")) $("reportDateLabel").textContent = prettyDate(d);
        if($("reportCount")) $("reportCount").textContent = ids.length;
        if($("reportMoney")) $("reportMoney").textContent = rev;
        if($("reportExpense")) $("reportExpense").textContent = totalExp;
        
        let groups = {}; 
        ids.forEach(id => {
            const st = students[id]; 
            let c = (st && st.className) ? st.className.trim() : "عام";
            if(!groups[c]) groups[c] = []; 
            groups[c].push(id);
        });
        
        let html = "";
        for(let g in groups) {
            html += `
            <div class="card" style="margin-top:10px; border-right:4px solid var(--primary); padding:10px;">
                <b style="color:var(--primary);">🏷️ ${g}</b> (${groups[g].length})<br>
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">
                    ${groups[g].map(id => `<span class="badge" style="cursor:pointer;" onclick="window.switchTab('Home'); window.extOpen('${id}')">#${id}</span>`).join("")}
                </div>
            </div>`;
        }
        
        if(expArr.length > 0) {
            html += `
            <h4 style="color:var(--danger); margin-top:15px;">${t("wa_exp")}</h4>
            <ul style="font-size:14px; color:#d9534f; list-style: inside;">`;
            
            expArr.forEach(ex => { 
                html += `<li>${ex.amount} ج - ${ex.reason}</li>`; 
            });
            html += `</ul>`;
        }
        
        list.innerHTML = html || `<div class="mutedCenter">${t("wait_scan")}</div>`;
    }

    function renderBinList() {
        const bl = $("binList"); 
        if(!bl) return; 
        
        const ids = Object.keys(deletedStudents);
        if(ids.length === 0) { 
            bl.innerHTML = `<div class="mutedCenter">Empty</div>`; 
            return; 
        }
        
        bl.innerHTML = ids.map(id => { 
            const s = deletedStudents[id]; 
            return `
            <div class="item flexBetween" style="margin-bottom:8px;">
                <b>${s.name} (${id})</b> 
                <button class="btn success smallBtn" onclick="window.restoreSt(${id})">استرجاع</button>
            </div>`; 
        }).join("");
    }

    // ==========================================
    // 10. SYSTEM THEME & LANGUAGE APPLY
    // ==========================================
    function applyTheme(theme) {
        document.body.className = ""; 
        if(theme === "dark") {
            document.body.classList.add("theme-dark"); 
        } else if(theme === "glass") {
            document.body.classList.add("theme-glass");
        }
        localStorage.setItem(K_THEME, theme); 
        if($("themeSelector")) $("themeSelector").value = theme;
    }

    function applyLanguage() {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
        
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if(dict[key] && dict[key][currentLang]) {
                el.innerHTML = dict[key][currentLang];
            }
        });
        
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if(dict[key] && dict[key][currentLang]) {
                el.placeholder = dict[key][currentLang];
            }
        });
        
        const langBtn = $("changeLangBtn");
        if(langBtn) {
            langBtn.innerText = currentLang === "ar" ? "🌐 تغيير اللغة (Ar / En)" : "🌐 Switch Language";
        }
        
        const nav = document.querySelector('.bottom-nav');
        if(nav) {
            nav.style.flexDirection = currentLang === "ar" ? "row" : "row-reverse";
        }
    }

    // ==========================================
    // 11. BINDINGS & EVENT LISTENERS
    // ==========================================
    
    // Auth & Login
    on("loginBtn", "click", function() {
        const u = $("user").value.trim();
        const p = $("pass").value.trim();
        
        if(u === ADMIN_USER && p === ADMIN_PASS) { 
            localStorage.setItem(K_AUTH, "1"); 
            localStorage.setItem(K_ROLE, "admin"); 
            checkAuth(); 
        } else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) { 
            localStorage.setItem(K_AUTH, "1"); 
            localStorage.setItem(K_ROLE, "assistant"); 
            checkAuth(); 
        } else { 
            showToast(t("msg_err_pass"), "err"); 
        }
    });

    on("logoutBtn", "click", () => { 
        localStorage.removeItem(K_AUTH); 
        location.reload(); 
    });

    on("togglePass", "click", () => { 
        const p = $("pass"); 
        p.type = p.type === "password" ? "text" : "password"; 
    });

    // Custom Password Modal
    on("customPassConfirm", "click", function() {
        if($("customPassInput").value === ADMIN_PASS) { 
            $("customPassModal").classList.add("hidden"); 
            if(passSuccessCallback) passSuccessCallback(); 
        } else { 
            showToast(t("msg_err_pass"), "err"); 
        }
    });

    on("customPassCancel", "click", () => {
        $("customPassModal").classList.add("hidden");
    });

    // ==== FIX 2: Eye Icon Fix (إخفاء الإيرادات) ====
    on("toggleRevBtn", "click", function(e) {
        if(e) e.stopPropagation();
        isRevHidden = !isRevHidden;
        updateTopStats();
    });

    // Quick Actions
    on("quickAttendBtn", "click", () => {
        const id = toInt($("quickAttendId").value); 
        if(!id || !students[String(id)]) return showToast("الطالب غير مسجل", "err");
        
        const res = addAttendance(id, nowDateStr());
        showToast(res.msg, res.ok ? "success" : "warning");
        updateStudentUI(id); 
        updateTopStats(); 
        $("quickAttendId").value = "";
        $("quickAttendId").focus();
    });

    // ==== FIX 3: فتح الطالب من زرار البحث الشامل ====
    on("openBtn", "click", () => {
        const id = toInt($("openId").value);
        if(id) window.extOpen(id);
    });

    on("searchAny", "input", (e) => {
        const q = e.target.value.toLowerCase();
        if(!q) { 
            $("searchMsg").style.display="none"; 
            return; 
        }
        
        const found = Object.values(students).filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && s.phone.includes(q))
        ).slice(0,5);
        
        $("searchMsg").style.display = "block";
        $("searchMsg").innerHTML = found.map(s => 
            `<div class="item" onclick="window.extOpen(${s.id})"><b>${s.name}</b> (#${s.id})</div>`
        ).join("");
    });

    // Student Operations
    on("addNewBtn", "click", () => {
        const id = toInt($("newId").value);
        if(!id || (students[String(id)] && students[String(id)].name)) {
            return showToast("الكود مستخدم بالفعل", "err");
        }
        
        students[String(id)] = makeEmptyStudent(id); 
        if(id > BASE_MAX_ID) extraIds.push(id);
        
        saveAll(); 
        window.extOpen(id); 
        showToast(t("msg_added"));
    });

    on("saveStudentBtn", "click", () => {
        if(!currentId) return;
        const s = students[currentId]; 
        
        s.name = $("stName").value; 
        s.className = $("stClass").value; 
        s.phone = $("stPhone").value;
        
        saveAll(); 
        showToast(t("msg_saved"));
    });

    // ==== FIX 4: برمجة زراير (عادي - VIP - إنذار) ====
    on("rankNormalBtn", "click", () => {
        if(!currentId) return;
        students[currentId].rank = "normal";
        saveAll(); updateStudentUI(currentId); showToast("تم التحديث");
    });

    on("rankVipBtn", "click", () => {
        if(!currentId) return;
        students[currentId].rank = "vip";
        saveAll(); updateStudentUI(currentId); showToast("VIP ⭐");
    });

    on("rankWarnBtn", "click", () => {
        if(!currentId) return;
        students[currentId].rank = "warn";
        saveAll(); updateStudentUI(currentId); showToast("إنذار ⚠️", "warning");
    });

    on("markTodayBtn", "click", () => { 
        if(currentId) { 
            addAttendance(currentId, nowDateStr()); 
            updateStudentUI(currentId); 
            renderReport(nowDateStr()); 
        }
    });

    on("unmarkTodayBtn", "click", () => { 
        if(currentId) { 
            removeAttendance(currentId, nowDateStr());
            updateStudentUI(currentId); 
            renderReport(nowDateStr()); 
        }
    });

    on("addPaymentBtn", "click", () => {
        if(!currentId) return;
        const v = toInt($("newPaymentInput").value); 
        if(!v) return;
        
        const st = students[currentId]; 
        st.paid += v;
        
        revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()] || 0) + v;
        saveAll(); 
        updateStudentUI(currentId);
        
        let req = groupFees[(st.className || "").trim()] || 0;
        if(req > 0 && st.paid >= req) {
            fireConfetti();
        }
        
        playSound("money");
        showToast(t("msg_deposit"));

        // ==== FIX 5: رسالة واتس الإيداع للمستلم ====
        if(st.phone) {
            const msg = `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} ج بنجاح ✅\nإجمالي المدفوع: ${st.paid} ج.\n\n-- إدارة السنتر --`;
            setTimeout(() => { 
                window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank'); 
            }, 1000);
        }
    });

    on("correctPayBtn", "click", () => {
        if(!currentId) return; 
        const v = toInt(prompt(currentLang==='ar' ? "قيمة الخصم:" : "Deduct amount:")); 
        if(!v) return;
        
        students[currentId].paid = Math.max(0, students[currentId].paid - v);
        revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()] || 0) - v);
        
        saveAll(); 
        showToast(t("msg_discount"), "warning"); 
        updateStudentUI(currentId); 
        renderReport(nowDateStr()); 
        renderCharts();
    });

    on("deleteStudentBtn", "click", () => {
        if(!currentId) return;
        
        if(!confirm(currentLang==='ar' ? "⚠️ متأكد من الحذف نهائياً؟" : "⚠️ Are you sure you want to delete?")) return;
        
        const targetId = currentId;
        const st = students[targetId]; 
        const backup = JSON.parse(JSON.stringify(st));
        
        let deducted = 0; 
        if(st.paid > 0 && confirm(currentLang==='ar' ? 'خصم مدفوعاته من إيراد اليوم؟' : 'Deduct from revenue?')) {
            deducted = st.paid;
        }
        
        revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()] || 0) - deducted;
        deletedStudents[targetId] = backup; 
        
        students[targetId] = makeEmptyStudent(targetId);
        if(targetId > BASE_MAX_ID) { 
            delete students[targetId]; 
            extraIds = extraIds.filter(x => x !== targetId); 
        }
        
        saveAll(); 
        updateStudentUI(null); 
        window.switchTab('Home');
        
        showUndoToast(t("msg_deleted"), () => {
            students[targetId] = backup; 
            delete deletedStudents[targetId];
            revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()] || 0) + deducted;
            saveAll(); 
            window.extOpen(targetId); 
            renderReport(nowDateStr()); 
            renderCharts();
            showToast(t("msg_undo"));
        });
    });

    on("addNoteBtn", "click", () => {
        if(!currentId) return; 
        const txt = $("newNoteInp").value.trim(); 
        if(!txt) return;
        
        const now = new Date(); 
        const stamp = `[${now.toISOString().split('T')[0]}]`;
        students[currentId].notes = `${stamp} : ${txt}\n${students[currentId].notes || ""}`;
        
        saveAll(); 
        updateStudentUI(currentId); 
        showToast(t("msg_saved"));
    });

    on("waBtn", "click", () => { 
        const ph = $("stPhone").value; 
        if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); 
    });

    // Settings & Config
    on("saveExpenseBtn", "click", () => {
        const a = toInt($("expenseAmtInp").value);
        const r = $("expenseReasonInp").value.trim();
        
        if(!a || !r) return showToast("يرجى ملء كافة البيانات", "err");
        
        const today = nowDateStr(); 
        if(!expensesByDate[today]) expensesByDate[today] = [];
        
        expensesByDate[today].push({amount:a, reason:r}); 
        saveAll();
        
        $("expenseAmtInp").value = ""; 
        $("expenseReasonInp").value = ""; 
        
        showToast(t("msg_exp_saved")); 
        renderReport(today);
    });

    on("openGroupFeesBtn", "click", () => {
        askAdminPass(() => {
            const groups = new Set(); 
            Object.values(students).forEach(s => { 
                if(s.className) groups.add(s.className.trim()); 
            });
            
            if(groups.size === 0) groups.add("عام");
            
            let h = ""; 
            groups.forEach(g => {
                h += `
                <div class="group-fee-row">
                    <label>📘 ${g}</label>
                    <div><input type="number" class="inp g-fee-inp" data-group="${g}" value="${groupFees[g]||0}"> ج</div>
                </div>`;
            });
            
            $("groupFeesList").innerHTML = h; 
            $("groupFeesModal").classList.remove("hidden");
        });
    });

    on("saveGroupFeesBtn", "click", () => {
        document.querySelectorAll(".g-fee-inp").forEach(i => {
            groupFees[i.dataset.group] = toInt(i.value);
        });
        
        saveAll(); 
        $("groupFeesModal").classList.add("hidden"); 
        showToast(t("msg_saved"));
        
        if(currentId) updateStudentUI(currentId);
    });

    on("changeLangBtn", "click", () => { 
        currentLang = (currentLang === "ar" ? "en" : "ar"); 
        localStorage.setItem(K_LANG, currentLang); 
        applyLanguage(); 
    });

    on("themeSelector", "change", (e) => {
        applyTheme(e.target.value);
    });

    // Background Management
    if($("bgInput")) {
        $("bgInput").addEventListener("change", (e) => {
            const file = e.target.files[0]; 
            if(!file) return; 
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgData = event.target.result;
                document.body.style.backgroundImage = `url('${imgData}')`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundAttachment = "fixed";
                localStorage.setItem(K_BG_IMAGE, imgData);
                showToast("تم تغيير خلفية السنتر 🖼️");
            }; 
            reader.readAsDataURL(file);
        });
    }

    if($("removeBgBtn")) {
        $("removeBgBtn").addEventListener("click", () => {
            document.body.style.backgroundImage = "none";
            localStorage.removeItem(K_BG_IMAGE);
            showToast("تم إزالة الخلفية 🗑️");
        });
    }

    // Reports & WhatsApp
    on("reportBtn", "click", () => {
        renderReport($("reportDate").value);
    });

    on("copyReportBtn", "click", () => {
        const d = $("reportDate").value || nowDateStr();
        const ids = attByDate[d] || []; 
        const rev = revenueByDate[d] || 0;
        const expArr = expensesByDate[d] || [];
        const totalExp = expArr.reduce((sum, ex) => sum + ex.amount, 0);

        let txt = `📊 *${t("report_title")}: ${prettyDate(d)}*\n\n`;
        
        let groups = {};
        ids.forEach(id => { 
            let c = (students[id] && students[id].className) ? students[id].className.trim() : "عام"; 
            if(!groups[c]) groups[c] = 0; 
            groups[c]++; 
        });
        
        for(let g in groups) { 
            txt += `📘 ${g}: ${groups[g]} طالب\n`; 
        }
        
        // ==== FIX 6: تعديل جملة الحضور للمدير ====
        txt += `\n👥 إجمالي الحضور اليوم: ${ids.length}`;
        txt += `\n💰 ${t("badge_rev")} ${rev} ج`;
        
        if(expArr.length > 0) {
            txt += `\n\n🔻 *${t("wa_exp")}:*`;
            expArr.forEach(ex => { 
                txt += `\n- ${ex.amount} ج (${ex.reason})`; 
            });
            txt += `\n\n💵 *${t("wa_net")}: ${rev - totalExp} ج*`;
        }
        
        txt += `\n\n-- إدارة السنتر --`;
        
        navigator.clipboard.writeText(txt).then(() => {
            showToast(t("msg_copied"));
        });
    });

    // Excel Logic
    on("exportExcelBtn", "click", () => {
        if (typeof XLSX === "undefined") {
            return showToast("برجاء التأكد من اتصال الإنترنت لمكتبة Excel", "err");
        }
        
        const filled = Object.values(students).filter(s => s.name).sort((a,b) => a.id - b.id);
        const wsData = [["ID", "Name", "Class", "Phone", "Paid", "Rank", "Attendance"]];
        
        filled.forEach(s => {
            wsData.push([s.id, s.name, s.className, s.phone, s.paid, s.rank, (s.attendanceDates||[]).join(",")]);
        });
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
        XLSX.writeFile(wb, `VPRO_Data_${nowDateStr()}.xlsx`);
        
        localStorage.setItem(K_LAST_BACKUP, nowDateStr()); 
        if($("btnTabAdmin")) $("btnTabAdmin").classList.remove("needs-backup");
        
        showToast(t("msg_saved"));
    });

    on("importExcelBtnFake", "click", () => $("importExcelInput").click());
    
    on("importExcelInput", "change", async (e) => {
        const f = e.target.files[0]; 
        if(!f) return; 
        
        const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        if(!confirm(currentLang==='ar' ? 'تحذير: سيتم مسح البيانات الحالية واستبدالها!' : 'Warning: Overwrite current data?')) {
            return;
        }
        
        students = {}; attByDate = {}; revenueByDate = {}; expensesByDate = {};
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
            students[String(i)] = makeEmptyStudent(i);
        }
        
        rows.forEach(row => {
            const id = toInt(row["ID"] || row["كود"]);
            if(id) {
                let st = makeEmptyStudent(id);
                st.name = row["Name"] || row["الاسم"] || ""; 
                st.className = row["Class"] || row["المجموعة"] || "";
                st.phone = String(row["Phone"] || row["رقم الموبايل"] || ""); 
                st.paid = toInt(row["Paid"] || row["المدفوع"]);
                st.rank = row["Rank"] || row["التصنيف"] || "normal";
                
                let h = row["History"] || row["سجل الحضور"] || "";
                if(h) {
                    st.attendanceDates = h.split(",").map(d => d.trim());
                    st.attendanceDates.forEach(d => { 
                        if(!attByDate[d]) attByDate[d] = []; 
                        attByDate[d].push(String(id)); 
                    });
                }
                students[String(id)] = st;
            }
        });
        saveAll(); 
        showToast(t("msg_saved")); 
        setTimeout(() => location.reload(), 1000);
    });

    // Modals & Bins
    on("openBinBtn", "click", () => { 
        renderBinList(); 
        $("recycleBinModal").classList.remove("hidden"); 
    });
    
    on("closeBinBtn", "click", () => {
        $("recycleBinModal").classList.add("hidden");
    });
    
    on("emptyBinBtn", "click", () => { 
        if(confirm(currentLang==='ar' ? "حذف السلة نهائياً؟" : "Empty completely?")) { 
            deletedStudents = {}; 
            saveAll(); 
            renderBinList(); 
        }
    });

    window.restoreSt = (id) => { 
        const st = deletedStudents[String(id)]; 
        if(!st) return;
        students[String(id)] = st; 
        delete deletedStudents[String(id)]; 
        saveAll(); 
        renderBinList(); 
        showToast(t("msg_saved")); 
        window.extOpen(id); 
    };

    on("openAllStudentsBtn", "click", () => { 
        renderSimpleTable(); 
        $("allStudentsModal").classList.remove("hidden"); 
    });
    
    on("closeModalBtn", "click", () => {
        $("allStudentsModal").classList.add("hidden");
    });

    on("todayCountTopCard", "click", () => {
        const today = nowDateStr(); 
        const ids = attByDate[today] || [];
        
        if(ids.length === 0) { 
            showToast(currentLang==='ar' ? "لا يوجد حضور" : "No attendance", "warning"); 
            return; 
        }
        
        let groups = {};
        ids.forEach(id => { 
            const st = students[id]; 
            if(st) { 
                let c = st.className ? st.className.trim() : "عام"; 
                if(!groups[c]) groups[c] = []; 
                groups[c].push(st); 
            } 
        });
        
        let html = "";
        for(let g in groups) { 
            html += `
            <div style="background:#f8f9fa; border-radius:10px; padding:15px; margin-bottom:15px; border-right: 5px solid var(--primary);">
                <h4 style="color:var(--primary); margin-top:0; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">📘 ${g} (${groups[g].length})</h4>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${groups[g].map(s => `
                        <div class="badge" style="background:#fff; color:#333; border:1px solid #ccc; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;" onclick="$('todayModal').classList.add('hidden'); window.extOpen('${s.id}')">
                            #${s.id} - ${s.name || 'بدون اسم'}
                        </div>`
                    ).join("")}
                </div>
            </div>`; 
        }
        $("todayModalBody").innerHTML = html; 
        $("todayModal").classList.remove("hidden");
    });

    on("closeTodayModal", "click", () => {
        $("todayModal").classList.add("hidden");
    });

    // Reset Functions
    on("resetTermBtn", "click", () => {
        askAdminPass(() => {
            if(confirm(currentLang==='ar' ? "تصفير فلوس وغياب الترم بالكامل؟" : "Reset all fees and attendance?")) {
                for(let k in students) { 
                    students[k].paid = 0; 
                    students[k].attendanceDates = []; 
                }
                attByDate = {}; 
                revenueByDate = {}; 
                expensesByDate = {}; 
                saveAll(); 
                location.reload();
            }
        });
    });

    on("resetBtn", "click", () => {
        askAdminPass(() => {
            if(confirm(currentLang==='ar' ? "مسح شامل وإعادة ضبط المصنع للسيستم بالكامل؟" : "Factory Reset the whole system?")) {
                localStorage.clear(); 
                location.reload();
            }
        });
    });

    // Global Listeners
    if($("filterClass")) $("filterClass").addEventListener("change", renderList);
    if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);
    if($("filterAttend")) $("filterAttend").addEventListener("change", renderList);
    if($("tableSearchInp")) $("tableSearchInp").addEventListener("input", renderList);
    
    on("prevPageBtn", "click", () => { 
        if(currentPage > 1) { 
            currentPage--; 
            renderPage(); 
        }
    });
    on("nextPageBtn", "click", () => { 
        currentPage++; 
        renderPage(); 
    });

    document.addEventListener("change", (e) => {
        if(e.target.classList.contains("stCheckbox")) handleBulk();
        if(e.target.id === "selectAllCheckbox") { 
            document.querySelectorAll(".stCheckbox").forEach(c => c.checked = e.target.checked); 
            handleBulk(); 
        }
    });

    on("bulkAttendBtn", "click", () => { 
        let count = 0; 
        document.querySelectorAll(".stCheckbox:checked").forEach(b => { 
            if(addAttendance(b.dataset.id, nowDateStr()).ok) count++; 
        }); 
        showToast(t("msg_att_ok")); 
        renderList(); 
        handleBulk(); 
    });

    on("bulkAbsentBtn", "click", () => { 
        document.querySelectorAll(".stCheckbox:checked").forEach(b => {
            removeAttendance(b.dataset.id, nowDateStr());
        }); 
        showToast(t("msg_att_warn"), "warning"); 
        renderList(); 
        handleBulk();
    });

    // ==========================================
    // 12. INITIALIZATION (START ENGINE)
    // ==========================================
    
    function checkDailyBackup() {
        const last = localStorage.getItem(K_LAST_BACKUP);
        if(last !== nowDateStr()) {
            const adminTab = $("btnTabAdmin");
            if(adminTab) adminTab.classList.add("needs-backup");
            setTimeout(() => {
                showToast(currentLang==='ar' ? '⚠️ تذكير: لم تقم بتصدير نسخة Excel اليوم!' : '⚠️ Backup reminder!', 'warning');
            }, 3000);
        }
    }

    function checkQR() {
        const urlParams = new URLSearchParams(window.location.search);
        const qrId = toInt(urlParams.get("id"));
        if (qrId && students[String(qrId)]) { 
            addAttendance(qrId, nowDateStr()); 
            window.extOpen(qrId); 
            window.history.replaceState(null, null, window.location.pathname); 
        }
    }

    // Tab Routing
    on("btnTabHome", "click", () => window.switchTab('Home'));
    on("btnTabStudents", "click", () => { window.switchTab('Students'); renderList(); });
    on("btnTabRevenue", "click", () => { window.switchTab('Revenue'); renderCharts(); updateFinanceSummary(); });
    on("btnTabAdmin", "click", () => window.switchTab('Admin'));

    // Execute Startup Sequence
    loadAll(); 
    ensureBase500(); 
    checkAuth(); 
    applyLanguage(); 
    checkDailyBackup();
    setTimeout(checkQR, 500);

});
