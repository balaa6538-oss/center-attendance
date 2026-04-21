/* =============================================================================
   Center System V-PRO MAX (THE ULTIMATE SHIELD EDITION - PREMIUM UX)
   -----------------------------------------------------------------------------
   - 100% Full Translation Dictionary (Arabic / English)
   - Smart Consecutive Attendance (Group-based Streak)
   - Advanced Financial Module (Expenses, Daily/Monthly Net Profit)
   - Dynamic Group Fee Management (Package Builder)
   - Syllabus Map Module (Course Timeline & Tracker)
   - Premium UX: Error Shake, Edge Flash, Hold-To-Delete
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

    // مفاتيح التخزين المحلية
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
    const K_SYLLABUS     = "ca_syllabus_v1"; // مفتاح حفظ المنهج

    // ==========================================
    // 2. GLOBAL SYSTEM STATE
    // ==========================================
    let students         = {}; 
    let deletedStudents  = {}; 
    let extraIds         = []; 
    let attByDate        = {}; 
    let revenueByDate    = {}; 
    let groupFees        = {}; 
    let expensesByDate   = {};
    let syllabusData     = []; 
    
    let currentId        = null;
    let currentUserRole  = "admin";
    let currentPage      = 1;
    let currentFilteredList = [];
    let recentScans      = [];
    let isRevHidden      = false;
    let passSuccessCallback = null;
    let currentLang      = localStorage.getItem(K_LANG) || "ar";

    // ==========================================
    // 3. THE COMPREHENSIVE DICTIONARY
    // ==========================================
    const dict = {
       "shift_manager": { ar: "مسئول الشيفت:", en: "Shift Manager:" },
        "modal_shift_title": { ar: "👨‍💼 اختيار مسئول الشيفت", en: "👨‍💼 Select Shift Manager" },
        "plc_new_manager": { ar: "اسم المسئول الجديد...", en: "New manager name..." },
        "btn_add_manager": { ar: "إضافة", en: "Add" },
        "err_no_manager": { ar: "يرجى اختيار اسم مسئول الشيفت أولاً", en: "Please select a shift manager first!" },
       "drive_offline": { ar: "⚪ غير متصل", en: "⚪ Offline" },
        "drive_online": { ar: "🟢 متصل بالسحابة", en: "🟢 Cloud Connected" },
        "btn_drive_login": { ar: "ربط بجوجل درايف ☁️", en: "Connect Google Drive ☁️" },
        "btn_drive_connected": { ar: "متصل بالدرايف ✅", en: "Drive Connected ✅" },
        "btn_drive_restore": { ar: "استرجاع من السحاب 🔄", en: "Restore from Cloud 🔄" },
        "msg_sync_wait": { ar: "جاري حفظ نسخة احتياطية للسحابة... ⏳", en: "Saving backup to cloud... ⏳" },
        "msg_sync_done": { ar: "تم الحفظ بنجاح على الدرايف ✅", en: "Saved to Drive successfully ✅" },
        "msg_sync_auto": { ar: "تم تحديث النسخة الاحتياطية تلقائياً ☁️", en: "Auto-backup updated on cloud ☁️" },
        "lbl_last_sync": { ar: "آخر مزامنة: ", en: "Last Sync: " },
       "fin_month_exp": { ar: "صافي مصروفات الشهر", en: "Monthly Expenses" },
       "nav_syllabus": { ar: "المنهج", en: "Syllabus" },
       "tbl_remain": { ar: "المتبقي", en: "Remaining" },
        "modal_rev_today": { ar: "💰 تفاصيل إيراد اليوم", en: "💰 Today's Revenue Details" },
        "syll_update_title": { ar: "🗺️ تحديث خريطة المنهج (للمدير)", en: "🗺️ Update Syllabus (Admin)" },
        "syll_name_lbl": { ar: "اسم الشابتر / الدرس", en: "Chapter / Lesson Name" },
        "syll_status_lbl": { ar: "الحالة", en: "Status" },
        "syll_notes_lbl": { ar: "ملاحظات الحصة الأخيرة (للأسستنت والطلاب)", en: "Latest Session Notes" },
        "syll_map_title": { ar: "📍 خريطة سير المنهج", en: "📍 Syllabus Map" },
        "txt_no_rev": { ar: "لم يتم تسجيل أي إيرادات اليوم.", en: "No revenue recorded today." },
        "login_title": { ar: "دخول لوحة السنتر", en: "Center Login" },
        "login_desc": { ar: "الدخول للمسؤول فقط", en: "Admin Access Only" },
        "login_btn": { ar: "دخول", en: "Login" },
        "brand_name": { ar: "لوحة السنتر V-PRO", en: "V-PRO Dashboard" },
        "stat_students": { ar: "👥 مسجلين:", en: "👥 Enrolled:" },
        "stat_attend": { ar: "✅ حضور:", en: "✅ Attend:" },
        "stat_revenue": { ar: "💰 إيراد:", en: "💰 Revenue:" },
        "btn_logout": { ar: "خروج 🚪", en: "Logout 🚪" },
        "quick_title": { ar: "سريع (QR)", en: "Quick Record" },
        "btn_record": { ar: "سجل حضور", en: "Record" },
        "lbl_last_scan": { ar: "آخر حضور تم تسجيله ⏱️", en: "Recent Activity ⏱️" },
        "wait_scan": { ar: "بانتظار مسح كود...", en: "Waiting for scan..." },
        "search_title": { ar: "بحث شامل", en: "Global Search" },
        "btn_open": { ar: "فتح", en: "Open" },
        "search_plc": { ar: "الاسم / الرقم / الكود...", en: "Name / Phone / ID..." },
        "search_tbl_plc": { ar: "🔍 ابحث في الجدول...", en: "🔍 Search table..." },
        "add_title": { ar: "+ إضافة طالب جديد", en: "+ New Student" },
        "btn_add_open": { ar: "إضافة وفتح", en: "Add & Open" },
        "st_details": { ar: "بيانات الطالب", en: "Student Information" },
        "badge_new": { ar: "جديد", en: "NEW" },
        "rank_normal": { ar: "🟢 عادي", en: "🟢 Normal" },
        "rank_warn": { ar: "⚠️ إنذار", en: "⚠️ Warning" },
        "lbl_name": { ar: "الاسم", en: "Name" },
        "lbl_class": { ar: "الصف / الباقة", en: "Package / Class" },
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
        "tbl_class": { ar: "الباقة", en: "Package" },
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
        "report_title": { ar: "تقرير الحضور والماليات", en: "Finance Report" },
        "btn_copy_wa": { ar: "نسخ التقرير للمدير 📋", en: "Copy for Manager 📋" },
        "btn_view": { ar: "عرض", en: "View Report" },
        "badge_date": { ar: "التاريخ:", en: "Date:" },
        "badge_count": { ar: "العدد:", en: "Count:" },
        "badge_rev": { ar: "إيراد:", en: "Revenue:" },
        "badge_exp": { ar: "مصروف:", en: "Expenses:" },
        "chart_title": { ar: "📈 لوحة أرباح الأسبوع", en: "📈 Weekly Chart" },
        "settings_title": { ar: "⚙️ إعدادات النظام", en: "⚙️ System Settings" },
        "note_title": { ar: "📝 مفكرة السنتر السريعة", en: "📝 Quick Notebook" },
        "note_plc_main": { ar: "اكتب ملاحظاتك هنا...", en: "Type your notes here..." },
        "set_data_title": { ar: "💾 البيانات والنسخ الاحتياطي", en: "💾 Data Management" },
        "btn_export_ex": { ar: "📥 تصدير البيانات (Excel)", en: "📥 Export to Excel" },
        "btn_import_ex": { ar: "📤 استيراد بيانات (Excel)", en: "📤 Import from Excel" },
        "btn_recycle": { ar: "🗑️ سلة المحذوفات", en: "🗑️ Recycle Bin" },
        "set_ui_title": { ar: "🎨 المظهر والتخصيص", en: "🎨 UI & Theme" },
        "lbl_theme": { ar: "ثيم البرنامج:", en: "App Theme:" },
        "theme_cls": { ar: "🔵 كلاسيك", en: "🔵 Classic" },
        "theme_dark": { ar: "🌑 ليلي", en: "🌑 Dark" },
        "theme_glass": { ar: "🧊 زجاجي", en: "🧊 Glass" },
        "btn_change_bg": { ar: "🖼️ تغيير الخلفية", en: "🖼️ Change Background" },
        "btn_change_lang": { ar: "🌐 تغيير اللغة (Ar / En)", en: "🌐 Switch Language" },
        "set_fin_title": { ar: "💰 إعدادات مالية", en: "💰 Package Pricing" },
        "btn_group_fees": { ar: "⚙️ إدارة الباقات والمصاريف", en: "⚙️ Manage Packages" },
        "set_danger_title": { ar: "⚠️ منطقة الخطر", en: "⚠️ Danger Zone" },
        "btn_reset_term": { ar: "🔄 تصفير الترم", en: "🔄 Reset Term Data" },
        "btn_factory_reset": { ar: "❌ مسح النظام بالكامل", en: "❌ Full Reset" },
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
        "modal_grp_fees": { ar: "⚙️ إدارة مصاريف الباقات/المجموعات", en: "⚙️ Manage Package Pricing" },
        "grp_fees_desc": { ar: "أضف الباقات هنا وسيتم عرضها للأسستنت أثناء تسجيل الطالب.", en: "Add packages here to display them to the assistant." },
        "btn_save_changes": { ar: "حفظ التعديلات 💾", en: "Save Changes 💾" },
        "msg_saved": { ar: "تم الحفظ بنجاح ✅", en: "Progress saved! ✅" },
        "msg_err_pass": { ar: "كلمة مرور خاطئة ❌", en: "Incorrect Password! ❌" },
        "msg_att_ok": { ar: "تم تسجيل الحضور ✅", en: "Attendance Recorded ✅" },
        "msg_att_warn": { ar: "حاضر مسبقاً ⚠️", en: "Already marked present! ⚠️" },
        "msg_added": { ar: "تم إضافة الطالب بنجاح ✅", en: "Student registered! ✅" },
        "msg_deleted": { ar: "تم حذف الطالب", en: "Student deleted" },
        "msg_undo": { ar: "تم التراجع بنجاح ✅", en: "Action Undone ✅" },
        "msg_copied": { ar: "تم نسخ التقرير 📋", en: "Report Copied 📋" },
        "txt_streak": { ar: "حصة متتالية", en: "Classes Streak" },
        "txt_paid_full": { ar: "✅ خالص (مكتمل)", en: "✅ Fully Paid" },
        "txt_free": { ar: "✅ بدون مصاريف", en: "✅ Free" },
        "wa_net": { ar: "💵 صافي الربح", en: "💵 Net Profit" },
        "wa_exp": { ar: "🔻 المصروفات", en: "🔻 Expenses" }
    };

    // ==========================================
    // 4. CORE UTILITY FUNCTIONS & PREMIUM UX
    // ==========================================
    function $(id) { return document.getElementById(id); }
    
    function on(id, event, handler) { 
        const el = $(id); 
        if(el) el.addEventListener(event, handler); 
    }

    function t(key) { return (dict[key] && dict[key][currentLang]) ? dict[key][currentLang] : key; }
    function nowDateStr() { return new Date().toISOString().split('T')[0]; }
    function prettyDate(d) { return d ? d.split("-").reverse().join("-") : "—"; }
    function toInt(v) { const n = parseInt(v); return isNaN(n) ? 0 : n; }

    function getTagColor(str) {
        if (!str) return '#3498db';
        const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    // -- Premium UX Functions --
    function triggerShake(inputId) {
        const el = $(inputId);
        if(el) {
            el.classList.remove("error-shake");
            void el.offsetWidth; // Refresh DOM to restart animation
            el.classList.add("error-shake");
            setTimeout(() => el.classList.remove("error-shake"), 400);
        }
    }

    function triggerEdgeFlash() {
        document.body.classList.add("flash-green");
        setTimeout(() => document.body.classList.remove("flash-green"), 500);
    }

    function showToast(msg, type = "success") {
        let container = $("toastContainer"); if(!container) return;
        const toast = document.createElement("div"); 
        toast.className = `toast toast-${type}`;
        let icon = type==='err' ? '❌' : (type==='warning' ? '⚠️' : '✅');
        toast.innerHTML = `<span style="margin-left:10px;">${icon}</span> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => { 
            toast.style.animation = "slideOut 0.3s forwards"; 
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    }

    function showUndoToast(msg, onUndo) {
        let container = $("toastContainer"); if(!container) return;
        const toast = document.createElement("div"); 
        toast.className = `toast toast-warning undo-toast`;
        const undoTxt = currentLang === 'ar' ? 'تراجع ↩️' : 'Undo ↩️';
        toast.innerHTML = `<span>⚠️ ${msg}</span> <button class="btn smallBtn" id="tempUndoBtn" style="margin-right:15px; padding:5px 10px;">${undoTxt}</button>`;
        container.appendChild(toast); 
        let isUndone = false;
        toast.querySelector("#tempUndoBtn").onclick = () => { 
            isUndone = true; onUndo(); toast.remove(); 
        };
        setTimeout(() => { 
            if(!isUndone) { 
                toast.style.animation = "slideOut 0.3s forwards"; 
                setTimeout(() => toast.remove(), 300); 
            } 
        }, 5000);
    }

    function fireConfetti() {
        const colors = ['#2ea44f', '#2f6bff', '#d69e2e', '#cf222e', '#9b59b6'];
        for(let i = 0; i < 35; i++) {
            const conf = document.createElement("div"); conf.className = "confetti";
            conf.style.left = Math.random() * 100 + "vw"; 
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.animationDuration = (Math.random() * 2 + 1) + "s"; 
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 3000);
        }
    }

    function playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            if(type === "money") { 
                osc.type = "sine"; 
                osc.frequency.setValueAtTime(1200, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); 
                osc.start(); osc.stop(ctx.currentTime + 0.5); 
            } else if(type === "success") {
                osc.frequency.setValueAtTime(587, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.1, ctx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); 
                osc.start(); osc.stop(ctx.currentTime + 0.3); 
            }
        } catch(e) {}
    }

    function makeEmptyStudent(id) {
        return { id: id, name: "", className: "", phone: "", paid: 0, notes: "", rank: "normal", joinedDate: nowDateStr(), attendanceDates: [] };
    }

    // ==========================================
    // 5. GLOBAL NAVIGATION & TABS
    // ==========================================
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
        
        window.switchTab('Home'); 
        if($("searchAny")) $("searchAny").value = ""; 
        if($("searchMsg")) $("searchMsg").style.display = "none";
        
        updateStudentUI(String(id)); 
        
        const card = document.querySelector(".studentCard"); 
        if(card) {
            setTimeout(() => {
                card.scrollIntoView({behavior: "smooth", block: "start"}); 
            }, 100);
        }
    };

    // ==========================================
    // 6. DATA MANAGEMENT (Storage Layer)
    // ==========================================
    function saveAll() {
        try {
            localStorage.setItem(K_STUDENTS, JSON.stringify(students));
            localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
            localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
            localStorage.setItem(K_GROUP_FEES, JSON.stringify(groupFees)); 
            localStorage.setItem(K_EXPENSES, JSON.stringify(expensesByDate));
            localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
            localStorage.setItem(K_SYLLABUS, JSON.stringify(syllabusData));
            updateTopStats(); updateFinanceSummary(); renderCharts();
        } catch(e) { 
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
            syllabusData   = JSON.parse(localStorage.getItem(K_SYLLABUS) || "[]");
            
            applyTheme(localStorage.getItem(K_THEME) || "classic");
            
            const savedBg = localStorage.getItem(K_BG_IMAGE); 
            if(savedBg) { 
                document.body.style.backgroundImage = `url('${savedBg}')`; 
                document.body.style.backgroundSize = "cover"; 
                document.body.style.backgroundAttachment = "fixed"; 
            }
            if($("centerNotebook")) $("centerNotebook").value = localStorage.getItem(K_NOTEBOOK) || "";
            
            updateTopStats(); updateFinanceSummary(); renderCharts();
        } catch(e) { console.error("Data Load Error", e); }
    }

    function ensureBase500() {
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { 
            if(!students[String(i)]) students[String(i)] = makeEmptyStudent(i); 
        }
        saveAll();
    }

    // ==========================================
    // 7. AUTHENTICATION & SECURITY
    // ==========================================
    function checkAuth() {
        const nav = document.querySelector('.bottom-nav');
        if(localStorage.getItem(K_AUTH) === "1") {
            currentUserRole = localStorage.getItem(K_ROLE) || "admin";
            $("loginBox").classList.add("hidden"); $("appBox").classList.remove("hidden");
            if(nav) nav.style.display = "flex"; // إظهار الشريط
            showApp();
        } else {
            $("loginBox").classList.remove("hidden"); $("appBox").classList.add("hidden");
            if(nav) nav.style.display = "none"; // إخفاء الشريط
        }
    }

    function showApp() {
        applyPermissions();
        if($("reportDate")) $("reportDate").value = nowDateStr();
        renderReport(nowDateStr());
        updateTopStats();
        populatePackages();
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
        if($("customPassInput")) $("customPassInput").value = "";
        passSuccessCallback = cb;
        if($("customPassModal")) $("customPassModal").classList.remove("hidden");
        setTimeout(() => { if($("customPassInput")) $("customPassInput").focus(); }, 100);
    }

    // ==========================================
    // 8. TOP STATISTICS & LIVE FEED
    // ==========================================
    function updateTopStats() {
        const studentValues = Object.values(students);
        let filledCount = 0;
        for (let i = 0; i < studentValues.length; i++) {
            if (studentValues[i].name || studentValues[i].paid > 0) filledCount++;
        }
        
        let todayCount = 0;
        if (attByDate[nowDateStr()]) todayCount = attByDate[nowDateStr()].length;
        
        const revenue = revenueByDate[nowDateStr()] || 0;
        
        if($("totalStudentsCount")) $("totalStudentsCount").textContent = filledCount;
        if($("todayCountTop")) $("todayCountTop").textContent = todayCount;
        
        if($("todayRevenue")) $("todayRevenue").textContent = isRevHidden ? "****** ج" : revenue + " ج";
        if($("toggleRevBtn")) $("toggleRevBtn").textContent = isRevHidden ? "👁️‍🗨️" : "👁️";
    }

    function updateLiveFeed(st) {
        let sName = st.name || "بدون اسم";
        let sClass = st.className || "عام";
        const timeStr = new Date().toLocaleTimeString(currentLang==='ar'?'ar-EG':'en-US', {hour:'2-digit', minute:'2-digit'});
        
        recentScans.unshift({ name: sName, id: st.id, cls: sClass, time: timeStr });
        if(recentScans.length > 5) recentScans.pop();
        
        const feed = $("liveFeedBox");
        if(feed) {
            let html = "";
            for (let i = 0; i < recentScans.length; i++) {
                const s = recentScans[i];
                let gColor = getTagColor(s.cls);
                html += `
                <div class="feed-item">
                    <span class="feed-time">${s.time}</span> 
                    <b>${s.name}</b> 
                    <span class="badge" style="background:${gColor}; border-color:${gColor}; color:#fff;">${s.cls}</span> 
                    <span>#${s.id}</span>
                </div>`;
            }
            feed.innerHTML = html;
        }
    }

    // ==========================================
    // 9. STUDENT PROFILE & SMART STREAK
    // ==========================================
    function calculateSmartStreak(st) {
        if(!st.attendanceDates || st.attendanceDates.length === 0) return 0;
        let c = st.className ? st.className.trim() : "عام";
        
        let classDates = new Set();
        for(let dateKey in attByDate) {
            let idsForDate = attByDate[dateKey];
            for(let i = 0; i < idsForDate.length; i++) {
                let s = students[idsForDate[i]];
                if(s && (s.className || "").trim() === c) { classDates.add(dateKey); break; }
            }
        }
        
        let sortedDates = Array.from(classDates).sort((a,b) => new Date(b) - new Date(a));
        let streak = 0;
        let today = nowDateStr();
        
        for(let i = 0; i < sortedDates.length; i++) {
            let d = sortedDates[i];
            if(st.attendanceDates.includes(d)) { streak++; } 
            else { if(d === today) continue; break; }
        }
        return streak;
    }

    function populatePackages() {
        const select = $("stClass");
        if (!select) return;
        
        let currentVal = select.value; 
        let html = `<option value="">-- اختر الباقة / المجموعة --</option>`;
        
        let hasGroups = false;
        for (let g in groupFees) {
            html += `<option value="${g}">${g}</option>`;
            hasGroups = true;
        }
        if(!hasGroups) html += `<option value="عام">عام</option>`;
        select.innerHTML = html;
        
        if(currentVal && groupFees[currentVal] !== undefined) {
            select.value = currentVal;
        }
    }

    function updateStudentUI(id) {
        currentId = id; const st = students[id]; if (!st) return; 
        
        if($("studentIdPill")) $("studentIdPill").textContent = `ID: ${id}`;
        if($("stName")) $("stName").value = st.name || ""; 
        if($("stClass")) $("stClass").value = st.className || ""; 
        if($("stPhone")) $("stPhone").value = st.phone || ""; 
        if($("stNotes")) $("stNotes").value = st.notes || ""; 
        
        const paid = st.paid || 0; 
        let stClassName = st.className ? st.className.trim() : "";
        let req = (stClassName && groupFees[stClassName] !== undefined) ? toInt(groupFees[stClassName]) : 0;
        
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
        if (remBox) {
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
        }

        let r = st.rank || "normal";
        if($("rankNormalBtn")) $("rankNormalBtn").className = "st-rank-btn " + (r === "normal" ? "active-normal" : "");
        if($("rankVipBtn")) $("rankVipBtn").className = "st-rank-btn " + (r === "vip" ? "active-vip" : "");
        if($("rankWarnBtn")) $("rankWarnBtn").className = "st-rank-btn " + (r === "warn" ? "active-warn" : "");

        const today = nowDateStr();
        const dates = st.attendanceDates || [];
        const isPresent = dates.includes(today);
        
        if($("todayStatus")) {
            $("todayStatus").textContent = isPresent ? t("btn_mark_present") : t("btn_mark_absent");
            $("todayStatus").style.color = isPresent ? "green" : "red";
        }
        if($("stAvatar")) {
            if(isPresent) $("stAvatar").classList.add("present");
            else $("stAvatar").classList.remove("present");
        }

        let streakCount = calculateSmartStreak(st);
        if($("daysCount")) $("daysCount").innerHTML = `🔥 ${streakCount} ${t("txt_streak")}`;
        
        if($("attList")) {
            let datesHtml = "";
            let reverseDates = dates.slice().reverse().slice(0,20);
            for(let i=0; i<reverseDates.length; i++) {
                datesHtml += `<div class="item">${prettyDate(reverseDates[i])}</div>`;
            }
            $("attList").innerHTML = datesHtml;
        }
        
        if($("newBadge")) {
            if(dates.length === 0 && st.name) $("newBadge").classList.remove("hidden"); 
            else $("newBadge").classList.add("hidden");
        }
    }

    function addAttendance(id, d) {
        const s = students[String(id)];
        if(!s) return { ok: false, msg: "Student not found" };
        
        if(!s.attendanceDates.includes(d)) {
            s.attendanceDates.push(d); 
            if(!attByDate[d]) attByDate[d] = []; 
            attByDate[d].push(String(id)); 
            
            saveAll(); 
            updateLiveFeed(s);
            playSound("success");
            triggerEdgeFlash(); // تشغيل الفلاش الأخضر للنجاح
            return { ok: true, msg: t("msg_att_ok") };
        }
        playSound("error");
        return { ok: false, msg: t("msg_att_warn") };
    }

    function removeAttendance(id, d) {
        const s = students[String(id)]; if(!s) return;
        s.attendanceDates = s.attendanceDates.filter(date => date !== d);
        if(attByDate[d]) attByDate[d] = attByDate[d].filter(x => x !== String(id));
        saveAll();
    }

    // ==========================================
    // 10. FINANCIAL & ANALYTICS MODULE
    // ==========================================
    function updateFinanceSummary() {
        const today = nowDateStr();
        const tRev = revenueByDate[today] || 0;
        let tExp = 0;
        if (expensesByDate[today]) {
            for (let i = 0; i < expensesByDate[today].length; i++) {
                tExp += expensesByDate[today][i].amount;
            }
        }
        
        if($("todayNetProfit")) $("todayNetProfit").textContent = (tRev - tExp);

        const currentMonth = today.slice(0, 7); 
        let mRev = 0, mExp = 0;
        
        for(let d in revenueByDate) { if(d.startsWith(currentMonth)) mRev += revenueByDate[d]; }
        for(let d in expensesByDate) { 
            if(d.startsWith(currentMonth)) { 
                for (let i = 0; i < expensesByDate[d].length; i++) mExp += expensesByDate[d][i].amount; 
            } 
        }
        if($("monthNetProfit")) $("monthNetProfit").textContent = (mRev - mExp);
       if($("monthTotalExp")) $("monthTotalExp").textContent = mExp;
    }

    function renderCharts() {
        const box = $("weeklyChartBox"); if(!box) return;
        
        let days = []; 
        for(let i=6; i>=0; i--) { 
            let d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); 
        }
        
        let maxNet = 0;
        let chartData = [];
        
        for (let i = 0; i < days.length; i++) {
            let d = days[i];
            let rev = revenueByDate[d] || 0;
            let exp = 0;
            if (expensesByDate[d]) {
                for (let j = 0; j < expensesByDate[d].length; j++) exp += expensesByDate[d][j].amount;
            }
            let net = rev - exp;
            if(net > maxNet) maxNet = net;
            chartData.push({ date: d, net: net });
        }
        
        let baseline = maxNet > 0 ? maxNet : 100;
        
        let html = "";
        for (let i = 0; i < chartData.length; i++) {
            let item = chartData[i];
            let h = 5;
            if (item.net > 0) {
                h = Math.max(5, (item.net / baseline) * 100);
            }
            
            let locale = currentLang === 'en' ? 'en-US' : 'ar-EG';
            let dayName = new Date(item.date).toLocaleDateString(locale, {weekday: 'short'});
            let barColor = item.net > 0 ? "var(--success)" : "#ccc";
            
            html += `
            <div class="chart-bar-wrap">
                <span style="font-size:10px; color:#666; margin-bottom:5px; font-weight:bold;">${item.net}</span>
                <div class="chart-bar" style="height:${h}%; background:${barColor};"></div>
                <div class="chart-label">${dayName}</div>
            </div>`;
        }
        box.innerHTML = html;
    }

    // ==========================================
    // 11. TABLE & SEARCH ENGINE
    // ==========================================
    function renderList() {
        const filterClassEl = $("filterClass"), filterStatusEl = $("filterStatus"), filterAttendEl = $("filterAttend");
        let fClass = "all", fStatus = "all", fAttend = "all";
        
        if (filterClassEl) fClass = filterClassEl.value;
        if (filterStatusEl) fStatus = filterStatusEl.value;
        if (filterAttendEl) fAttend = filterAttendEl.value;
        
        if(filterClassEl && filterClassEl.options.length <= 1) { 
            const classes = Object.keys(groupFees);
            if(classes.length === 0) classes.push("عام");
            classes.forEach(function(c) { 
                const opt = document.createElement("option"); opt.value = c; opt.innerText = c; filterClassEl.appendChild(opt); 
            });
        }

        let filled = [];
        const allStudents = Object.values(students);
        for (let i = 0; i < allStudents.length; i++) {
            if (allStudents[i].name || allStudents[i].paid > 0) filled.push(allStudents[i]);
        }
        
        const today = nowDateStr(); 
        currentFilteredList = [];
        
        for (let i = 0; i < filled.length; i++) {
            let s = filled[i];
            let isValid = true;
            
            if(fClass !== "all" && s.className !== fClass) isValid = false;
            
            let sClass = s.className ? s.className.trim() : "";
            let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
            let p = s.paid || 0;
            
            if(fStatus !== "all") {
                if(fStatus === "paid" && (p < req || req === 0)) isValid = false;
                if(fStatus === "partial" && (p === 0 || p >= req)) isValid = false;
                if(fStatus === "unpaid" && p > 0) isValid = false;
            }
            
            let isP = (s.attendanceDates && s.attendanceDates.includes(today));
            if(fAttend === "present" && !isP) isValid = false;
            if(fAttend === "absent" && isP) isValid = false;
            
            if (isValid) currentFilteredList.push(s);
        }

        const searchInp = $("tableSearchInp");
        let q = searchInp ? searchInp.value.toLowerCase() : "";
        
        if(q) {
            let searchedList = [];
            for (let i = 0; i < currentFilteredList.length; i++) {
                let s = currentFilteredList[i];
                if ((s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q)) searchedList.push(s);
            }
            currentFilteredList = searchedList;
        }
        
        currentPage = 1; 
        renderPage();
    }

    function renderPage() {
        const tb = $("allStudentsTable"); if (!tb) return;
        const tbody = tb.querySelector("tbody"); if (!tbody) return;
        
        tbody.innerHTML = "";
        
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const today = nowDateStr();

        for (let i = start; i < end && i < currentFilteredList.length; i++) {
            let s = currentFilteredList[i];
            const tr = document.createElement("tr");
            
            let sClass = s.className ? s.className.trim() : "";
            let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
            let percent = req > 0 ? Math.min((s.paid/req)*100, 100) : 0;
            let pBar = `<div style="width:100%; background:#eee; height:5px; border-radius:3px; margin-top:3px;"><div style="width:${percent}%; height:100%; background:var(--success); border-radius:3px;"></div></div>`;
            
            let isAttended = (s.attendanceDates && s.attendanceDates.includes(today));
            let attendTxt = isAttended ? "✅" : "➖";
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');
            let gColor = getTagColor(sClass);
let remainAmt = req > 0 ? (req - (s.paid || 0)) : 0;
            if (remainAmt < 0) remainAmt = 0;
            tr.innerHTML = `
                <td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td>
                <td>${s.id}</td>
                <td><b>${s.name}</b>${rankIcon}</td>
                <td><span class="badge" style="background:${gColor}; border-color:${gColor}; color:#fff;">${s.className || 'عام'}</span></td>
                <td>${s.paid} ج ${pBar}</td>
                <td>${remainAmt} ج</td>
                <td>${attendTxt}</td>`;
            tr.onclick = function(e) { 
                if(e.target.type !== "checkbox") window.extOpen(s.id); 
            };
            tbody.appendChild(tr);
        }
        
        const pageInd = $("pageIndicator");
        if (pageInd) {
            let totalPages = Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1;
            pageInd.textContent = `${currentPage} / ${totalPages}`;
        }
        
        if ($("prevPageBtn")) $("prevPageBtn").disabled = (currentPage === 1);
        if ($("nextPageBtn")) $("nextPageBtn").disabled = (end >= currentFilteredList.length);
    }

    function renderSimpleTable() {
        const tb = $("simpleStudentsTable"); if (!tb) return;
        const tbody = tb.querySelector("tbody"); if(!tbody) return; 
        
        tbody.innerHTML = "";
        
        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.name || s.paid > 0) {
                const tr = document.createElement("tr");
                let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');
                
                tr.innerHTML = `<td>${s.id}</td><td><b>${s.name}</b>${rankIcon}</td><td>${s.className || 'عام'}</td>`;
                tr.style.cursor = "pointer";
                
                tr.onclick = function() { 
                    if($("allStudentsModal")) $("allStudentsModal").classList.add("hidden"); 
                    window.extOpen(s.id); 
                };
                tbody.appendChild(tr);
            }
        }
    }

    function handleBulk() {
        const boxes = document.querySelectorAll(".stCheckbox:checked");
        if ($("selectedCount")) $("selectedCount").textContent = boxes.length;
        
        const bulkBar = $("bulkActionBar");
        if (bulkBar) {
            if(boxes.length > 0) bulkBar.classList.remove("hidden");
            else bulkBar.classList.add("hidden");
        }
    }

    function renderReport(d) {
        const list = $("reportList"); 
        if(!list) return;
        
        let ids = attByDate[d] || [];
        let rev = revenueByDate[d] || 0;
        let expArr = expensesByDate[d] || [];
        let totalExp = 0;
        for (let i = 0; i < expArr.length; i++) totalExp += expArr[i].amount;
        
        if($("reportDateLabel")) $("reportDateLabel").textContent = prettyDate(d);
        if($("reportCount")) $("reportCount").textContent = ids.length;
        if($("reportMoney")) $("reportMoney").textContent = rev;
        if($("reportExpense")) $("reportExpense").textContent = totalExp;
        
        let groups = {}; 
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            const st = students[id]; 
            let c = (st && st.className) ? st.className.trim() : "عام";
            if(!groups[c]) groups[c] = { count: 0 }; 
            groups[c].count++;
        }
        
        let html = "";
        for(let g in groups) {
            let gColor = getTagColor(g);
            html += `
            <div class="group-revenue-card" style="border-right: 5px solid ${gColor};">
                <div class="group-revenue-details">
                    <b style="color:${gColor}; font-size:1.1em;">🏷️ ${g}</b>
                </div>
                <div class="group-revenue-amount">
                    العدد: ${groups[g].count} طالب
                </div>
            </div>`;
        }
        
        if(expArr.length > 0) {
            html += `
            <h4 style="color:var(--danger); margin-top:15px;">${t("wa_exp")}</h4>
            <ul style="font-size:14px; color:#d9534f; list-style: inside; background:#fff; padding:15px; border-radius:8px;">`;
            for (let i = 0; i < expArr.length; i++) {
                html += `<li>${expArr[i].amount} ج - ${expArr[i].reason}</li>`; 
            }
            html += `</ul>`;
        }
        
        if (html === "") {
            list.innerHTML = `<div class="mutedCenter">${t("wait_scan")}</div>`;
        } else {
            list.innerHTML = html;
        }
    }

    function renderBinList() {
        const bl = $("binList"); if(!bl) return; 
        const ids = Object.keys(deletedStudents);
        if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter">Empty</div>`; return; }
        
        let html = "";
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            const s = deletedStudents[id]; 
            html += `
            <div class="item flexBetween" style="margin-bottom:8px;">
                <b>${s.name} (${id})</b> 
                <button class="btn success smallBtn" onclick="window.restoreSt('${id}')">استرجاع</button>
            </div>`; 
        }
        bl.innerHTML = html;
    }

    window.restoreSt = function(idStr) {
        const id = String(idStr);
        const st = deletedStudents[id]; 
        if(!st) return;
        
        students[id] = st; delete deletedStudents[id]; saveAll(); renderBinList(); 
        showToast("تم الاسترجاع ✅"); window.extOpen(id); 
    };
// ==========================================
    // 12. SYSTEM THEME & LANGUAGE APPLY
    // ==========================================
    function applyTheme(theme) {
        document.body.className = ""; 
        if(theme === "dark") document.body.classList.add("theme-dark"); 
        else if(theme === "glass") document.body.classList.add("theme-glass");
        localStorage.setItem(K_THEME, theme); 
        if($("themeSelector")) $("themeSelector").value = theme;
    }

    function applyLanguage() {
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
        
        if($("changeLangBtn")) {
            $("changeLangBtn").innerText = currentLang === "ar" ? "🌐 تغيير اللغة (Ar / En)" : "🌐 Switch Language";
        }
        
        if(document.querySelector('.bottom-nav')) {
            document.querySelector('.bottom-nav').style.flexDirection = currentLang === "ar" ? "row" : "row-reverse";
        }
        
        // السطر الجديد لتحديث كلمات جوجل درايف فوراً مع تغيير اللغة
        if (typeof updateDriveUI === "function") updateDriveUI();

        // 🚀 السطور الجديدة لترجمة شاشة إدخال المنهج
        if($("saveSyllabusBtn")) $("saveSyllabusBtn").innerText = currentLang === 'ar' ? "حفظ وتحديث المنهج" : "Save & Update Syllabus";
        if($("syllName")) $("syllName").placeholder = currentLang === 'ar' ? "اسم الشابتر / الدرس..." : "Chapter / Lesson Name...";
        if($("syllNotes")) $("syllNotes").placeholder = currentLang === 'ar' ? "ملاحظات (مثال: خلصنا لحد صفحة ٢٠)..." : "Notes (e.g., Finished until page 20)...";
        
        if($("syllStatus")) {
            for(let i=0; i<$("syllStatus").options.length; i++) {
                let opt = $("syllStatus").options[i];
                if(opt.value === "not_started") opt.text = currentLang === 'ar' ? "⚪ لم يبدأ" : "⚪ Not Started";
                if(opt.value === "in_progress") opt.text = currentLang === 'ar' ? "🟡 جاري الشرح" : "🟡 In Progress";
                if(opt.value === "completed")   opt.text = currentLang === 'ar' ? "🟢 تم الانتهاء" : "🟢 Completed";
            }
        }
    }
    // ==========================================
    // 13. SYLLABUS MODULE
    // ==========================================
    function renderSyllabus() {
        const tl = $("syllabusTimeline");
        if (!tl) return;
        if (syllabusData.length === 0) {
            let emptyMsg = currentLang === 'ar' ? "لا توجد بيانات في خريطة المنهج حتى الآن. 📭" : "No syllabus data available yet. 📭";
            tl.innerHTML = `<div class="mutedCenter">${emptyMsg}</div>`;
            return;
        }

        const isAdmin = (currentUserRole === "admin");
        let html = "";
        
        for (let i = 0; i < syllabusData.length; i++) {
            let s = syllabusData[i];
            let statusClass = "status-" + s.status;
            
            // ترجمة حالات الدرس
            let statusIcon = "";
            if (s.status === "completed") statusIcon = currentLang === 'ar' ? "🟢 تم الانتهاء" : "🟢 Completed";
            else if (s.status === "in_progress") statusIcon = currentLang === 'ar' ? "🟡 جاري الشرح" : "🟡 In Progress";
            else statusIcon = currentLang === 'ar' ? "⚪ لم يبدأ" : "⚪ Not Started";
            
            let deleteBtnHtml = isAdmin ? `<button class="btn danger smallBtn iconOnly" onclick="window.deleteSyllabus(${i})">🗑️</button>` : "";
            let dateLbl = currentLang === 'ar' ? "أخر تحديث:" : "Last Update:";

            html += `
            <div class="syll-card ${statusClass}">
                <div class="syll-header">
                    <span>${s.name}</span>
                    <div class="row" style="width:auto;">
                        <span style="font-size:0.8em; font-weight:normal;">${statusIcon}</span>
                        ${deleteBtnHtml}
                    </div>
                </div>
                ${s.notes ? `<div class="syll-notes">📝 ${s.notes}</div>` : ''}
                <div class="syll-date">📅 ${dateLbl} ${prettyDate(s.date)}</div>
            </div>
            `;
        }
        tl.innerHTML = html;
    }

    window.deleteSyllabus = function(index) {
        let confirmMsg = currentLang === 'ar' ? "⚠️ متأكد من حذف هذا الدرس من المنهج؟" : "⚠️ Are you sure you want to delete this lesson?";
        if(confirm(confirmMsg)) {
            syllabusData.splice(index, 1);
            saveAll();
            renderSyllabus();
        }
    };

    on("saveSyllabusBtn", "click", function() {
        let name = $("syllName").value.trim();
        let status = $("syllStatus").value;
        let notes = $("syllNotes").value.trim();
        
        if(!name) {
            let errMsg = currentLang === 'ar' ? "يرجى كتابة اسم الشابتر / الدرس أولاً!" : "Please enter the chapter/lesson name first!";
            return showToast(errMsg, "err");
        }

        let existing = syllabusData.find(x => x.name === name);
        if(existing) {
            existing.status = status;
            existing.notes = notes;
            existing.date = nowDateStr();
        } else {
            syllabusData.push({ name: name, status: status, notes: notes, date: nowDateStr() });
        }
        
        saveAll();
        renderSyllabus();
        
        let successMsg = currentLang === 'ar' ? "تم تحديث خريطة المنهج ✅" : "Syllabus updated successfully ✅";
        showToast(successMsg, "success");
        
        $("syllName").value = "";
        $("syllStatus").value = "not_started";
        $("syllNotes").value = "";
    });
    // ==========================================
    // 14. BINDINGS & EVENT LISTENERS
    // ==========================================
    on("loginBtn", "click", function() {
        const u = $("user") ? $("user").value.trim() : "";
        const p = $("pass") ? $("pass").value.trim() : "";
        
        if(u === ADMIN_USER && p === ADMIN_PASS) { 
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); checkAuth(); 
        } else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) { 
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "assistant"); checkAuth(); 
        } else { 
            showToast(t("msg_err_pass"), "err"); 
            triggerShake("loginBtn"); // إضافة اهتزاز لزرار الدخول
        }
    });

    on("logoutBtn", "click", function() { localStorage.removeItem(K_AUTH); location.reload(); });
    on("togglePass", "click", function() { const p = $("pass"); if (p) p.type = p.type === "password" ? "text" : "password"; });

    on("customPassConfirm", "click", function() {
        if ($("customPassInput") && $("customPassInput").value === ADMIN_PASS) { 
            if($("customPassModal")) $("customPassModal").classList.add("hidden"); 
            if(passSuccessCallback) passSuccessCallback(); 
        } else { showToast(t("msg_err_pass"), "err"); triggerShake("customPassInput"); }
    });

    on("customPassCancel", "click", function() { if($("customPassModal")) $("customPassModal").classList.add("hidden"); });

    on("toggleRevBtn", "click", function(e) {
        if(e) e.stopPropagation();
        isRevHidden = !isRevHidden;
        updateTopStats();
    });
on("quickAttendId", "keypress", function(e) {
        if (e.key === "Enter") { e.preventDefault(); $("quickAttendBtn").click(); }
    });
    on("quickAttendBtn", "click", function() {
        const idInp = $("quickAttendId");
        if (!idInp) return;
        const id = toInt(idInp.value); 
        if(!id || !students[String(id)]) { 
            showToast("الطالب غير مسجل", "err"); 
            triggerShake("quickAttendId"); // الاهتزاز عند الخطأ
            return; 
        }
        
        const res = addAttendance(id, nowDateStr());
        showToast(res.msg, res.ok ? "success" : "warning");
        updateStudentUI(id); updateTopStats(); 
        idInp.value = ""; idInp.focus();
    });

    on("openBtn", "click", function() {
        let openVal = toInt($("openId").value);
        if ($("openId") && openVal && students[String(openVal)]) {
            window.extOpen(openVal);
        } else {
            showToast("الطالب غير موجود", "err");
            triggerShake("openId"); // الاهتزاز عند الخطأ
        }
    });

    on("searchAny", "input", function(e) {
        const q = e.target.value.toLowerCase();
        const searchMsg = $("searchMsg");
        if(!searchMsg) return;
        if(!q) { searchMsg.style.display = "none"; return; }
        
        let found = [];
        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if ((s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && s.phone.includes(q))) {
                found.push(s);
            }
            if (found.length >= 5) break;
        }
        
        searchMsg.style.display = "block";
        let html = "";
        for (let i = 0; i < found.length; i++) {
            let s = found[i];
            html += `<div class="item" onclick="window.extOpen('${s.id}')"><b>${s.name}</b> (#${s.id})</div>`;
        }
        searchMsg.innerHTML = html;
    });

    on("addNewBtn", "click", function() {
        const id = $("newId") ? toInt($("newId").value) : 0;
        if(!id) return;
        if (students[String(id)] && students[String(id)].name) { triggerShake("newId"); return showToast("الكود مستخدم بالفعل", "err"); }
        
        students[String(id)] = makeEmptyStudent(id); 
        if(id > BASE_MAX_ID) extraIds.push(id);
        saveAll(); window.extOpen(id); showToast(t("msg_added"));
    });

    on("saveStudentBtn", "click", function() {
        if(!currentId) return;
        const s = students[currentId]; if (!s) return;
        if ($("stName")) s.name = $("stName").value; 
        if ($("stClass")) s.className = $("stClass").value; 
        if ($("stPhone")) s.phone = $("stPhone").value;
        saveAll(); showToast(t("msg_saved")); updateStudentUI(currentId);
    });

    on("rankNormalBtn", "click", function() {
        if(!currentId) return;
        students[currentId].rank = "normal";
        saveAll(); updateStudentUI(currentId); showToast("تم التحديث لـ عادي 🟢");
    });

    on("rankVipBtn", "click", function() {
        if(!currentId) return;
        students[currentId].rank = "vip";
        saveAll(); updateStudentUI(currentId); showToast("تم الترقية لـ VIP ⭐");
    });

    on("rankWarnBtn", "click", function() {
        if(!currentId) return;
        students[currentId].rank = "warn";
        saveAll(); updateStudentUI(currentId); showToast("تم إعطاء إنذار ⚠️", "warning");
    });
    
    on("markTodayBtn", "click", function() { 
        if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }
    });

    on("unmarkTodayBtn", "click", function() { 
        if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }
    });

    on("addPaymentBtn", "click", function() {
        if(!currentId) return;
        const payInp = $("newPaymentInput"); if (!payInp) return;
        const v = toInt(payInp.value); if(!v) return;
        
        const st = students[currentId]; st.paid += v;
       if (!st.payments) st.payments = [];
        st.payments.push({ date: nowDateStr(), amount: v });
        const today = nowDateStr();
        if (!revenueByDate[today]) revenueByDate[today] = 0;
        revenueByDate[today] += v;
        
        saveAll(); updateStudentUI(currentId);
        
        let sClass = st.className ? st.className.trim() : "";
        let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
        
        if(req > 0 && st.paid >= req) fireConfetti();
        playSound("money"); showToast(t("msg_deposit"));
        
       if(st.phone) {
            if(!currentManager) {
                showToast(t("err_no_manager"), "err");
                return; // يمنع فتح الواتساب
            }
            let msg = `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} ج ✅\nإجمالي المدفوع: ${st.paid} ج.\n\nمع تحيات: أ/ ${currentManager}`;
            setTimeout(function() { 
                window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank'); 
            }, 1000);
        }
        payInp.value = "";
    });

    on("correctPayBtn", "click", function() {
        if(!currentId) return; 
        const v = toInt(prompt(currentLang==='ar' ? "قيمة الخصم:" : "Deduct amount:")); if(!v) return;
        students[currentId].paid = Math.max(0, students[currentId].paid - v);
        const today = nowDateStr();
        revenueByDate[today] = Math.max(0, (revenueByDate[today] || 0) - v);
        saveAll(); showToast(t("msg_discount"), "warning"); updateStudentUI(currentId); renderReport(nowDateStr()); renderCharts();
    });

    on("addNoteBtn", "click", function() {
        if(!currentId) return; 
        const noteInp = $("newNoteInp"); if (!noteInp) return;
        const txt = noteInp.value.trim(); if(!txt) return;
        
        const now = new Date(); const stamp = `[${now.toISOString().split('T')[0]}]`;
        let oldNotes = students[currentId].notes ? students[currentId].notes : "";
        students[currentId].notes = `${stamp} : ${txt}\n${oldNotes}`;
        
        saveAll(); updateStudentUI(currentId); showToast(t("msg_saved"));
    });

    on("waBtn", "click", function() { 
        const phInp = $("stPhone");
        if (phInp && phInp.value) window.open(`https://wa.me/20${phInp.value}`, '_blank'); 
    });

    on("saveExpenseBtn", "click", function() {
        if (!$("expenseAmtInp") || !$("expenseReasonInp")) return;
        const a = toInt($("expenseAmtInp").value);
        const r = $("expenseReasonInp").value.trim();
        if(!a || !r) { showToast("يرجى ملء كافة البيانات", "err"); return; }
        
        const today = nowDateStr(); 
        if(!expensesByDate[today]) expensesByDate[today] = [];
        expensesByDate[today].push({amount:a, reason:r}); saveAll();
        
        $("expenseAmtInp").value = ""; $("expenseReasonInp").value = ""; 
        showToast(t("msg_exp_saved")); renderReport(today);
    });

    window.renderGroupFeesModal = function() {
        let h = `
        <div style="display:flex; gap:10px; margin-bottom:15px; background:#eef2f5; padding:10px; border-radius:8px;">
            <input type="text" id="newPkgName" class="inp" placeholder="اسم الباقة (مثال: ترم كامل)">
            <input type="number" id="newPkgPrice" class="inp" placeholder="السعر" style="width:100px;">
            <button class="btn primary" id="addNewPkgBtn">إضافة</button>
        </div>
        `;
        
        for(let g in groupFees) {
            let val = groupFees[g];
            h += `<div class="group-fee-row">
                    <label>📘 ${g}</label>
                    <div class="row" style="width:auto;">
                        <input type="number" class="inp g-fee-inp" data-group="${g}" value="${val}"> ج
                        <button class="btn danger smallBtn iconOnly delete-pkg-btn" data-group="${g}">🗑️</button>
                    </div>
                  </div>`;
        }
        if ($("groupFeesList")) $("groupFeesList").innerHTML = h;

        if($("addNewPkgBtn")) {
            $("addNewPkgBtn").onclick = function() {
                let n = $("newPkgName").value.trim();
                let p = toInt($("newPkgPrice").value);
                if(n) {
                    groupFees[n] = p;
                    saveAll(); renderGroupFeesModal(); populatePackages(); showToast("تم إضافة الباقة");
                }
            };
        }

        document.querySelectorAll(".delete-pkg-btn").forEach(btn => {
            btn.onclick = function() {
                let g = this.getAttribute("data-group");
                if(confirm("⚠️ متأكد من حذف هذه الباقة من السيستم؟")) {
                    delete groupFees[g];
                    saveAll(); renderGroupFeesModal(); populatePackages(); showToast("تم الحذف");
                }
            }
        });
    }

    on("openGroupFeesBtn", "click", function() {
        askAdminPass(function() {
            renderGroupFeesModal();
            if ($("groupFeesModal")) $("groupFeesModal").classList.remove("hidden");
        });
    });

    on("closeGroupFeesModal", "click", function() {
        if ($("groupFeesModal")) $("groupFeesModal").classList.add("hidden");
    });

    on("saveGroupFeesBtn", "click", function() {
        const inputs = document.querySelectorAll(".g-fee-inp");
        for (let i = 0; i < inputs.length; i++) {
            let groupName = inputs[i].getAttribute("data-group");
            groupFees[groupName] = toInt(inputs[i].value);
        }
        saveAll(); 
        populatePackages(); 
        if ($("groupFeesModal")) $("groupFeesModal").classList.add("hidden"); 
        showToast(t("msg_saved"));
        if(currentId) updateStudentUI(currentId);
    });

    on("changeLangBtn", "click", function() { 
        currentLang = (currentLang === "ar" ? "en" : "ar"); 
        localStorage.setItem(K_LANG, currentLang); applyLanguage(); 
    });

    on("themeSelector", "change", function(e) { applyTheme(e.target.value); });

    if($("bgInput")) {
        $("bgInput").addEventListener("change", function(e) {
            const file = e.target.files[0]; if(!file) return; 
            const reader = new FileReader();
            reader.onload = function(event) {
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
        $("removeBgBtn").addEventListener("click", function() {
            document.body.style.backgroundImage = "none";
            localStorage.removeItem(K_BG_IMAGE);
            showToast("تم إزالة الخلفية 🗑️");
        });
    }

    on("reportBtn", "click", function() {
        if ($("reportDate")) renderReport($("reportDate").value);
    });

    on("copyReportBtn", "click", function() {
        let d = nowDateStr();
       if(!currentManager) { showToast(t("err_no_manager"), "err"); return; }
        if ($("reportDate") && $("reportDate").value) d = $("reportDate").value;
        
        let ids = attByDate[d] || [];
        let rev = revenueByDate[d] || 0;
        let expArr = expensesByDate[d] || [];
        
        let totalExp = 0;
        for (let i = 0; i < expArr.length; i++) totalExp += expArr[i].amount;

        let txt = `📊 *${t("report_title")}: ${prettyDate(d)}*\n\n`;
        
        let groups = {};
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            const st = students[id];
            let c = (st && st.className) ? st.className.trim() : "عام";
            if(!groups[c]) groups[c] = 0; 
            groups[c]++; 
        }
        
        for(let g in groups) { txt += `📘 ${g}: ${groups[g]} طالب\n`; }
        
        txt += `\n👥 إجمالي الحضور اليوم: ${ids.length}`;
        txt += `\n💰 ${t("badge_rev")} ${rev} ج`;
        
        if(expArr.length > 0) {
            txt += `\n\n🔻 *${t("wa_exp")}:*`;
            for (let i = 0; i < expArr.length; i++) {
                let ex = expArr[i];
                txt += `\n- ${ex.amount} ج (${ex.reason})`; 
            }
            txt += `\n\n💵 *${t("wa_net")}: ${rev - totalExp} ج*`;
        }
        
     let shiftStr = currentLang === 'ar' ? `إعداد الشيفت: أ/ ${currentManager}` : `Shift Prepared by: ${currentManager}`;
        txt = `${shiftStr}\n\n` + txt;
        navigator.clipboard.writeText(txt).then(function() { showToast(t("msg_copied")); });
    });

    // ==========================================
    // 16. EXCEL LOGIC (تصدير واستيراد - النسخة الاحترافية متعددة الصفحات)
    // ==========================================
    on("exportExcelBtn", "click", function() {
        if (typeof XLSX === "undefined") { return showToast("⚠️ مكتبة الإكسيل غير موجودة، تأكد من وجود ملف xlsx.full.min.js في فولدر assets", "err"); }
        
        const wb = XLSX.utils.book_new();

        // --- الشيت الأول: بيانات الطلاب ---
        let filled = [];
        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) { if (allStuds[i].name) filled.push(allStuds[i]); }
        filled.sort(function(a, b) { return a.id - b.id; });
        
        const stData = [["كود الطالب", "اسم الطالب", "الباقة / المجموعة", "رقم الموبايل", "إجمالي المدفوع", "التصنيف", "سجل الحضور", "الملاحظات"]];
        for (let i = 0; i < filled.length; i++) {
            let s = filled[i];
            let history = s.attendanceDates ? s.attendanceDates.join(" | ") : "";
            let rankAr = s.rank === 'vip' ? 'VIP ⭐' : (s.rank === 'warn' ? 'إنذار ⚠️' : 'عادي 🟢');
            let cleanNotes = s.notes ? s.notes.replace(/\n/g, " - ") : ""; 
            
            stData.push([s.id, s.name, s.className || "عام", s.phone, s.paid, rankAr, history, cleanNotes]);
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stData), "بيانات الطلاب");

        // --- الشيت الثاني: خريطة المنهج ---
        const syllData = [["اسم الدرس / الشابتر", "الحالة", "ملاحظات الحصة", "تاريخ التحديث"]];
        for(let i=0; i < syllabusData.length; i++) {
            let s = syllabusData[i];
            let statusAr = s.status === "completed" ? "تم الانتهاء" : (s.status === "in_progress" ? "جاري الشرح" : "لم يبدأ");
            syllData.push([s.name, statusAr, s.notes || "", s.date]);
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(syllData), "خريطة المنهج");

        // --- الشيت الثالث: الماليات والمصروفات ---
        const finData = [["التاريخ", "النوع", "المبلغ", "البيان / السبب"]];
        
        let allDates = new Set([...Object.keys(revenueByDate), ...Object.keys(expensesByDate)]);
        let sortedDates = Array.from(allDates).sort((a,b) => new Date(a) - new Date(b)); 
        
        for(let i=0; i<sortedDates.length; i++) {
            let d = sortedDates[i];
            if(revenueByDate[d]) {
                finData.push([prettyDate(d), "إيرادات 💰", revenueByDate[d], "إيراد مدفوعات الطلاب"]);
            }
            if(expensesByDate[d] && expensesByDate[d].length > 0) {
                for(let j=0; j<expensesByDate[d].length; j++) {
                    finData.push([prettyDate(d), "مصروفات 🔻", expensesByDate[d][j].amount, expensesByDate[d][j].reason]);
                }
            }
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(finData), "الماليات");

        XLSX.writeFile(wb, `VPRO_Backup_${nowDateStr()}.xlsx`);
        localStorage.setItem(K_LAST_BACKUP, nowDateStr()); 
        
        if($("btnTabAdmin")) $("btnTabAdmin").classList.remove("needs-backup");
        showToast("تم تصدير نسخة احتياطية شاملة ✅");
    });

    on("importExcelBtnFake", "click", function() { if ($("importExcelInput")) $("importExcelInput").click(); });
    
on("importExcelInput", "change", async function(e) {
        const f = e.target.files[0]; if(!f) return; 
        const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
        
        let warnMsg = currentLang==='ar' ? 'تحذير: سيتم مسح البيانات الحالية واستبدالها!' : 'Warning: Overwrite current data?';
        if(!confirm(warnMsg)) return;
        
        // تصفير كل حاجة قبل ما نستقبل الداتا الجديدة
        students = {}; attByDate = {}; revenueByDate = {}; expensesByDate = {}; syllabusData = [];
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { students[String(i)] = makeEmptyStudent(i); }
        
        // 1. استيراد بيانات الطلاب (الصفحة الأولى)
        if(wb.SheetNames.includes("بيانات الطلاب") || wb.SheetNames[0]) {
            const sheetName = wb.SheetNames.includes("بيانات الطلاب") ? "بيانات الطلاب" : wb.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                const id = toInt(row["كود الطالب"] || row["ID"] || row["كود"]);
                if(id) {
                    let st = makeEmptyStudent(id);
                    st.name = row["اسم الطالب"] || row["Name"] || row["الاسم"] || ""; 
                    st.className = row["الباقة / المجموعة"] || row["Class"] || row["المجموعة"] || "";
                    st.phone = String(row["رقم الموبايل"] || row["Phone"] || ""); 
                    st.paid = toInt(row["إجمالي المدفوع"] || row["Paid"] || row["المدفوع"]);
                    
                    let rankAr = row["التصنيف"] || row["Rank"] || "";
                    st.rank = rankAr.includes("VIP") ? "vip" : (rankAr.includes("إنذار") ? "warn" : "normal");
                    
                    let n = row["الملاحظات"] || "";
                    st.notes = n ? n.replace(/ - /g, "\n") : "";
                    
                    let h = row["سجل الحضور"] || row["History"] || "";
                    if(h) {
                        st.attendanceDates = h.split(/\||,/).map(function(d) { return d.trim(); }).filter(d => d);
                        for (let j = 0; j < st.attendanceDates.length; j++) {
                            let d = st.attendanceDates[j];
                            if(!attByDate[d]) attByDate[d] = []; 
                            attByDate[d].push(String(id)); 
                        }
                    }
                    students[String(id)] = st;
                }
            }
        }

        // 2. استيراد الماليات (الصفحة التانية)
        if(wb.SheetNames.includes("الماليات")) {
            const finRows = XLSX.utils.sheet_to_json(wb.Sheets["الماليات"]);
            for(let i=0; i<finRows.length; i++) {
                let row = finRows[i];
                let pDate = row["التاريخ"]; 
                if(pDate) {
                    let d = pDate.split("-").reverse().join("-"); // تحويل التاريخ لشكله الأصلي
                    let type = row["النوع"] || "";
                    let amt = toInt(row["المبلغ"]);
                    let reason = row["البيان / السبب"] || "";

                    if(type.includes("إيرادات")) {
                        revenueByDate[d] = (revenueByDate[d] || 0) + amt;
                    } else if (type.includes("مصروفات")) {
                        if(!expensesByDate[d]) expensesByDate[d] = [];
                        expensesByDate[d].push({ amount: amt, reason: reason });
                    }
                }
            }
        }

        // 3. استيراد المنهج (الصفحة التالتة)
        if (wb.SheetNames.includes("خريطة المنهج")) {
            const syllRows = XLSX.utils.sheet_to_json(wb.Sheets["خريطة المنهج"]);
            for(let i=0; i<syllRows.length; i++) {
                let row = syllRows[i];
                let name = row["اسم الدرس / الشابتر"];
                if(name) {
                    let statusAr = row["الحالة"] || "";
                    let status = "not_started";
                    if(statusAr.includes("جاري")) status = "in_progress";
                    if(statusAr.includes("تم")) status = "completed";
                    
                    syllabusData.push({
                        name: name,
                        status: status,
                        notes: row["ملاحظات الحصة"] || "",
                        date: row["تاريخ التحديث"] || nowDateStr()
                    });
                }
            }
        }

        saveAll(); showToast(t("msg_saved")); 
        setTimeout(function() { location.reload(); }, 1000);
    });

    // ==========================================
    // 17. PREMIUM HOLD-TO-DELETE LOGIC (الضغط المطول)
    // ==========================================
    let deleteTimer;
    const delBtn = $("deleteStudentBtn");
    
    if(delBtn) delBtn.innerHTML = `<span>🗑️ حذف</span>`; 

    function startDeleteHold(e) {
        if(!currentId) return;
        delBtn.classList.add("holding");
        
        deleteTimer = setTimeout(() => {
            delBtn.classList.remove("holding");
            
            const targetId = currentId; const st = students[targetId]; const backup = JSON.parse(JSON.stringify(st));
            let deducted = 0; 
            if(st.paid > 0 && confirm(currentLang==='ar' ? 'خصم مدفوعاته من إيراد اليوم؟' : 'Deduct from revenue?')) deducted = st.paid;
            
            const today = nowDateStr();
            revenueByDate[today] = (revenueByDate[today] || 0) - deducted;
            deletedStudents[targetId] = backup; 
            students[targetId] = makeEmptyStudent(targetId);
            
            if(targetId > BASE_MAX_ID) { 
                delete students[targetId]; 
                let newExtra = [];
                for(let i=0; i<extraIds.length; i++) { if (extraIds[i] !== targetId) newExtra.push(extraIds[i]); }
                extraIds = newExtra;
            }
            saveAll(); updateStudentUI(null); window.switchTab('Home');
            
            showUndoToast(t("msg_deleted"), function() {
                students[targetId] = backup; delete deletedStudents[targetId];
                revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()] || 0) + deducted;
                saveAll(); window.extOpen(targetId); renderReport(nowDateStr()); renderCharts(); showToast(t("msg_undo"));
            });
        }, 1000); // ثانيتين ضغط متواصل
    }

    function cancelDeleteHold() {
        clearTimeout(deleteTimer);
        if(delBtn) delBtn.classList.remove("holding");
    }

    if(delBtn) {
        delBtn.addEventListener("mousedown", startDeleteHold);
        delBtn.addEventListener("mouseup", cancelDeleteHold);
        delBtn.addEventListener("mouseleave", cancelDeleteHold);
        delBtn.addEventListener("touchstart", startDeleteHold, {passive: true});
        delBtn.addEventListener("touchend", cancelDeleteHold);
        delBtn.addEventListener("touchcancel", cancelDeleteHold);
    }

    // Modals & Bins
    on("openBinBtn", "click", function() { renderBinList(); if ($("recycleBinModal")) $("recycleBinModal").classList.remove("hidden"); });
    on("closeBinBtn", "click", function() { if ($("recycleBinModal")) $("recycleBinModal").classList.add("hidden"); });
    on("emptyBinBtn", "click", function() { 
        let confMsg = currentLang==='ar' ? "حذف السلة نهائياً؟" : "Empty completely?";
        if(confirm(confMsg)) { deletedStudents = {}; saveAll(); renderBinList(); }
    });

    on("openAllStudentsBtn", "click", function() { renderSimpleTable(); if ($("allStudentsModal")) $("allStudentsModal").classList.remove("hidden"); });
    on("closeModalBtn", "click", function() { if ($("allStudentsModal")) $("allStudentsModal").classList.add("hidden"); });

    on("todayCountTopCard", "click", function() {
        const today = nowDateStr(); let ids = attByDate[today] || [];
        if(ids.length === 0) { 
            let warnMsg = currentLang==='ar' ? "لا يوجد حضور" : "No attendance";
            showToast(warnMsg, "warning"); return; 
        }
        
        let groups = {};
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i]; const st = students[id]; 
            if(st) { 
                let c = st.className ? st.className.trim() : "عام"; 
                if(!groups[c]) groups[c] = []; 
                groups[c].push(st); 
            } 
        }
        
        let html = "";
        for(let g in groups) { 
            let gColor = getTagColor(g);
            let groupHtml = `<div style="background:#f8f9fa; border-radius:10px; padding:15px; margin-bottom:15px; border-right: 5px solid ${gColor};">`;
            groupHtml += `<h4 style="color:${gColor}; margin-top:0; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">📘 ${g} (${groups[g].length})</h4>`;
            groupHtml += `<div style="display:flex; flex-wrap:wrap; gap:8px;">`;
            
            for (let j = 0; j < groups[g].length; j++) {
                let s = groups[g][j];
                let sName = s.name || 'بدون اسم';
                groupHtml += `<div class="badge" style="background:#fff; color:#333; border:1px solid ${gColor}; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;" onclick="document.getElementById('todayModal').classList.add('hidden'); window.extOpen('${s.id}')">#${s.id} - ${sName}</div>`;
            }
            groupHtml += `</div></div>`;
            html += groupHtml;
        }
        
        if ($("todayModalBody")) $("todayModalBody").innerHTML = html; 
        if ($("todayModal")) $("todayModal").classList.remove("hidden");
    });
    
    on("closeTodayModal", "click", function() { if ($("todayModal")) $("todayModal").classList.add("hidden"); });

    on("resetTermBtn", "click", function() {
        askAdminPass(function() {
            let msg = currentLang==='ar' ? "تصفير فلوس وغياب الترم بالكامل للجميع؟" : "Reset all fees and attendance?";
            if(confirm(msg)) {
                for(let k in students) { students[k].paid = 0; students[k].attendanceDates = []; }
                attByDate = {}; revenueByDate = {}; expensesByDate = {}; saveAll(); location.reload();
            }
        });
    });

    on("resetBtn", "click", function() {
        askAdminPass(function() {
            let msg = currentLang==='ar' ? "مسح شامل وإعادة ضبط المصنع للسيستم بالكامل؟" : "Factory Reset the whole system?";
            if(confirm(msg)) { localStorage.clear(); location.reload(); }
        });
    });

    // Filters and Bulk actions
    if($("filterClass")) $("filterClass").addEventListener("change", renderList);
    if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);
    if($("filterAttend")) $("filterAttend").addEventListener("change", renderList);
    if($("tableSearchInp")) $("tableSearchInp").addEventListener("input", renderList);
    
    on("prevPageBtn", "click", function() { if(currentPage > 1) { currentPage--; renderPage(); } });
    on("nextPageBtn", "click", function() { currentPage++; renderPage(); });

    document.addEventListener("change", function(e) {
        if(e.target.classList.contains("stCheckbox")) { handleBulk(); }
        if(e.target.id === "selectAllCheckbox") { 
            const boxes = document.querySelectorAll(".stCheckbox");
            for (let i = 0; i < boxes.length; i++) { boxes[i].checked = e.target.checked; }
            handleBulk(); 
        }
    });

    on("bulkAttendBtn", "click", function() { 
        let count = 0; const checkedBoxes = document.querySelectorAll(".stCheckbox:checked");
        for (let i = 0; i < checkedBoxes.length; i++) {
            let res = addAttendance(checkedBoxes[i].getAttribute("data-id"), nowDateStr());
            if (res.ok) count++;
        }
        showToast(t("msg_att_ok")); renderList(); handleBulk(); 
    });

    on("bulkAbsentBtn", "click", function() { 
        const checkedBoxes = document.querySelectorAll(".stCheckbox:checked");
        for (let i = 0; i < checkedBoxes.length; i++) { removeAttendance(checkedBoxes[i].getAttribute("data-id"), nowDateStr()); }
        showToast(t("msg_att_warn"), "warning"); renderList(); handleBulk();
    });

   // ==========================================
    // 17.5. GOOGLE DRIVE CLOUD SYNC (SMART SYNC)
    // ==========================================
    const CLIENT_ID = '783299132334-7sk1ffet8bdmj86f179gbttjt5fqosao.apps.googleusercontent.com';
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';
    const BACKUP_FILE_NAME = 'vpro_backup.json';
    let tokenClient;
    let accessToken = localStorage.getItem("drive_token");

function updateDriveUI() {
        const btn = $("driveLoginBtn"); const syncBtn = $("syncNowBtn");
        const statusTxt = $("driveStatusText"); const lastSyncTxt = $("lastSyncText");
        
        // 1. التحقق من وجود إنترنت حقيقي في الجهاز
        if (!navigator.onLine) {
            if(statusTxt) { 
                statusTxt.innerHTML = currentLang === 'ar' ? "🔴 لا يوجد اتصال بالإنترنت" : "🔴 No Internet Connection"; 
                statusTxt.style.color = "var(--danger)"; 
                statusTxt.classList.remove("pulse-active"); // وقف النبض
            }
            if(btn) { btn.innerHTML = currentLang === 'ar' ? "بانتظار عودة الإنترنت..." : "Waiting for network..."; btn.style.background = "#666"; }
            if(syncBtn) syncBtn.classList.add("hidden");
            return; // وقف الدالة هنا لحد ما النت يرجع
        }

        // 2. لو فيه نت، هل هو رابط بالدرايف؟
        if(accessToken) {
            if(btn) { btn.innerHTML = t("btn_drive_connected"); btn.style.background = "#2ea44f"; }
            if(syncBtn) syncBtn.classList.remove("hidden");
            if(statusTxt) { 
                statusTxt.innerHTML = t("drive_online"); 
                statusTxt.style.color = "var(--success)"; 
                statusTxt.classList.add("pulse-active"); // شغل النبض (اللمبة تنور وتطفي)
            }
        } else {
            // فيه نت بس لسه مربوطش
            if(statusTxt) { 
                statusTxt.innerHTML = t("drive_offline"); 
                statusTxt.style.color = "#666"; 
                statusTxt.classList.remove("pulse-active");
            }
            if(btn) { btn.innerHTML = t("btn_drive_login"); btn.style.background = "#4285F4"; }
        }

        let lastTime = localStorage.getItem("last_cloud_sync_time");
        if(lastTime && lastSyncTxt) {
            lastSyncTxt.innerHTML = t("lbl_last_sync") + lastTime;
        }
    }
    updateDriveUI();

    // أوامر عشان السيستم يراقب النت لايف (لو فصل أو اشتغل يغير اللمبة فوراً)
    window.addEventListener('online', updateDriveUI);
    window.addEventListener('offline', updateDriveUI);

    on("driveLoginBtn", "click", function() {
        if (typeof google === 'undefined') {
            return showToast(currentLang === 'ar' ? "جاري تحميل مكتبات جوجل، جرب مرة تانية كمان ثانية..." : "Loading Google libraries...", "warning");
        }
        if (!tokenClient) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        accessToken = response.access_token;
                        localStorage.setItem("drive_token", accessToken);
                        updateDriveUI(); showToast(t("btn_drive_connected"), "success");
                    }
                },
            });
        }
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });

    // دالة الرفع المدمجة (يدوي أو تلقائي)
    async function backupToDrive(isManual = false) {
        if (!accessToken) return;
        
        if (isManual) showToast(t("msg_sync_wait"), "warning");

        let backupData = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith("ca_")) backupData[key] = localStorage.getItem(key);
        }
        const fileContent = JSON.stringify(backupData);
        const metadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json' };

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const data = await response.json();
            let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            let method = 'POST';

            // منع التكرار: التحديث إذا كان موجوداً
            if (data.files && data.files.length > 0) {
                url = `https://www.googleapis.com/upload/drive/v3/files/${data.files[0].id}?uploadType=multipart`; method = 'PATCH';
            }

            const boundary = 'foo_bar_baz';
            const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${fileContent}\r\n--${boundary}--`;

            await fetch(url, { method: method, headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: body });
            
            // تسجيل وقت المزامنة الناجحة
            let now = new Date();
            let timeString = now.toLocaleDateString('ar-EG') + " " + now.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'});
            localStorage.setItem("last_cloud_sync_time", timeString);
            localStorage.setItem("last_cloud_sync_date", nowDateStr()); // لضمان عدم التكرار في نفس اليوم
            updateDriveUI();

            if (isManual) {
                showToast(t("msg_sync_done"), "success");
            } else {
                showToast(t("msg_sync_auto"), "success");
            }
        } catch (err) { 
            console.error("Sync Error", err); 
            if (isManual) showToast(currentLang === 'ar' ? "فشل الرفع، تأكد من الاتصال بالنت" : "Upload failed, check connection", "err");
        }
    }

    // ربط زرار السهم بالرفع اليدوي
    on("syncNowBtn", "click", function() {
        backupToDrive(true);
    });

    on("restoreDriveBtn", "click", async function() {
        if (!accessToken) return showToast(currentLang === 'ar' ? "يرجى الربط بالدرايف أولاً ☁️" : "Please connect to Drive first ☁️", "err");
        if (!confirm(currentLang === 'ar' ? "⚠️ تحذير شديد: سيتم مسح كل البيانات الحالية واستبدالها بنسخة السحابة! متأكد؟" : "⚠️ WARNING: Current data will be replaced by cloud backup. Sure?")) return;

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'&fields=files(id)`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const data = await response.json();

            if (data.files && data.files.length > 0) {
                const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                const backupData = await fileRes.json();
                for (let key in backupData) { localStorage.setItem(key, backupData[key]); }
                showToast(currentLang === 'ar' ? "تم استرجاع البيانات بنجاح! سيتم إعادة التحميل..." : "Data restored successfully! Restarting...");
                setTimeout(() => location.reload(), 1500);
            } else { showToast(currentLang === 'ar' ? "لم يتم العثور على نسخة احتياطية في الدرايف" : "No backup found in Drive", "err"); }
        } catch (err) { showToast(currentLang === 'ar' ? "فشل الاسترجاع، تأكد من الاتصال بالنت" : "Restore failed, check connection", "err"); }
    });
// ==========================================
    // 17.8. SHIFT MANAGER LOGIC
    // ==========================================
    let shiftManagers = JSON.parse(localStorage.getItem("ca_shift_managers") || "[]");
    let currentManager = localStorage.getItem("ca_current_manager") || "";

    if($("currentShiftManagerName")) $("currentShiftManagerName").innerText = currentManager || "....";

    window.renderManagersList = function() {
        const list = $("managersList"); if(!list) return;
        let html = "";
        for(let i=0; i<shiftManagers.length; i++) {
            let m = shiftManagers[i];
            let isSelected = (m === currentManager);
            html += `
            <div class="item flexBetween" style="margin-bottom:8px; border: 1px solid ${isSelected ? 'var(--success)' : '#ddd'}; background: ${isSelected ? '#e8f5e9' : '#fff'};">
                <div style="flex:1; cursor:pointer;" onclick="window.selectManager('${m}')">
                    <b>أ/ ${m}</b> ${isSelected ? '✔️' : ''}
                </div>
                <button class="btn danger smallBtn iconOnly" onclick="window.deleteManager('${m}')">🗑️</button>
            </div>`;
        }
        list.innerHTML = html || `<div class="mutedCenter">لا يوجد أسماء، أضف اسماً جديداً.</div>`;
    };

    on("openShiftManagerBtn", "click", function() {
        window.renderManagersList();
        if($("shiftManagerModal")) $("shiftManagerModal").classList.remove("hidden");
    });

    on("addManagerBtn", "click", function() {
        let val = $("newManagerInp").value.trim();
        if(val && !shiftManagers.includes(val)) {
            shiftManagers.push(val);
            localStorage.setItem("ca_shift_managers", JSON.stringify(shiftManagers));
            $("newManagerInp").value = "";
            window.renderManagersList();
        }
    });

    window.selectManager = function(name) {
        currentManager = name;
        localStorage.setItem("ca_current_manager", currentManager);
        if($("currentShiftManagerName")) $("currentShiftManagerName").innerText = currentManager;
        window.renderManagersList();
        setTimeout(() => { if($("shiftManagerModal")) $("shiftManagerModal").classList.add("hidden"); }, 300);
    };

    window.deleteManager = function(name) {
        if(confirm(currentLang==='ar' ? `هل أنت متأكد من حذف (أ/ ${name})؟` : `Delete ${name}?`)) {
            shiftManagers = shiftManagers.filter(m => m !== name);
            localStorage.setItem("ca_shift_managers", JSON.stringify(shiftManagers));
            if(currentManager === name) {
                currentManager = ""; localStorage.removeItem("ca_current_manager");
                if($("currentShiftManagerName")) $("currentShiftManagerName").innerText = "....";
            }
            window.renderManagersList();
        }
    };
    // ==========================================
    // 18. INITIALIZATION (START ENGINE)
    // ==========================================
    function checkDailyBackup() {
        const last = localStorage.getItem(K_LAST_BACKUP);
        if(last !== nowDateStr()) {
            if($("btnTabAdmin")) $("btnTabAdmin").classList.add("needs-backup");
            setTimeout(function() {
                let msg = currentLang==='ar' ? '⚠️ تذكير: لم تقم بتصدير نسخة Excel اليوم!' : '⚠️ Backup reminder!';
                showToast(msg, 'warning');
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

    // Tabs Listeners
    on("btnTabHome", "click", function() { window.switchTab('Home'); });
    on("btnTabStudents", "click", function() { window.switchTab('Students'); renderList(); });
    on("btnTabRevenue", "click", function() { window.switchTab('Revenue'); renderCharts(); updateFinanceSummary(); });
    on("btnTabAdmin", "click", function() { window.switchTab('Admin'); });
    on("btnTabSyllabus", "click", function() { window.switchTab('Syllabus'); renderSyllabus(); });

    on("todayRevenue", "click", function(e) {
        if(isRevHidden) return; 
        const today = nowDateStr();
        let html = "";
        let count = 0;
        
        const allStuds = Object.values(students);
        for(let i=0; i<allStuds.length; i++) {
            let s = allStuds[i];
            if(s.payments && s.payments.length > 0) {
                for(let j=0; j<s.payments.length; j++) {
                    if(s.payments[j].date === today) {
                        let sClass = s.className ? s.className.trim() : "عام";
                        let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
                        let remain = req > 0 ? (req - s.paid) : 0;
                        if(remain < 0) remain = 0;
                        
                        html += `
                        <div class="item flexBetween" style="margin-bottom:8px; cursor:pointer;" onclick="document.getElementById('revenueModal').classList.add('hidden'); window.extOpen('${s.id}')">
                            <div>
                                <b>${s.name}</b> (#${s.id}) <span class="badge" style="background:#eee; color:#333;">${sClass}</span>
                            </div>
                            <div style="text-align:left;">
                                <span style="color:var(--success); font-weight:bold;">+ ${s.payments[j].amount} ج</span><br>
                                <span style="font-size:11px; color:#666;">المتبقي: ${remain} ج</span>
                            </div>
                        </div>`;
                        count++;
                    }
                }
            }
        }
        
        if(count === 0) html = `<div class="mutedCenter">${t("txt_no_rev")}</div>`;
        
        if($("revenueModalBody")) $("revenueModalBody").innerHTML = html;
        if($("revenueModal")) $("revenueModal").classList.remove("hidden");
    });

    // Startup Sequence
    loadAll(); 
    ensureBase500(); 
    checkAuth(); 
    applyLanguage(); 
    checkDailyBackup();
    setTimeout(checkQR, 500);

    // مزامنة صامتة عند فتح البرنامج في يوم جديد
    if (localStorage.getItem("last_cloud_sync_date") !== nowDateStr()) {
        setTimeout(() => { 
            if (accessToken) backupToDrive(false); 
        }, 8000);
    }
});
