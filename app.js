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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, child, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = { 
    apiKey: "AIzaSyCIEfTmssuOHlRw2sbVs4KUOnmoCKxBGfQ", 
    authDomain: "studify-88e15.firebaseapp.com", 
    databaseURL: "https://studify-88e15-default-rtdb.firebaseio.com", 
    projectId: "studify-88e15", 
    storageBucket: "studify-88e15.appspot.com", 
    messagingSenderId: "192529425530", 
    appId: "1:192529425530:web:f633acfc3736b3d28607c3" 
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let isFirebaseConnected = false;
let hasUnsavedChanges = false; // Set to true when writing, false when write succeeds

let wasOffline = false;

function setupConnectionTracker() {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            console.log("Firebase Connected! 🟢");
            isFirebaseConnected = true;
            // Only set to 'online' if there are no pending changes
            if (!hasUnsavedChanges) {
                if (typeof updateSyncUI === 'function') updateSyncUI('online', 'متصل ومتزامن ✅');
            } else {
                if (typeof updateSyncUI === 'function') updateSyncUI('pending', 'متصل - يوجد تغييرات لم تتم مزامنتها');
            }
            if (wasOffline) {
                if (typeof showToast === "function") {
                    showToast(currentLang === 'ar' ? "عاد الاتصال بالإنترنت 🌐 جاري المزامنة التلقائية..." : "Connection Restored 🌐 Syncing...", "success");
                }
                if (hasUnsavedChanges) {
                    setTimeout(() => { if (typeof saveAll === "function") saveAll(); }, 800);
                }
            }
            wasOffline = false;
        } else {
            console.log("Firebase Disconnected 🔴");
            isFirebaseConnected = false;
            wasOffline = true;
            if (typeof updateSyncUI === 'function') updateSyncUI('offline', 'غير متصل بالسحابة');
        }
    });

    // Warn user before closing if offline and there are potential unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges && !isFirebaseConnected) {
            e.preventDefault();
            e.returnValue = 'تحذير: لا يوجد اتصال بالإنترنت، هناك بيانات لم يتم مزامنتها مع السحابة!';
            return e.returnValue;
        }
    });
}
setupConnectionTracker();


document.addEventListener('DOMContentLoaded', function() {
    console.log("V-PRO MAX Engine: Initializing System...");
    
    // Sync UI with Mute State
    if($("muteSoundsToggle")) $("muteSoundsToggle").checked = window.isMuted;
    if($("soundIcon")) $("soundIcon").innerText = window.isMuted ? "🔇" : "🔊";

    if ($("toggleSoundsBtn")) {
        $("toggleSoundsBtn").addEventListener("click", function() {
            window.isMuted = !window.isMuted;
            localStorage.setItem("ca_muted", window.isMuted ? "1" : "0");
            if($("muteSoundsToggle")) $("muteSoundsToggle").checked = window.isMuted;
            if($("soundIcon")) $("soundIcon").innerText = window.isMuted ? "🔇" : "🔊";
            if (!window.isMuted) playSound("click");
        });
    }

    // ==========================================
    // 1. CONFIGURATION & AUTHENTICATION
    // ==========================================
    // Passwords are now managed in Firebase under users/{manager_id}/settings
    
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
    const K_SYLLABUS     = "ca_syllabus_v1"; 
    const K_EVAL         = "ca_eval_form_v1";
    const K_SESSION_STUDENTS = "ca_session_students_v1";
    const K_BOOKLETS     = "ca_booklets_v1";

    // ==========================================
    // 2.5 SECURE STORAGE LAYER (localForage + CryptoJS)
    // ==========================================
    const ENCRYPTION_KEY = "Studify_S3cur3_K3y_2026!";
    
    // Data keys that are HEAVY and must go to localForage (IndexedDB)
    const HEAVY_DATA_KEYS = [K_STUDENTS, K_ATT_BY_DATE, K_REVENUE, K_GROUP_FEES, 
                             K_EXPENSES, K_DELETED, K_SYLLABUS, K_EVAL, 
                             K_SESSION_STUDENTS, K_BOOKLETS];

    // Keys that STAY in localStorage (tiny, need synchronous boot access)
    // K_AUTH, K_ROLE, K_LANG, K_THEME, K_BG_IMAGE, K_NOTEBOOK, K_LAST_BACKUP,
    // ca_manager_id, ca_current_username, ca_muted, ca_migrated, etc.

    // Sync state tracking
    let localTimestamps = {}; // { ca_students_v6: 1720180000000, ... }
    let syncInProgress = false;

    // --- Encryption Helpers ---
    function encryptData(data) {
        try {
            const jsonStr = JSON.stringify(data);
            return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_KEY).toString();
        } catch(e) {
            console.error("[Encrypt] Failed:", e);
            return JSON.stringify(data); // Fallback: save unencrypted
        }
    }

    function decryptData(cipherText) {
        try {
            if (!cipherText) return null;
            // If it's not encrypted (legacy data), parse directly
            if (cipherText.startsWith('{') || cipherText.startsWith('[') || cipherText.startsWith('"')) {
                return JSON.parse(cipherText);
            }
            const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) return null;
            return JSON.parse(decrypted);
        } catch(e) {
            console.error("[Decrypt] Failed:", e);
            // Try parsing as plain JSON (migration scenario)
            try { return JSON.parse(cipherText); } catch(e2) { return null; }
        }
    }

    // --- Async Storage Wrappers ---
    async function secureSave(key, data) {
        try {
            const encrypted = encryptData(data);
            await localforage.setItem(key, encrypted);
            // Update local timestamp
            localTimestamps[key] = Date.now();
            await localforage.setItem('_timestamps', localTimestamps);
        } catch(e) {
            console.error("[secureSave] Error for key:", key, e);
        }
    }

    async function secureLoad(key, fallback) {
        try {
            const raw = await localforage.getItem(key);
            if (raw === null || raw === undefined) return fallback;
            const decrypted = decryptData(raw);
            return decrypted !== null ? decrypted : fallback;
        } catch(e) {
            console.error("[secureLoad] Error for key:", key, e);
            return fallback;
        }
    }

    // --- Migration: localStorage → localForage (One-time) ---
    async function initStorageMigration() {
        const migrated = await localforage.getItem('_idb_migrated');
        if (migrated === true) {
            console.log("[Migration] Already migrated to IndexedDB. Skipping.");
            // Load timestamps
            localTimestamps = (await localforage.getItem('_timestamps')) || {};
            return;
        }

        console.log("[Migration] Starting localStorage → IndexedDB migration...");
        let migratedCount = 0;

        for (const key of HEAVY_DATA_KEYS) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    await secureSave(key, parsed);
                    localStorage.removeItem(key); // Free up the 5MB space
                    migratedCount++;
                    console.log(`[Migration] ✅ Migrated: ${key}`);
                } catch(e) {
                    console.error(`[Migration] ❌ Failed for ${key}:`, e);
                }
            }
        }

        // Mark migration as complete
        await localforage.setItem('_idb_migrated', true);
        localTimestamps = (await localforage.getItem('_timestamps')) || {};
        console.log(`[Migration] Complete! Migrated ${migratedCount} keys to IndexedDB.`);
        
        if (migratedCount > 0 && typeof showToast === 'function') {
            showToast("تم ترقية قاعدة البيانات المحلية بنجاح ✅", "success");
        }
    }

    // --- Sync UI Helpers ---
    function updateSyncUI(state, title) {
        // state: 'online' | 'offline' | 'pending' | 'syncing'
        const indicator = document.getElementById("cloudSyncIndicator");
        const dot = document.getElementById("syncStatusDot");
        const badge = document.getElementById("syncPendingBadge");
        
        if (indicator) {
            indicator.classList.remove("online", "offline", "pending", "syncing");
            indicator.classList.add(state);
            indicator.title = title || "";
        }
        if (dot) {
            dot.classList.remove("online", "offline", "pending");
            dot.classList.add(state === 'syncing' ? 'pending' : state);
        }
        if (badge) {
            if (state === 'pending') {
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }
    }

    // GLOBAL TENANT STATE
    window.CURRENT_MANAGER_ID = localStorage.getItem("ca_manager_id") || "";
    window.CURRENT_ROLE = localStorage.getItem(K_ROLE) || "";

    // Self-healing: old sessions on mobile may not have ca_manager_id
    if (localStorage.getItem(K_AUTH) === "1" && !window.CURRENT_MANAGER_ID) {
        if (window.CURRENT_ROLE === "admin") {
            window.CURRENT_MANAGER_ID = "ahmedqutb11232_gmail_com";
            localStorage.setItem("ca_manager_id", window.CURRENT_MANAGER_ID);
            console.log("[Self-Heal] Restored missing ca_manager_id for admin.");
        } else {
            // Assistant without manager ID must re-login
            localStorage.removeItem(K_AUTH);
            console.log("[Self-Heal] Cleared invalid assistant session.");
        }
    }

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
    let evalData         = {};
    let sessionStudentsByDate = {};
    let bookletsStock    = {};
    
    let currentId        = null;
    let currentUserRole  = window.CURRENT_ROLE || "admin";
    let currentPage      = 1;
    let currentFilteredList = [];
    let recentScans      = [];
    let isRevHidden      = false;
    let passSuccessCallback = null;
    let currentLang      = localStorage.getItem(K_LANG) || "ar";

    // Global Enter Key Handler for Inputs
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.id === 'searchAny') document.getElementById("searchBtn")?.click();
            else if (target.id === 'openId') document.getElementById("openIdBtn")?.click();
            else if (target.id === 'quickAttendId') document.getElementById("quickAttendBtn")?.click();
            else if (target.id === 'newId') document.getElementById("addNewBtn")?.click();
            else if (target.id === 'stName' || target.id === 'stPhone') document.getElementById("saveStudentBtn")?.click();
            else if (target.id === 'newPaymentInput') document.getElementById("addPaymentBtn")?.click();
            else if (target.id === 'sessStName' || target.id === 'sessStPhone' || target.id === 'sessStAmount') document.getElementById("saveSessionStBtn")?.click();
            else if (target.id === 'managerUser' || target.id === 'managerPass') document.getElementById("managerLoginBtn")?.click();
            else if (target.id === 'assistantCenterCode' || target.id === 'assistantUser' || target.id === 'assistantPass') document.getElementById("assistantLoginBtn")?.click();
            else if (target.id === 'customPassInput') document.getElementById("customPassConfirm")?.click();
            else if (target.id === 'tableSearchInp') target.blur(); 
        }
    });

    // Data Migration Function
    async function migrateLocalDataToManager() {
        if (window.CURRENT_ROLE !== 'admin' || !window.CURRENT_MANAGER_ID) return;
        if (localStorage.getItem("ca_migrated") === "true") return;

        try {
            console.log("Migrating local data to new multi-tenant structure...");
            const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
            
            // Push all current local state to the new path
            await update(dbRef, {
                'students': students,
                'deletedStudents': deletedStudents,
                'attendance': attByDate,
                'finances/revenue': revenueByDate,
                'finances/expenses': expensesByDate,
                'packages': groupFees,
                'syllabus': syllabusData,
                'evaluations': evalData,
                'sessionStudents': sessionStudentsByDate,
                'booklets': bookletsStock
            });
            
            localStorage.setItem("ca_migrated", "true");
            console.log("Migration Successful! Data is now isolated under manager:", window.CURRENT_MANAGER_ID);
        } catch (e) {
            console.error("Migration failed:", e);
        }
    }

    // ==========================================
    // 3. THE COMPREHENSIVE DICTIONARY
    // ==========================================
    const dict = {
        "grp_daily": { ar: "الإدارة اليومية", en: "Daily Operations" },
        "nav_session_st": { ar: "طلاب الحصة", en: "Session Students" },
        "grp_finance": { ar: "الحسابات والإحصائيات", en: "Finance & Analytics" },
        "grp_tools": { ar: "أدوات وتسويق", en: "Tools & Marketing" },
        "nav_booklets": { ar: "مخزون المذكرات", en: "Booklets Inventory" },
        "nav_marketing": { ar: "حملات التسويق", en: "Marketing Campaigns" },
        "grp_system": { ar: "إعدادات النظام", en: "System Settings" },
        "note_header": { ar: "ملاحظات الطالب (منفصلة وقابلة للتعديل)", en: "Student Notes (Editable)" },
        "txt_no_notes": { ar: "لا توجد ملاحظات مسجلة لهذا الطالب", en: "No notes recorded for this student" },
        "print_receipt_lock": { ar: "إصدار إيصال سداد الباقة (مغلق لحين إكمال الدفع)", en: "Issue Package Receipt (Locked until full payment)" },
        "print_receipt_unlock": { ar: "🖨️ طباعة إيصال سداد الباقة (مكتمل)", en: "🖨️ Print Package Receipt (Completed)" },
        "correct_pay_btn": { ar: "إيداع", en: "Deposit" },
       "shift_manager": { ar: "مسئول الشيفت:", en: "Shift Manager:" },
        "modal_shift_title": { ar: "👨‍💼 اختيار مسئول الشيفت", en: "👨‍💼 Select Shift Manager" },
        "plc_new_manager": { ar: "اسم المسئول الجديد...", en: "New manager name..." },
        "btn_add_manager": { ar: "إضافة", en: "Add" },
        "err_no_manager": { ar: "يرجى اختيار اسم مسئول الشيفت أولاً", en: "Please select a shift manager first" },
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
        "msg_saved": { ar: "تم الحفظ بنجاح ✅", en: "Progress saved ✅" },
        "msg_err_pass": { ar: "كلمة مرور خاطئة ❌", en: "Incorrect Password ❌" },
        "msg_att_ok": { ar: "تم تسجيل الحضور ✅", en: "Attendance Recorded ✅" },
        "msg_att_warn": { ar: "حاضر مسبقاً ⚠️", en: "Already marked present ⚠️" },
        "msg_added": { ar: "تم إضافة الطالب بنجاح ✅", en: "Student registered ✅" },
        "msg_deleted": { ar: "تم حذف الطالب", en: "Student deleted" },
        "msg_undo": { ar: "تم التراجع بنجاح ✅", en: "Action Undone ✅" },
        "msg_copied": { ar: "تم نسخ التقرير 📋", en: "Report Copied 📋" },
        "txt_streak": { ar: "حصة متتالية", en: "Classes Streak" },
        "txt_paid_full": { ar: "✅ خالص (مكتمل)", en: "✅ Fully Paid" },
        "txt_free": { ar: "✅ بدون مصاريف", en: "✅ Free" },
        "wa_net": { ar: "💵 صافي الربح", en: "💵 Net Profit" },
        "wa_exp": { ar: "🔻 المصروفات", en: "🔻 Expenses" },
        "nav_reports": { ar: "التقارير", en: "Reports" },
        "reports_main_title": { ar: "📊 التقارير التحليلية والمالية", en: "📊 Analytical & Financial Reports" },
        "btn_export_colored": { ar: "📥 تصدير التقرير (Excel ملون)", en: "📥 Export Colored Report (Excel)" },
        "term_fin_summary": { ar: "📈 الملخص المالي التحليلي للترم", en: "📈 Term Financial Summary" },
        "term_total_req": { ar: "إجمالي المطلوب (الكامل)", en: "Total Expected (Full)" },
        "term_total_paid": { ar: "إجمالي المحصل (الفعلي)", en: "Total Collected (Actual)" },
        "term_total_remain": { ar: "إجمالي المتبقي (المديونيات)", en: "Total Remaining (Debts)" },
        "debtors_list_title": { ar: "⚠️ قائمة الطلاب المديونين", en: "⚠️ Debtors Students List" },
        "debtors_count_lbl": { ar: "عدد المديونين:", en: "Debtors Count:" },
        "debtors_desc": { ar: "جدول ديناميكي يعرض الطلاب الذين عليهم مبالغ متبقية فقط من الباقات.", en: "Dynamic table displaying students with remaining package debts." },
        "tbl_remain_amount": { ar: "المبلغ المتبقي عليه", en: "Remaining Debt" },
        "eval_form_title": { ar: "📋 تقرير التقييم الإداري (Evaluation Form)", en: "📋 Administrative Evaluation Form" },
        "eval_form_desc": { ar: "نموذج مخصص لإدخال وحفظ بيانات التقييم الإداري للسنتر.", en: "Custom form to enter and save center evaluation data." },
        "eval_center_name": { ar: "اسم السنتر:", en: "Center Name:" },
        "eval_manager": { ar: "المسؤول:", en: "Manager:" },
        "eval_packages": { ar: "الباقات:", en: "Packages:" },
        "eval_students_count": { ar: "عدد الطلبة:", en: "Students Count:" },
        "eval_current_courses": { ar: "الكورسات الحالية:", en: "Current Courses:" },
        "eval_collab_opps": { ar: "فرص التعاون:", en: "Collaboration Opportunities:" },
        "eval_notes": { ar: "ملاحظات:", en: "Notes:" },
        "eval_followup_plan": { ar: "خطة المتابعة:", en: "Follow-up Plan:" },
        "eval_needs": { ar: "احتياجات السنتر أو المقترحات التي تم مناقشتها:", en: "Center Needs / Suggested Proposals:" },
        "eval_final_rate": { ar: "التقييم النهائي:", en: "Final Evaluation:" },
        "btn_save_eval": { ar: "حفظ التقييم الإداري 💾", en: "Save Evaluation 💾" },
        "opt_cash": { ar: "💵 كاش", en: "💵 Cash" },
        "opt_instapay": { ar: "🟣 إنستاباي", en: "🟣 InstaPay" },
        "opt_wallet": { ar: "🔴 فودافون كاش", en: "🔴 Vodafone Cash" },
        "lbl_pay_history": { ar: "📋 سجل دفعات الطالب المفصل:", en: "📋 Detailed Payments History:" },
        "txt_no_payments": { ar: "لا توجد دفعات مسجلة حتى الآن", en: "No payments recorded yet" },
        "notes_lock_msg": { ar: "يرجى اختيار أو البحث عن طالب أولاً لتفعيل الملاحظات", en: "Please select or search for a student first to enable notes" },
        "btn_delete": { ar: "🗑️ حذف", en: "🗑️ Delete" },
        "btn_edit_note": { ar: "تعديل الملحوظة", en: "Edit Note" },
        "btn_del_note": { ar: "مسح الملحوظة", en: "Delete Note" },
        "btn_del_payment": { ar: "حذف الدفعة", en: "Delete Payment" },
        "txt_cash_old": { ar: "💵 كاش (رصيد سابق)", en: "💵 Cash (Prior Balance)" },
        "badge_instapay": { ar: "🟣 إنستاباي", en: "🟣 InstaPay" },
        "badge_wallet": { ar: "🔴 فودافون كاش", en: "🔴 Vodafone Cash" },
        "badge_cash": { ar: "💵 كاش", en: "💵 Cash" },
        "prompt_edit_note": { ar: "✏️ تعديل نص الملحوظة:", en: "✏️ Edit note text:" },
        "confirm_empty_note": { ar: "⚠️ النص فارغ، هل تريد مسح الملحوظة؟", en: "⚠️ Text is empty, delete note?" },
        "confirm_del_note": { ar: "⚠️ متأكد من مسح هذه الملحوظة نهائياً؟", en: "⚠️ Are you sure you want to delete this note?" },
        "msg_note_edited": { ar: "تم تعديل الملحوظة بنجاح ✏️", en: "Note edited successfully ✏️" },
        "msg_note_deleted": { ar: "تم مسح الملحوظة 🗑️", en: "Note deleted 🗑️" },
        "quick_controls_title": { ar: "🛠️ قائمة التحكم السريعة", en: "🛠️ Quick Controls Menu" },
        "quick_switch_role": { ar: "تبديل الصلاحيات (مسؤول)", en: "Switch Privileges (Admin)" },
        "quick_group_fees": { ar: "إدارة الباقات والمصاريف", en: "Group Packages & Fees" },
        "quick_export": { ar: "تصدير التقرير التحليلي", en: "Export Analytics Report" },
        "quick_bin": { ar: "سلة المحذوفات", en: "Recycle Bin" },
        "sess_main_title": { ar: "<span>🎟️</span> نظام تسجيل طلاب الحصة الفورية", en: "<span>🎟️</span> Immediate Session Students" },
        "sess_main_desc": { ar: "تسجيل الحضور والدفع للطلاب المؤقتين (بدون إصدار كارت أو حجز ID دائم في قاعدة البيانات)", en: "Quick attendance and payment for temporary students (without permanent card/ID in database)" },
        "sess_add_title": { ar: "➕ تسجيل حضور ودفع فوري", en: "➕ Quick Attend & Payment" },
        "sess_name_lbl": { ar: "اسم الطالب *", en: "Student Name *" },
        "sess_name_plc": { ar: "مثال: أحمد محمود عثمان", en: "Ex: Ahmed Mahmoud Osman" },
        "sess_phone_lbl": { ar: "رقم الموبايل (اختياري)", en: "Mobile Number (Optional)" },
        "sess_phone_plc": { ar: "مثال: 01012345678", en: "Ex: 01012345678" },
        "sess_class_lbl": { ar: "المادة / الصف / الباقة", en: "Subject / Class / Package" },
        "sess_class_opt": { ar: "حصة فردية (عام)", en: "Individual Session (General)" },
        "sess_amount_lbl": { ar: "مبلغ الحصة *", en: "Session Amount *" },
        "sess_amount_plc": { ar: "المبلغ (ج)", en: "Amount (EGP)" },
        "sess_method_lbl": { ar: "طريقة الدفع *", en: "Payment Method *" },
        "sess_save_btn": { ar: "تسجيل الحضور وتحصيل المبلغ 💾", en: "Record Attend & Collect 💾" },
        "sess_list_title": { ar: "📋 سجل طلاب الحصة", en: "📋 Session Students Log" },
        "sess_no_students": { ar: "لا يوجد طلاب مسجلين بالحصة لهذا اليوم", en: "No session students recorded for this day" },
        "booklets_main_title": { ar: "<span>📚</span> إدارة مخزون المذكرات والورق", en: "<span>📚</span> Booklets & Inventory Stock" },
        "booklets_main_desc": { ar: "متابعة حركة طباعة واستلام المذكرات، المباع منها، المخزون المتبقي، وإجمالي العائد المالي بدقة تامة دون هدر.", en: "Monitor booklet prints, received copies, sold copies, remaining stock, and total revenue with complete accuracy." },
        "stat_b_types": { ar: "أنواع المذكرات", en: "Booklet Types" },
        "stat_b_recd": { ar: "إجمالي النسخ المستلمة", en: "Total Received Copies" },
        "stat_b_sold": { ar: "النسخ المباعة", en: "Sold Copies" },
        "stat_b_remain": { ar: "المخزون المتبقي بالسنتر", en: "Remaining Center Stock" },
        "stat_b_rev": { ar: "إجمالي عائد المذكرات 💰", en: "Total Booklets Revenue 💰" },
        "booklet_add_title": { ar: "➕ استلام وتسجيل ورق / مذكرة جديدة", en: "➕ Receive & Register New Booklet" },
        "booklet_name_lbl": { ar: "اسم المذكرة / الورق", en: "Booklet / Note Name" },
        "booklet_name_plc": { ar: "مثال: مذكرة مراجعة الباب الأول...", en: "Ex: Chapter 1 Review Booklet..." },
        "booklet_qty_lbl": { ar: "العدد الكلي المستلم (نسخة)", en: "Total Received (Copies)" },
        "booklet_qty_plc": { ar: "مثال: 150", en: "Ex: 150" },
        "booklet_price_lbl": { ar: "سعر بيع النسخة (جنيه)", en: "Selling Price (EGP)" },
        "booklet_price_plc": { ar: "مثال: 50", en: "Ex: 50" },
        "booklet_save_btn": { ar: "💾 تسجيل المذكرة وإضافتها للمخزون", en: "💾 Save Booklet & Add to Stock" },
        "booklet_list_title": { ar: "📋 قائمة جرد المذكرات وحركة البيع الفورية", en: "📋 Booklets Inventory & Instant Sales" },
        "booklet_list_tip": { ar: "اضغط زر البيع 🛒 عند بيع أي نسخة للتحديث الفوري", en: "Click Sale 🛒 when selling any copy for instant updates" },
        "booklet_no_items": { ar: "لا توجد مذكرات مسجلة بالمخزون حالياً", en: "No booklets currently registered in stock" },
        "mkt_main_title": { ar: "<span>🚀</span> حملات التسويق وإعادة الاستهداف الذكية", en: "<span>🚀</span> Smart Marketing & Retargeting Campaigns" },
        "mkt_main_desc": { ar: "استهداف ذكي لجميع أرقام وداتا الطلاب المسجلة في السنتر لإطلاق حملات إعلانية لكورسات ومراجعات جديدة بضغطة زر.", en: "Smart targeting of all student data in the center to launch advertising campaigns for new courses with one click." },
        "mkt_setup_title": { ar: "🎯 إعداد شريحة الاستهداف الإعلانية", en: "🎯 Setup Campaign Targeting Segment" },
        "mkt_target_lbl": { ar: "اختر شريحة الطلاب المستهدفة", en: "Select Target Student Segment" },
        "mkt_opt_all": { ar: "جميع الطلاب الدائمين المسجلين بالسنتر", en: "All Permanent Students in Center" },
        "mkt_opt_groups": { ar: "طلاب باقة / مجموعة محددة", en: "Students of Specific Package/Group" },
        "mkt_opt_session": { ar: "داتا طلاب الحصة الفورية (المؤقتين)", en: "Session Students Data (Temporary)" },
        "mkt_opt_vip": { ar: "الطلاب أصحاب تصنيف VIP", en: "VIP Classified Students" },
        "mkt_opt_debtors": { ar: "الطلاب أصحاب الدفعات المتبقية (المديونين)", en: "Debtors Students (Remaining Balance)" },
        "mkt_select_grp_lbl": { ar: "تحديد الباقة / المجموعة", en: "Select Package / Group" },
        "mkt_opt_select": { ar: "-- اختر الباقة --", en: "-- Select Package --" },
        "mkt_msg_lbl": { ar: "📝 نص الرسالة الإعلانية / التنبيه", en: "📝 Message / Broadcast Body" },
        "mkt_msg_plc": { ar: "اكتب هنا نص الإعلان أو التنبيه...\nيمكنك استخدام الوسوم الذكية [اسم_الطالب] و [المبلغ] وسيتم استبدالها تلقائياً لكل طالب.", en: "Write your broadcast text here...\nYou can use smart tags [اسم_الطالب] and [المبلغ] for dynamic student replacement." },
        "mkt_vars_tip": { ar: "💡 المتغيرات الذكية المدعومة في الرسالة:", en: "💡 Supported Smart Variables:" },
        "mkt_click_tip": { ar: "(اضغط على الوسم لإضافته للنص)", en: "(Click tag to insert into text)" },
        "mkt_filter_btn": { ar: "🔍 تصفية وعرض داتا الأرقام المستهدفة", en: "🔍 Filter & View Target Numbers Data" },
        "mkt_broadcast_btn": { ar: "🚀 بدء الإرسال التلقائي الذكي (بفاصل زمني لمنع الحظر)", en: "🚀 Start Smart Auto Broadcast (Anti-Ban Interval)" },
        "mkt_copy_btn": { ar: "📋 نسخ جميع أرقام الموبايل (لبرامج خارجية)", en: "📋 Copy All Mobile Numbers (For External Apps)" },
        "mkt_broad_prep": { ar: "جاري الاستعداد لبدء البث التلقائي...", en: "Preparing to start auto broadcast..." },
        "mkt_broad_sub": { ar: "سيتم فتح نوافذ المحادثات تباعاً بفاصل زمني آمن لحماية حسابك من الحظر (Anti-Ban).", en: "Chat windows will open sequentially with a safe delay to protect your account from ban." },
        "btn_pause": { ar: "⏸ إيقاف مؤقت", en: "⏸ Pause" },
        "btn_stop": { ar: "⏹ إنهاء البث", en: "⏹ Stop Broadcast" },
        "lbl_progress": { ar: "مستوى التقدم:", en: "Progress Level:" },
        "lbl_next_win": { ar: "النافذة التالية خلال:", en: "Next Window in:" },
        "lbl_seconds": { ar: "ثواني", en: "seconds" },
        "mkt_list_title": { ar: "📋 قائمة الأرقام المستهدفة في الحملة", en: "📋 Target Campaign Numbers List" },
        "lbl_student_cnt": { ar: "طالب", en: "student(s)" },
        "mkt_list_tip": { ar: "اضغط زر المراسلة 💬 بجانب أي طالب لبدء الإرسال الفوري", en: "Click chat button 💬 next to any student for instant messaging" },
        "mkt_no_data": { ar: "اضغط على \"تصفية وعرض داتا الأرقام المستهدفة\" لعرض القائمة", en: "Click 'Filter & View Target Numbers Data' to display list" },
        "vaults_title": { ar: "🏦 خزائن ومحافظ السنتر (إجمالي الأرصدة)", en: "🏦 Center Vaults & Wallets (Total Balances)" },
        "vault_cash": { ar: "💵 خزينة الكاش", en: "💵 Cash Vault" },
        "vault_today": { ar: "تحصيل اليوم:", en: "Collected Today:" },
        "vault_total": { ar: "إجمالي المحصل:", en: "Total Collected:" },
        "vault_exp": { ar: "المصروفات:", en: "Expenses:" },
        "vault_net": { ar: "الصافي بالخزينة:", en: "Net in Vault:" },
        "vault_instapay": { ar: "🟣 خزينة إنستاباي (InstaPay)", en: "🟣 InstaPay Vault" },
        "vault_act_total": { ar: "الرصيد الفعلي:", en: "Actual Balance:" },
        "vault_wallet": { ar: "🔴 فودافون كاش والمحافظ", en: "🔴 Vodafone Cash & Wallets" },
        "btn_print": { ar: "🖨️ طباعة (A4 / إيصال)", en: "🖨️ Print (A4 / Receipt)" },
        "btn_photo_mode": { ar: "📱 وضع التصوير بالهاتف", en: "📱 Mobile Photo Mode" },
        "btn_close_rec": { ar: "✖ إغلاق", en: "✖ Close" },
        "photo_mode_tip": { ar: "📸 الشاشة الآن في وضع التصوير الصافي للطالب .. اضغط هنا لإعادة إظهار أزرار الإغلاق والطباعة 🔄", en: "📸 Screen is in clean photo mode .. Click here to restore Close & Print buttons 🔄" },
        "receipt_paid_full": { ar: "خالص السداد ✔️", en: "Paid in Full ✔️" },
        "receipt_st_details_title": { ar: "📜 بيانات التسجيل والسداد", en: "📜 Registration & Payment Details" },
        "receipt_lbl_name": { ar: "اسم الطالب:", en: "Student Name:" },
        "receipt_lbl_id": { ar: "كود التعريف (ID):", en: "Definition Code (ID):" },
        "receipt_lbl_class": { ar: "الباقة / المجموعة:", en: "Package / Group:" },
        "receipt_lbl_phone": { ar: "رقم الموبايل:", en: "Mobile Number:" },
        "receipt_lbl_total": { ar: "المبلغ الكلي المدفوع", en: "TOTAL PAID AMOUNT" },
        "receipt_inc_methods": { ar: "شامل طرق الدفع المسجلة بالسنتر", en: "Includes all registered payment methods" },
        "receipt_auth_title": { ar: "📜 اعتماد إلكتروني معتمد", en: "📜 Certified Electronic Approval" },
        "receipt_auth_sub": { ar: "توقيع الموظف / المحاسب المسئول", en: "Authorized Accountant / Employee Signature" },
        "receipt_sec_code": { ar: "رمز التحقق الأمني", en: "Security Verification Code" }
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

    // -- Activity Log & Notifications --
    window.logAction = function(actionType, details) {
        if (!window.CURRENT_MANAGER_ID || !isFirebaseConnected) return;
        const now = Date.now();
        const user = window.CURRENT_ROLE === 'admin' ? 'المدير' : ($("currentShiftManagerName") ? $("currentShiftManagerName").innerText : 'المساعد');
        
        const logEntry = {
            time: now,
            user: user,
            actionType: actionType,
            details: details
        };

        const logRef = ref(database, `users/${window.CURRENT_MANAGER_ID}/activity/${now}`);
        update(logRef, logEntry).catch(e => console.log("Log error:", e));
    };

    let lastReadActivityTime = toInt(localStorage.getItem("ca_last_read_activity") || "0");

    window.fetchActivityLog = function() {
        if (!window.CURRENT_MANAGER_ID || !isFirebaseConnected) return;
        const logRef = ref(database, `users/${window.CURRENT_MANAGER_ID}/activity`);
        onValue(logRef, (snap) => {
            if (snap.exists()) {
                const logs = snap.val();
                let logArray = [];
                for (let key in logs) { logArray.push(logs[key]); }
                logArray.sort((a, b) => b.time - a.time); // Descending
                
                renderActivityLog(logArray);
                if (window.CURRENT_ROLE === 'admin') updateNotifications(logArray);
            } else {
                renderActivityLog([]);
            }
        });
    };

    function renderActivityLog(logs) {
        const body = $("activityLogBody");
        if (!body) return;
        if (logs.length === 0) {
            body.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">لا توجد عمليات مسجلة حتى الآن</div>';
            return;
        }
        let html = '';
        logs.forEach(log => {
            const dateStr = new Date(log.time).toLocaleString('ar-EG');
            html += `
            <div style="border: 1px solid var(--border); padding: 10px; margin-bottom: 10px; border-radius: 8px; background: var(--bg-surface);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: bold; color: var(--primary);">${log.actionType}</span>
                    <span style="font-size: 0.85em; color: #888;">${dateStr}</span>
                </div>
                <div style="margin-bottom: 5px;">${log.details}</div>
                <div style="font-size: 0.85em; color: var(--success);">بواسطة: ${log.user}</div>
            </div>`;
        });
        body.innerHTML = html;
    }

    function updateNotifications(logs) {
        let unreadCount = 0;
        let html = '';
        const notifList = $("notificationsList");
        const badge = $("notificationsBadge");
        
        logs.slice(0, 30).forEach(log => {
            const isUnread = log.time > lastReadActivityTime;
            if (isUnread) unreadCount++;
            
            const dateStr = new Date(log.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            // For dark mode compatibility, we use rgba for highlight instead of static color
            html += `
            <div style="padding: 10px; border-radius: 8px; background: ${isUnread ? 'rgba(0,123,255,0.1)' : 'transparent'}; border-right: 3px solid ${isUnread ? 'var(--primary)' : 'var(--border)'}; font-size: 0.9em;">
                <div style="font-weight: bold; margin-bottom: 4px;">${log.actionType}</div>
                <div style="color: var(--text-color); margin-bottom: 4px; opacity: 0.8;">${log.details}</div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8em; color: #888;">
                    <span>${log.user}</span>
                    <span>${dateStr}</span>
                </div>
            </div>`;
        });
        
        if (logs.length === 0) {
            html = '<div style="text-align: center; color: #888; padding: 10px;">لا يوجد إشعارات</div>';
        }
        
        if (notifList) notifList.innerHTML = html;
        if (badge) {
            if (unreadCount > 0) {
                badge.innerText = unreadCount;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }
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

    function showFullscreenFeedback(isSuccess, isAlreadyPresent = false) {
        let box = $("fullscreenFeedback");
        let icon = $("feedbackIcon");
        if(!box || !icon) return;
        box.classList.remove("hidden");
        void box.offsetWidth;
        if (isSuccess) {
            icon.innerHTML = "✅";
        } else if (isAlreadyPresent) {
            icon.innerHTML = "⚠️";
        } else {
            icon.innerHTML = "❌";
        }
        setTimeout(() => { box.classList.add("hidden"); }, 400);
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
        if (!document.getElementById("confetti-styles")) {
            const style = document.createElement("style");
            style.id = "confetti-styles";
            style.innerHTML = `
            .confetti-particle {
                position: fixed;
                top: -20px;
                z-index: 999999;
                pointer-events: none;
                animation: fall linear forwards;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            @keyframes fall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
            }
            .celebration-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1e3a8a, #2563eb);
                color: #ffffff;
                padding: 30px 50px;
                border-radius: 20px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7), 0 0 30px rgba(251, 191, 36, 0.6);
                border: 3px solid #fbbf24;
                z-index: 9999999;
                text-align: center;
                animation: popInOut 4.2s ease-in-out forwards;
            }
            @keyframes popInOut {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                10% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
                15% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                85% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            }
            `;
            document.head.appendChild(style);
        }

        const popup = document.createElement("div");
        popup.className = "celebration-popup";
        popup.innerHTML = `
            <div style="font-size: 3.8em; margin-bottom: 12px;">🏆🎉</div>
            <h2 style="margin: 0; font-size: 2em; font-weight: 900; color: #fbbf24;">اكتمل سداد الباقة بالكامل</h2>
            <p style="margin: 12px 0 0 0; font-size: 1.2em; opacity: 0.95;">ألف مبروك .. أصبح حساب الطالب خالص السداد 100% ✅</p>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 4200);

        const colors = ['#2563eb', '#3b82f6', '#fbbf24', '#10b981', '#ffffff', '#f59e0b', '#60a5fa'];
        for(let i = 0; i < 75; i++) {
            const conf = document.createElement("div"); 
            conf.className = "confetti-particle";
            
            const size = Math.floor(Math.random() * 12) + 8;
            conf.style.width = size + "px";
            conf.style.height = (Math.random() > 0.5 ? size : size * 1.5) + "px";
            if(Math.random() > 0.6) conf.style.borderRadius = "50%";
            
            conf.style.left = Math.random() * 100 + "vw"; 
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.animationDuration = (Math.random() * 2.5 + 1.5) + "s"; 
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 4000);
        }
    }
    window.isMuted = (localStorage.getItem("ca_muted") === "1");

    function playSound(type) {
        if (window.isMuted) return;
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
    // === MOBILE SIDEBAR BACK-BUTTON HISTORY LOGIC ===
    // ==========================================
    function openMobileSidebar() {
        var sidebar = $("sidebarNav");
        var overlay = $("sidebarOverlay");
        if(sidebar && !sidebar.classList.contains("mobile-open")) {
            sidebar.classList.add("mobile-open");
            if(overlay) overlay.classList.add("active");
            history.pushState({ sidebarOpen: true }, "", "#sidebar");
        }
    }

    function closeMobileSidebar(fromPopstate) {
        var sidebar = $("sidebarNav");
        var overlay = $("sidebarOverlay");
        if(sidebar && sidebar.classList.contains("mobile-open")) {
            sidebar.classList.remove("mobile-open");
            if(overlay) overlay.classList.remove("active");
            if(!fromPopstate && history.state && history.state.sidebarOpen) {
                history.back();
            }
        }
    }

    window.addEventListener("popstate", function(e) {
        var sidebar = $("sidebarNav");
        if(sidebar && sidebar.classList.contains("mobile-open")) {
            closeMobileSidebar(true);
        }
    });

    // ==========================================
    // 5. GLOBAL NAVIGATION & TABS
    // ==========================================
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
        const target = $("sec" + tabId); 
        if(target) target.classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = $("btnTab" + tabId); 
        if(activeBtn) {
            activeBtn.classList.add('active');
            const activeGroup = activeBtn.closest('.nav-group');
            if (activeGroup) {
                document.querySelectorAll('.nav-group').forEach(g => g.classList.add('collapsed'));
                activeGroup.classList.remove('collapsed');
            }
        }
        closeMobileSidebar(false);
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
    async function saveAll() {
        try {
            hasUnsavedChanges = true;
            updateSyncUI('pending', 'جاري الحفظ...');

            // Save to IndexedDB (encrypted, async, no 5MB limit)
            await Promise.all([
                secureSave(K_STUDENTS, students),
                secureSave(K_ATT_BY_DATE, attByDate),
                secureSave(K_REVENUE, revenueByDate),
                secureSave(K_GROUP_FEES, groupFees),
                secureSave(K_EXPENSES, expensesByDate),
                secureSave(K_DELETED, deletedStudents),
                secureSave(K_SYLLABUS, syllabusData),
                secureSave(K_EVAL, evalData),
                secureSave(K_SESSION_STUDENTS, sessionStudentsByDate),
                secureSave(K_BOOKLETS, bookletsStock)
            ]);

            updateTopStats(); updateFinanceSummary(); renderCharts();
            if (typeof renderReportsPage === "function") renderReportsPage();

            // Push to Firebase
            if (window.CURRENT_MANAGER_ID) {
                updateSyncUI('syncing', 'جاري المزامنة مع السحابة...');
                
                const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
                update(dbRef, {
                    'students': students,
                    'attendance': attByDate,
                    'finances/revenue': revenueByDate,
                    'packages': groupFees,
                    'finances/expenses': expensesByDate,
                    'deletedStudents': deletedStudents,
                    'syllabus': syllabusData,
                    'evaluations': evalData,
                    'sessionStudents': sessionStudentsByDate,
                    'booklets': bookletsStock,
                    '_lastModified': Date.now()
                }).then(() => {
                    hasUnsavedChanges = false;
                    updateSyncUI('online', 'متصل ومتزامن ✅');
                }).catch(e => {
                    console.error("Firebase update error:", e);
                    updateSyncUI('pending', 'تغييرات محلية لم تتم مزامنتها');
                });
            }
        } catch(e) { 
            console.error("saveAll error:", e);
            showToast("حدث خطأ أثناء حفظ البيانات.", "err"); 
        }
    }

    async function saveAttendanceOnly() {
        try {
            hasUnsavedChanges = true;
            updateSyncUI('pending', 'جاري حفظ الحضور...');
            
            await Promise.all([
                secureSave(K_STUDENTS, students),
                secureSave(K_ATT_BY_DATE, attByDate)
            ]);
            updateTopStats();

            if (window.CURRENT_MANAGER_ID) {
                updateSyncUI('syncing', 'جاري المزامنة...');
                
                const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
                update(dbRef, {
                    'students': students,
                    'attendance': attByDate,
                    'finances/revenue': revenueByDate,
                    'packages': groupFees,
                    'finances/expenses': expensesByDate,
                    'deletedStudents': deletedStudents,
                    'syllabus': syllabusData,
                    'evaluations': evalData,
                    'sessionStudents': sessionStudentsByDate,
                    'booklets': bookletsStock,
                    '_lastModified': Date.now()
                }).then(() => {
                    hasUnsavedChanges = false;
                    updateSyncUI('online', 'متصل ومتزامن ✅');
                }).catch(e => {
                    console.error("Firebase update error:", e);
                    updateSyncUI('pending', 'تغييرات محلية لم تتم مزامنتها');
                });
            }
        } catch(e) { 
            console.error("saveAttendanceOnly error:", e);
            showToast("حدث خطأ أثناء حفظ البيانات.", "err"); 
        }
    }

    async function loadAll() {
        try {
            let fromFirebase = false;
            
            // Step 1: Load local data from IndexedDB first (instant, offline-ready)
            students       = await secureLoad(K_STUDENTS, {});
            deletedStudents= await secureLoad(K_DELETED, {});
            attByDate      = await secureLoad(K_ATT_BY_DATE, {});
            revenueByDate  = await secureLoad(K_REVENUE, {});
            expensesByDate = await secureLoad(K_EXPENSES, {});
            groupFees      = await secureLoad(K_GROUP_FEES, {});
            syllabusData   = await secureLoad(K_SYLLABUS, []);
            evalData       = await secureLoad(K_EVAL, {});
            sessionStudentsByDate = await secureLoad(K_SESSION_STUDENTS, {});
            bookletsStock  = await secureLoad(K_BOOKLETS, {});
            console.log("[loadAll] Local data loaded from IndexedDB");

            // Step 2: Try to fetch from Firebase and merge
            try {
                if (window.CURRENT_MANAGER_ID) {
                    updateSyncUI('syncing', 'جاري جلب البيانات من السحابة...');
                    const dbRef = ref(database);
                    
                    // Wrap get in a 10-second timeout to prevent infinite hang on refresh with no internet
                    const fetchWork = get(child(dbRef, `users/${window.CURRENT_MANAGER_ID}`));
                    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 10000));
                    const snapshot = await Promise.race([fetchWork, timeout]);
                    
                    if (snapshot.exists()) {
                        const remote = snapshot.val();
                        const remoteTimestamp = remote._lastModified || 0;
                        const localTimestamp = localTimestamps[K_STUDENTS] || 0;

                        if (remoteTimestamp >= localTimestamp) {
                            // Server is newer or equal — use server data
                            students = remote.students || students;
                            deletedStudents = remote.deletedStudents || deletedStudents;
                            attByDate = remote.attendance || attByDate;
                            revenueByDate = remote.finances?.revenue || revenueByDate;
                            expensesByDate = remote.finances?.expenses || expensesByDate;
                            groupFees = remote.packages || groupFees;
                            syllabusData = remote.syllabus || syllabusData;
                            evalData = remote.evaluations || evalData;
                            sessionStudentsByDate = remote.sessionStudents || sessionStudentsByDate;
                            bookletsStock = remote.booklets || bookletsStock;
                            console.log("[loadAll] Server data is newer — using Firebase data");
                        } else {
                            // Local is newer — merge granularly (field-level)
                            console.log("[loadAll] Local data is newer — performing granular merge");
                            const remoteStudents = remote.students || {};
                            const remoteAtt = remote.attendance || {};
                            
                            // Merge students: keep the record with the newer lastModified
                            for (const id in remoteStudents) {
                                const remoteStudent = remoteStudents[id];
                                const localStudent = students[id];
                                if (!localStudent) {
                                    students[id] = remoteStudent; // New student from server
                                } else {
                                    const rMod = remoteStudent.lastModified || 0;
                                    const lMod = localStudent.lastModified || 0;
                                    if (rMod > lMod) {
                                        students[id] = remoteStudent;
                                    }
                                }
                            }
                            
                            // Merge attendance: keep the record with more entries per date
                            for (const date in remoteAtt) {
                                if (!attByDate[date]) {
                                    attByDate[date] = remoteAtt[date];
                                }
                                // If both exist, keep the one with more data
                                else {
                                    const localCount = Object.keys(attByDate[date]).length;
                                    const remoteCount = Object.keys(remoteAtt[date]).length;
                                    if (remoteCount > localCount) {
                                        attByDate[date] = remoteAtt[date];
                                    }
                                }
                            }
                        }

                        // Cache the merged/fetched data back to IndexedDB
                        await Promise.all([
                            secureSave(K_STUDENTS, students),
                            secureSave(K_ATT_BY_DATE, attByDate),
                            secureSave(K_REVENUE, revenueByDate),
                            secureSave(K_GROUP_FEES, groupFees),
                            secureSave(K_EXPENSES, expensesByDate),
                            secureSave(K_DELETED, deletedStudents),
                            secureSave(K_SYLLABUS, syllabusData),
                            secureSave(K_EVAL, evalData),
                            secureSave(K_SESSION_STUDENTS, sessionStudentsByDate),
                            secureSave(K_BOOKLETS, bookletsStock)
                        ]);

                        fromFirebase = true;
                        hasUnsavedChanges = false;
                        updateSyncUI('online', 'متصل ومتزامن ✅');
                        console.log("[loadAll] Data synced and cached to IndexedDB ✅");
                    }
                }
            } catch(e) {
                console.error("[loadAll] Firebase load failed, using local data:", e);
                updateSyncUI('offline', 'غير متصل - تعمل من البيانات المحلية');
            }

            if (!fromFirebase) {
                if (Object.keys(students).length > 0) {
                    console.log("[loadAll] Working offline with IndexedDB data");
                    updateSyncUI('pending', 'تعمل من البيانات المحلية');
                } else {
                    updateSyncUI('online', 'جاهز للعمل');
                }
            }
            
            // Populate eval form fields
            if($("evalCenterName")) $("evalCenterName").value = evalData.centerName || "";
            if($("evalManager")) $("evalManager").value = evalData.manager || "";
            if($("evalPackages")) $("evalPackages").value = evalData.packages || "";
            if($("evalStudentsCount")) $("evalStudentsCount").value = evalData.studentsCount || "";
            if($("evalCurrentCourses")) $("evalCurrentCourses").value = evalData.currentCourses || "";
            if($("evalCollabOpps")) $("evalCollabOpps").value = evalData.collabOpps || "";
            if($("evalNotes")) $("evalNotes").value = evalData.notes || "";
            if($("evalFollowupPlan")) $("evalFollowupPlan").value = evalData.followupPlan || "";
            if($("evalNeeds")) $("evalNeeds").value = evalData.needs || "";
            if($("evalFinalRate")) $("evalFinalRate").value = evalData.finalRate || "⭐⭐⭐⭐⭐ ممتاز";

            applyTheme(localStorage.getItem(K_THEME) || "dark");
            
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
        let added = false;
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) { 
            if(!students[String(i)]) {
                students[String(i)] = makeEmptyStudent(i); 
                added = true;
            }
        }
        if (added) saveAll();
    }

    // ==========================================
    // 7. AUTHENTICATION & SECURITY
    // ==========================================
    function checkAuth() {
        const sidebar = document.querySelector('.sidebar');
        if(localStorage.getItem(K_AUTH) === "1") {
            currentUserRole = localStorage.getItem(K_ROLE) || "admin";
            
            // Sync Global Variables
            window.CURRENT_ROLE = currentUserRole;
            $("loginBox").classList.add("hidden");
            
            if(currentUserRole === 'admin') {
                migrateLocalDataToManager();
                if ($("manager-dashboard")) $("manager-dashboard").classList.remove("hidden");
                $("appBox").classList.add("hidden");
                if(sidebar) sidebar.style.display = "none";
                
                if (typeof window.switchManagerTab === 'function') {
                    window.switchManagerTab('dailyReport');
                }
                
                if ($("managerTopName")) $("managerTopName").innerText = localStorage.getItem("ca_manager_id") || "المدير العام";
                
            } else {
                $("appBox").classList.remove("hidden");
                if ($("manager-dashboard")) $("manager-dashboard").classList.add("hidden");
                if(sidebar) sidebar.style.display = "flex";
                showApp();
            }
        } else {
            $("loginBox").classList.remove("hidden"); 
            $("appBox").classList.add("hidden");
            if ($("manager-dashboard")) $("manager-dashboard").classList.add("hidden");
            if(sidebar) sidebar.style.display = "none";
        }
    }

    window.switchManagerTab = function(tabId) {
        document.querySelectorAll(".manager-view").forEach(v => v.classList.add("hidden"));
        document.querySelectorAll(".manager-nav-item").forEach(btn => btn.classList.remove("active"));

        const tabMap = {
            dailyReport:  { view: "managerDailyReportView",  btn: "btnManagerDailyReport",  title: "التقرير اليومي" },
            termReport:   { view: "managerTermReportView",   btn: "btnManagerTermReport",   title: "تقرير الترم" },
            assistants:   { view: "managerAssistantsView",   btn: "btnManagerAssistants",   title: "إدارة المساعدين" },
            permissions:  { view: "managerPermissionsView",  btn: "btnManagerPermissions",  title: "صلاحيات المساعد" },
            decisions:    { view: "managerDecisionsView",    btn: "btnManagerDecisions",    title: "طلبات القرارات" },
            cloudMonitor: { view: "managerCloudMonitorView", btn: "btnManagerCloudMonitor", title: "فحص السحابة" },
            settings:     { view: "managerSettingsView",     btn: "btnManagerSettings",     title: "الإعدادات المتقدمة" },
        };

        const tab = tabMap[tabId] || tabMap["dailyReport"];
        if ($(tab.view)) $(tab.view).classList.remove("hidden");
        if ($(tab.btn)) $(tab.btn).classList.add("active");
        if ($("managerPageTitle")) $("managerPageTitle").textContent = tab.title;

        if (tabId === "assistants") fetchManagerAssistants();
        if (tabId === "permissions") renderPermissionsPanel();
        if (tabId === "decisions") fetchManagerRequests();
        if (tabId === "dailyReport") renderManagerDailyReport(nowDateStr());
        if (tabId === "termReport") renderManagerTermReport();
        if (tabId === "cloudMonitor") runCloudDataCheck();
        if (tabId === "settings") {
            const mid = localStorage.getItem("ca_manager_id") || "—";
            if ($("mgrSettingsManagerId")) $("mgrSettingsManagerId").textContent = mid;
        }
    };

    function showApp() {
        applyPermissions();
        if($("reportDate")) $("reportDate").value = nowDateStr();
        
        // Fix for Shift Manager Display Name
        if ($("currentShiftManagerName")) {
            $("currentShiftManagerName").innerText = localStorage.getItem("ca_current_username") || (currentUserRole === "admin" ? "المدير" : "مساعد");
        }
        
        renderReport(nowDateStr());
        updateTopStats();
        populatePackages();
        if (typeof window.fetchActivityLog === 'function') window.fetchActivityLog();
        window.switchTab('Home');
    }

    function applyPermissions() {
        const isAdmin = (currentUserRole === "admin");
        if ($("currentUserBadgeText")) {
            $("currentUserBadgeText").innerText = isAdmin ? (currentLang === "ar" ? "👑 مسؤول عام" : "👑 Admin") : (currentLang === "ar" ? "👥 مساعد" : "👥 Assistant");
        }
        
        // Show base UI elements for all roles first
        document.querySelectorAll(".adminOnly").forEach(el => {
            if (!el.classList.contains("tab-section")) {
                el.classList.remove("hidden"); 
            }
        });
        if($("deleteStudentBtn")) $("deleteStudentBtn").classList.remove("hidden");
        if($("correctPayBtn")) $("correctPayBtn").classList.remove("hidden");
        
        // For assistants: apply granular Firebase-based permissions
        if (!isAdmin) {
            applyPermissionsToAssistantUI();
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
        let sHtml = `<option value="حصة فردية">حصة فردية (عام)</option>`;
        
        let hasGroups = false;
        for (let g in groupFees) {
            html += `<option value="${g}">${g}</option>`;
            sHtml += `<option value="${g}">${g}</option>`;
            hasGroups = true;
        }
        if(!hasGroups) html += `<option value="عام">عام</option>`;
        select.innerHTML = html;
        
        if(currentVal && groupFees[currentVal] !== undefined) {
            select.value = currentVal;
        }

        const sessSelect = $("sessStClass");
        if (sessSelect) {
            let sVal = sessSelect.value;
            sessSelect.innerHTML = sHtml;
            if (sVal) sessSelect.value = sVal;
        }
    }

    function updateStudentUI(id) {
        currentId = id; const st = students[id]; 
        if (!st) {
            if ($("notesLockOverlay")) $("notesLockOverlay").style.display = "flex";
            if ($("stNotesListContainer")) $("stNotesListContainer").innerHTML = '<div class="mutedCenter" style="font-size:0.85em;">لا توجد ملاحظات مسجلة لهذا الطالب</div>';
            return; 
        }
        
        if ($("notesLockOverlay")) $("notesLockOverlay").style.display = "none";
        if (typeof renderStudentNotes === "function") renderStudentNotes(id);
        
        if($("studentIdPill")) $("studentIdPill").textContent = `ID: ${id}`;
        if($("stName")) $("stName").value = st.name || ""; 
        if($("stClass")) $("stClass").value = st.className || ""; 
        if($("stPhone")) $("stPhone").value = st.phone || ""; 
        
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

        st.debt = remain > 0 ? remain : 0;
        
        const debtWarning = $("debtWarningContainer");
        if (debtWarning) {
            if (st.debt > 0) {
                $("debtAmountDisplay").innerText = st.debt;
                debtWarning.classList.remove("hidden");
            } else {
                debtWarning.classList.add("hidden");
            }
        }

        const rBtn = $("showReceiptBtn");
        if (rBtn) {
            if (req > 0 && remain <= 0) {
                rBtn.disabled = false;
                rBtn.style.cursor = "pointer";
                rBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
                rBtn.style.color = "#ffffff";
                rBtn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
                if ($("receiptBtnIcon")) $("receiptBtnIcon").textContent = "🖨️";
                if ($("receiptBtnText")) $("receiptBtnText").textContent = t("print_receipt_unlock");
            } else {
                rBtn.disabled = true;
                rBtn.style.cursor = "not-allowed";
                rBtn.style.background = "#334155";
                rBtn.style.color = "#94a3b8";
                rBtn.style.boxShadow = "none";
                if ($("receiptBtnIcon")) $("receiptBtnIcon").textContent = "🔒";
                if ($("receiptBtnText")) $("receiptBtnText").textContent = t("print_receipt_lock");
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

        if($("stPaymentsList")) {
            let payHtml = "";
            const isAdmin = (currentUserRole === "admin");
            if (st.payments && st.payments.length > 0) {
                for (let i = st.payments.length - 1; i >= 0; i--) {
                    let p = st.payments[i];
                    let m = p.method || "cash";
                    let mBadge = t("badge_cash");
                    let badgeBg = "#e8f5e9";
                    let badgeColor = "#1b5e20";
                    if (m === "instapay") { mBadge = t("badge_instapay"); badgeBg = "#f3e8ff"; badgeColor = "#6b21a8"; }
                    if (m === "wallet") { mBadge = t("badge_wallet"); badgeBg = "#fee2e2"; badgeColor = "#991b1b"; }
                    
                    let delBtn = isAdmin ? `<button class="btn danger smallBtn iconOnly" style="padding:2px 6px; font-size:11px;" onclick="window.deleteStudentPayment(${i})" title="${t('btn_del_payment')}">🗑️</button>` : "";
                    
                    payHtml += `
                    <div class="item flexBetween" style="margin-bottom:8px; font-size:0.9em; padding:8px 10px; background:var(--bg-surface); border-radius:6px; border:1px solid var(--border);">
                        <div>
                            <span style="font-weight:bold; color:var(--success);">+ ${p.amount} ج</span>
                            <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-size:0.8em; margin-inline-start:8px;">${mBadge}</span>
                        </div>
                        <div class="row" style="width:auto; gap:10px;">
                            <span style="font-size:0.85em; color:var(--text-secondary);">${prettyDate(p.date)}</span>
                            ${delBtn}
                        </div>
                    </div>`;
                }
            } else if (st.paid > 0) {
                payHtml = `
                <div class="item flexBetween" style="margin-bottom:8px; font-size:0.9em; padding:8px 10px; background:var(--bg-surface); border-radius:6px; border:1px solid var(--border);">
                    <div>
                        <span style="font-weight:bold; color:var(--success);">+ ${st.paid} ج</span>
                        <span class="badge" style="background:#eef2f5; color:#333; font-size:0.8em; margin-inline-start:8px;">${t("txt_cash_old")}</span>
                    </div>
                    <span style="font-size:0.85em; color:var(--text-secondary);">—</span>
                </div>`;
            } else {
                payHtml = `<div class="mutedCenter" style="font-size:0.85em;">${t("txt_no_payments")}</div>`;
            }
            $("stPaymentsList").innerHTML = payHtml;
        }
        
        if($("newBadge")) {
            if(dates.length === 0 && st.name) $("newBadge").classList.remove("hidden"); 
            else $("newBadge").classList.add("hidden");
        }
    }

    function addAttendance(id, d) {
        const s = students[String(id)];
        if(!s) {
            showFullscreenFeedback(false, false);
            return { ok: false, msg: "Student not found" };
        }
        
        if(!s.attendanceDates.includes(d)) {
            s.attendanceDates.push(d); 
            if(!attByDate[d]) attByDate[d] = []; 
            attByDate[d].push(String(id)); 
            
            if (typeof logAction === "function") logAction("تسجيل حضور", `تسجيل حضور الطالب ${s.name || id}`);
            saveAttendanceOnly(); 
            updateLiveFeed(s);
            playSound("success");
            triggerEdgeFlash(); // تشغيل الفلاش الأخضر للنجاح
            showFullscreenFeedback(true, false);
            return { ok: true, msg: t("msg_att_ok") };
        }
        playSound("error");
        showFullscreenFeedback(false, true);
        return { ok: false, msg: t("msg_att_warn") };
    }

    function removeAttendance(id, d) {
        const s = students[String(id)]; if(!s) return;
        s.attendanceDates = s.attendanceDates.filter(date => date !== d);
        if(attByDate[d]) attByDate[d] = attByDate[d].filter(x => x !== String(id));
        if (typeof logAction === "function") logAction("إلغاء حضور", `إلغاء حضور الطالب ${s.name || id} ليوم ${d}`);
        saveAttendanceOnly();
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

        let cashToday = 0, instapayToday = 0, walletToday = 0;
        let cashTotal = 0, instapayTotal = 0, walletTotal = 0;
        
        const allStuds = Object.values(students);
        for(let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.payments && s.payments.length > 0) {
                for(let j = 0; j < s.payments.length; j++) {
                    let p = s.payments[j];
                    let amt = toInt(p.amount);
                    let m = p.method || "cash";
                    
                    if (m === "cash") {
                        cashTotal += amt;
                        if (p.date === today) cashToday += amt;
                    } else if (m === "instapay") {
                        instapayTotal += amt;
                        if (p.date === today) instapayToday += amt;
                    } else if (m === "wallet") {
                        walletTotal += amt;
                        if (p.date === today) walletToday += amt;
                    }
                }
            } else if (s.paid > 0) {
                cashTotal += toInt(s.paid);
            }
        }

        // ✨ إدراج أموال طلاب الحصة الفورية في الخزائن الحقيقية
        for (let d in sessionStudentsByDate) {
            let sList = sessionStudentsByDate[d] || [];
            for (let k = 0; k < sList.length; k++) {
                let item = sList[k];
                let amt = toInt(item.amount);
                let m = item.method || "cash";
                if (m === "cash") {
                    cashTotal += amt;
                    if (d === today) cashToday += amt;
                } else if (m === "instapay") {
                    instapayTotal += amt;
                    if (d === today) instapayToday += amt;
                } else if (m === "wallet") {
                    walletTotal += amt;
                    if (d === today) walletToday += amt;
                }
            }
        }

        let expTotal = 0;
        for(let d in expensesByDate) {
            for(let k = 0; k < expensesByDate[d].length; k++) {
                expTotal += expensesByDate[d][k].amount;
            }
        }

        if($("vaultCashToday")) $("vaultCashToday").textContent = cashToday;
        if($("vaultInstapayToday")) $("vaultInstapayToday").textContent = instapayToday;
        if($("vaultWalletToday")) $("vaultWalletToday").textContent = walletToday;

        if($("vaultCashTotal")) $("vaultCashTotal").textContent = cashTotal;
        if($("vaultCashExp")) $("vaultCashExp").textContent = expTotal;
        if($("vaultCashNet")) $("vaultCashNet").textContent = (cashTotal - expTotal);

        if($("vaultInstapayTotal")) $("vaultInstapayTotal").textContent = instapayTotal;
        if($("vaultWalletTotal")) $("vaultWalletTotal").textContent = walletTotal;
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
    function renderList(keepPage) {
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
        
        if (keepPage !== true) {
            currentPage = 1; 
        } else {
            let totalPages = Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE) || 1;
            if (currentPage > totalPages) currentPage = totalPages;
        }
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

    let simpleCurrentPage = 1;
    const SIMPLE_ITEMS_PER_PAGE = 20;
    let simpleFilteredStuds = [];

    function renderSimpleTable() {
        const tb = $("simpleStudentsTable"); if (!tb) return;
        const tbody = tb.querySelector("tbody"); if(!tbody) return; 
        
        tbody.innerHTML = "";
        
        simpleFilteredStuds = [];
        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.name || s.paid > 0) simpleFilteredStuds.push(s);
        }

        let totalPages = Math.ceil(simpleFilteredStuds.length / SIMPLE_ITEMS_PER_PAGE) || 1;
        if (simpleCurrentPage > totalPages) simpleCurrentPage = totalPages;

        const start = (simpleCurrentPage - 1) * SIMPLE_ITEMS_PER_PAGE;
        const end = start + SIMPLE_ITEMS_PER_PAGE;

        for (let i = start; i < end && i < simpleFilteredStuds.length; i++) {
            let s = simpleFilteredStuds[i];
            const tr = document.createElement("tr");
            let rankIcon = s.rank === 'vip' ? ' ⭐' : (s.rank === 'warn' ? ' ⚠️' : '');
            
            tr.innerHTML = `<td>${s.id}</td><td><b>${s.name}</b>${rankIcon}</td><td><span class="badge" style="background:#eef2f5; color:#333; font-weight:bold;">${s.className || 'عام'}</span></td>`;
            tr.style.cursor = "pointer";
            
            tr.onclick = function() { 
                if($("allStudentsModal")) $("allStudentsModal").classList.add("hidden"); 
                window.extOpen(s.id); 
            };
            tbody.appendChild(tr);
        }

        if ($("simplePageIndicator")) {
            $("simplePageIndicator").textContent = `${simpleCurrentPage} / ${totalPages}`;
        }
        if ($("simplePrevPageBtn")) $("simplePrevPageBtn").disabled = (simpleCurrentPage === 1);
        if ($("simpleNextPageBtn")) $("simpleNextPageBtn").disabled = (end >= simpleFilteredStuds.length);
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
        
        let sessArr = sessionStudentsByDate[d] || [];
        if(sessArr.length > 0) {
            html += `
            <h4 style="color:var(--primary); margin-top:15px; display:flex; align-items:center; gap:5px;"><span>🎟️</span> طلاب الحصة الفورية (${sessArr.length})</h4>
            <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:8px; padding:10px; margin-top:5px;">`;
            for (let i = 0; i < sessArr.length; i++) {
                let item = sessArr[i];
                let mBadge = item.method === "instapay" ? "📱 إنستاباي" : (item.method === "wallet" ? "🟢 فودافون كاش" : "💵 كاش");
                html += `
                <div class="item flexBetween" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border);">
                    <div><b>${item.name}</b> <span class="badge" style="background:#eee; color:#333;">${item.className || "عام"}</span> <span class="badge" style="background:#e3f2fd; color:#0288d1;">${mBadge}</span></div>
                    <div style="color:var(--success); font-weight:bold;">+ ${item.amount} ج</div>
                </div>`;
            }
            html += `</div>`;
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
        if (theme !== "dark") theme = "light";
        document.body.className = ""; 
        document.documentElement.setAttribute("data-theme", theme);
        if(theme === "dark") document.body.classList.add("theme-dark");
        localStorage.setItem(K_THEME, theme); 
        if($("themeSelector")) $("themeSelector").value = theme;
        // Update topbar theme toggle icon with stunning SVG icons
        var themeBtn = $("topbarThemeToggle");
        if(themeBtn) {
            themeBtn.innerHTML = theme === "dark" 
                ? `<svg class="theme-svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
                : `<svg class="theme-svg-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        }
        // Update PWA theme-color meta
        var metaTheme = document.querySelector('meta[name="theme-color"]');
        if(metaTheme) metaTheme.content = theme === "dark" ? "#0B1120" : "#F1F5F9";
    }

    function switchThemeWithAnimation(targetTheme) {
        const overlay = $("themeSwitchOverlay");
        const iconBox = $("themeSwitchIconBox");
        const textEl = $("themeSwitchText");
        if(overlay && iconBox && textEl) {
            textEl.innerText = currentLang === "ar" ? "جاري تبديل المظهر... ⏳" : "Switching Theme... ⏳";
            iconBox.innerHTML = targetTheme === "dark" 
                ? `<svg class="theme-svg-icon" style="width:50px;height:50px;color:#f59e0b;" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>` 
                : `<svg class="theme-svg-icon" style="width:50px;height:50px;color:#f59e0b;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            overlay.classList.add("active");
            setTimeout(() => {
                applyTheme(targetTheme);
                setTimeout(() => {
                    overlay.classList.remove("active");
                }, 400);
            }, 600);
        } else {
            applyTheme(targetTheme);
        }
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
        
        if($("sidebarCollapseBtn")) {
            $("sidebarCollapseBtn").title = currentLang === "ar" ? "طي القائمة" : "Collapse Sidebar";
        }
        
        applyPermissions();
        
        // Sidebar doesn't need flex-direction change for RTL (handled by CSS logical properties)
        
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
        Swal.fire({
            title: 'تأكيد الحذف',
            text: confirmMsg,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: currentLang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
            cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
        }).then((result) => {
            if(result.isConfirmed) {
                syllabusData.splice(index, 1);
                saveAll();
                renderSyllabus();
            }
        });
    };

    on("saveSyllabusBtn", "click", function() {
        let name = $("syllName").value.trim();
        let status = $("syllStatus").value;
        let notes = $("syllNotes").value.trim();
        
        if(!name) {
            let errMsg = currentLang === 'ar' ? "يرجى كتابة اسم الشابتر / الدرس أولاً" : "Please enter the chapter/lesson name first";
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
    // Global functions for the HTML onclick handlers
    window.switchLoginTab = function(tab) {
        if(tab === 'manager') {
            $("tabManagerLogin").classList.add("active");
            $("tabAssistantLogin").classList.remove("active");
            $("managerLoginForm").classList.remove("hidden");
            $("managerLoginForm").classList.add("active");
            $("assistantLoginForm").classList.add("hidden");
            $("assistantLoginForm").classList.remove("active");
        } else {
            $("tabAssistantLogin").classList.add("active");
            $("tabManagerLogin").classList.remove("active");
            $("assistantLoginForm").classList.remove("hidden");
            $("assistantLoginForm").classList.add("active");
            $("managerLoginForm").classList.add("hidden");
            $("managerLoginForm").classList.remove("active");
        }
    };

    window.togglePassword = function(inputId) {
        const p = $(inputId);
        if (p) p.type = p.type === "password" ? "text" : "password";
    };

    function sanitizeKey(str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    if($("managerLoginBtn")) {
        on("managerLoginBtn", "click", async function() {
            if ($("loginBox") && $("loginBox").classList.contains("hidden")) return;
            
            const rawU = $("managerUser") ? $("managerUser").value.trim() : "";
            const p = $("managerPass") ? $("managerPass").value.trim() : "";
            if (!rawU || !p) return showToast("أدخل البريد الإلكتروني وكلمة المرور", "err");
            
            const u = sanitizeKey(rawU);

            try {
                // Critical Safety: Auto-seed master admin if provided explicitly
                if (rawU === "ahmedqutb11232@gmail.com" && p === "####1111") {
                    await set(ref(database, `users/${u}/settings/info`), { password: "####1111", email: rawU, role: "admin" });
                }

                const snapshot = await get(child(ref(database), `users/${u}/settings/info`));
                if (snapshot.exists()) {
                    const info = snapshot.val();
                    if (info.password === p) {
                        localStorage.setItem(K_AUTH, "1"); 
                        localStorage.setItem(K_ROLE, "admin"); 
                        localStorage.setItem("ca_manager_id", u);
                        localStorage.setItem("ca_current_username", "المدير");
                        window.CURRENT_MANAGER_ID = u;
                        window.CURRENT_ROLE = "admin";
                        checkAuth(); 
                        return;
                    }
                }
                showToast(t("msg_err_pass") || "خطأ في بيانات الدخول", "err"); 
                triggerShake("managerLoginBtn");
            } catch (err) {
                console.error(err);
                showToast("فشل الاتصال بقاعدة البيانات. تأكد من الإنترنت.", "err");
            }
        });
    }

    if($("assistantLoginBtn")) {
        on("assistantLoginBtn", "click", async function() {
            if ($("loginBox") && $("loginBox").classList.contains("hidden")) return;
            
            const rawU = $("assistantUser") ? $("assistantUser").value.trim() : "";
            const p = $("assistantPass") ? $("assistantPass").value.trim() : "";
            if (!rawU || !p) return showToast("أدخل اسم المستخدم وكلمة المرور", "err");
            
            const u = sanitizeKey(rawU);
            
            try {
                // Query global_assistants mapping
                const globalSnap = await get(child(ref(database), `global_assistants/${u}`));
                if (!globalSnap.exists()) {
                    showToast("حساب المساعد غير موجود أو غير مربوط بمدير.", "err");
                    return triggerShake("assistantLoginBtn");
                }
                
                const center = globalSnap.val(); // This is the MANAGER_ID
                
                const snapshot = await get(child(ref(database), `users/${center}/settings/assistants`));
                if (snapshot.exists()) {
                    const assistants = snapshot.val();
                    let foundUsername = "";
                    for (let key in assistants) {
                        let uName = key;
                        let pass = assistants[key];
                        if (typeof assistants[key] === "object") {
                            uName = assistants[key].username || key;
                            pass = assistants[key].password;
                        }
                        if (sanitizeKey(uName) === u && pass === p) {
                            foundUsername = uName;
                            break;
                        }
                    }
                    if (foundUsername) {
                        localStorage.setItem(K_AUTH, "1"); 
                        localStorage.setItem(K_ROLE, "assistant"); 
                        localStorage.setItem("ca_manager_id", center);
                        localStorage.setItem("ca_current_username", foundUsername);
                        window.CURRENT_MANAGER_ID = center;
                        window.CURRENT_ROLE = "assistant";
                        checkAuth(); 
                        return;
                    }
                }
                showToast(t("msg_err_pass") || "كلمة المرور غير صحيحة", "err"); 
                triggerShake("assistantLoginBtn");
            } catch (err) {
                console.error(err);
                showToast("فشل الاتصال بقاعدة البيانات. تأكد من الإنترنت.", "err");
            }
        });
    }

    window.logout = async function() {
        // Clear IndexedDB (localForage)
        try { await localforage.clear(); } catch(e) { console.error("localForage clear error:", e); }
        
        // Clear auth keys from localStorage
        localStorage.removeItem(K_AUTH);
        localStorage.removeItem(K_ROLE);
        localStorage.removeItem("ca_manager_id");
        localStorage.removeItem("ca_current_username");
        location.reload();
    };

    if($("logoutBtn")) on("logoutBtn", "click", window.logout);
    if($("managerLogoutBtn")) on("managerLogoutBtn", "click", window.logout);

    // User Profile Widget Listeners
    on("userProfileToggleBtn", "click", function(e) {
        if(e) e.stopPropagation();
        if($("userProfileDropdown")) $("userProfileDropdown").classList.toggle("hidden");
    });
    document.addEventListener("click", function(e) {
        if($("userProfileDropdown") && !$("userProfileDropdown").classList.contains("hidden")) {
            if(!$("userProfileDropdown").contains(e.target) && e.target.id !== "userProfileToggleBtn" && !e.target.closest("#userProfileToggleBtn")) {
                $("userProfileDropdown").classList.add("hidden");
            }
        }
        if($("notificationsDropdown") && !$("notificationsDropdown").classList.contains("hidden")) {
            if(!$("notificationsDropdown").contains(e.target) && e.target.id !== "notificationsToggleBtn" && !e.target.closest("#notificationsToggleBtn")) {
                $("notificationsDropdown").classList.add("hidden");
            }
        }
    });

    on("notificationsToggleBtn", "click", function(e) {
        if(e) e.stopPropagation();
        if($("notificationsDropdown")) {
            $("notificationsDropdown").classList.toggle("hidden");
            if (!$("notificationsDropdown").classList.contains("hidden") && $("userProfileDropdown")) {
                $("userProfileDropdown").classList.add("hidden");
            }
        }
    });

    on("markAllReadBtn", "click", function(e) {
        if(e) e.stopPropagation();
        lastReadActivityTime = Date.now();
        localStorage.setItem("ca_last_read_activity", lastReadActivityTime.toString());
        const badge = $("notificationsBadge");
        if (badge) badge.classList.add("hidden");
        fetchActivityLog();
    });

    on("quickActivityLogBtn", "click", function() {
        if($("userProfileDropdown")) $("userProfileDropdown").classList.add("hidden");
        if($("activityLogModal")) $("activityLogModal").classList.remove("hidden");
    });
    on("quickSwitchRoleBtn", "click", function() {
        if($("userProfileDropdown")) $("userProfileDropdown").classList.add("hidden");
        if(currentUserRole === "admin") {
            showToast(currentLang === 'ar' ? "أنت مسجل كمسؤول عام بالفعل 👑" : "Already logged in as Admin 👑", "success");
        } else {
            askAdminPass(function() {
                currentUserRole = "admin"; localStorage.setItem(K_ROLE, "admin"); applyPermissions();
                showToast(currentLang === 'ar' ? "تم التبديل لصلاحيات المسؤول 👑" : "Switched to Admin privileges 👑", "success");
            });
        }
    });
    on("quickGroupFeesBtn", "click", function() {
        if($("userProfileDropdown")) $("userProfileDropdown").classList.add("hidden");
        if($("groupFeesModal")) $("groupFeesModal").classList.remove("hidden");
    });
    on("quickExportBtn", "click", function() {
        if($("userProfileDropdown")) $("userProfileDropdown").classList.add("hidden");
        if(typeof exportColoredReport === "function") exportColoredReport();
    });
    on("quickBinBtn", "click", function() {
        if($("userProfileDropdown")) $("userProfileDropdown").classList.add("hidden");
        renderBinList(); if($("recycleBinModal")) $("recycleBinModal").classList.remove("hidden");
    });


    on("customPassConfirm", "click", async function() {
        const p = $("customPassInput") ? $("customPassInput").value.trim() : "";
        if (!p) return showToast("أدخل كلمة المرور", "err");
        try {
            const snapshot = await get(child(ref(database), `users/${window.CURRENT_MANAGER_ID}/settings/info`));
            if (snapshot.exists() && snapshot.val().password === p) {
                if($("customPassModal")) $("customPassModal").classList.add("hidden"); 
                if(passSuccessCallback) passSuccessCallback(); 
            } else {
                showToast(t("msg_err_pass") || "كلمة المرور غير صحيحة", "err"); triggerShake("customPassInput");
            }
        } catch (err) { showToast("فشل الاتصال", "err"); }
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
            showFullscreenFeedback(false, false);
            return; 
        }
        
        const res = addAttendance(id, nowDateStr());
        if (res.ok) playSound("pop"); else playSound("error");
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
        
        let existing = students[String(id)];
        if (existing) {
            let hasName = existing.name && existing.name.trim() !== "";
            let hasPaid = existing.paid > 0;
            let hasPayments = existing.payments && existing.payments.length > 0;
            let hasAttendance = existing.attendanceDates && existing.attendanceDates.length > 0;
            let hasNotes = existing.notes && existing.notes.trim() !== "";
            let hasClassName = existing.className && existing.className.trim() !== "";
            
            if (hasName || hasPaid || hasPayments || hasAttendance || hasNotes || hasClassName) {
                triggerShake("newId");
                showToast("⚠️ هذا الكود محجوز ومسجل به بيانات بالفعل", "err");
                playSound("error");
                window.extOpen(id);
                if ($("newId")) $("newId").value = "";
                return;
            }
        }
        
        students[String(id)] = makeEmptyStudent(id); 
        if(id > BASE_MAX_ID) extraIds.push(id);
        saveAll(); window.extOpen(id); showToast(t("msg_added"));
        if ($("newId")) $("newId").value = "";
    });

    on("saveStudentBtn", "click", function() {
        if(!currentId) return;
        const s = students[currentId]; if (!s) return;
        if ($("stName")) s.name = $("stName").value; 
        if ($("stClass")) s.className = $("stClass").value; 
        if ($("stPhone")) s.phone = $("stPhone").value;
        if (typeof logAction === "function") logAction("تعديل بيانات الطالب", `تم تعديل بيانات الطالب ${s.name || currentId}`);
        playSound("click");
        saveAll(); showToast(t("msg_saved")); updateStudentUI(currentId);
        
        let sClass = s.className ? s.className.trim() : "";
        let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
        if (req > 0 && s.paid >= req) {
            fireConfetti();
        }
    });

    on("showReceiptBtn", "click", function() {
        if(!currentId) return;
        const st = students[currentId]; if (!st) return;

        if ($("receiptCenterName")) $("receiptCenterName").textContent = evalData.centerName || "إدارة السنتر";
        if ($("receiptManagerName")) $("receiptManagerName").textContent = evalData.manager ? `إشراف أ/ ${evalData.manager}` : "المدير المسئول";
        if ($("receiptDate")) $("receiptDate").textContent = `التاريخ: ${nowDateStr()}`;
        
        if ($("receiptStudentName")) $("receiptStudentName").textContent = st.name || "طالب بدون اسم";
        if ($("receiptStudentID")) $("receiptStudentID").textContent = `#${st.id}`;
        if ($("receiptStudentClass")) $("receiptStudentClass").textContent = st.className || "عام";
        if ($("receiptStudentPhone")) $("receiptStudentPhone").textContent = st.phone ? `0${st.phone}` : "غير مسجل";
        
        if ($("receiptTotalPaid")) $("receiptTotalPaid").textContent = `${st.paid || 0} ج`;
        
        let methodsStr = "طرق الدفع: ";
        let mMap = {};
        if (st.payments && st.payments.length > 0) {
            for(let i=0; i<st.payments.length; i++) {
                let m = st.payments[i].method || "cash";
                mMap[m] = (mMap[m] || 0) + toInt(st.payments[i].amount);
            }
            let arr = [];
            if(mMap["cash"]) arr.push(`كاش (${mMap["cash"]} ج)`);
            if(mMap["instapay"]) arr.push(`إنستاباي (${mMap["instapay"]} ج)`);
            if(mMap["wallet"]) arr.push(`محافظ/فودافون كاش (${mMap["wallet"]} ج)`);
            methodsStr += arr.join(" + ");
        } else {
            methodsStr += "كاش";
        }
        if ($("receiptPaymentMethods")) $("receiptPaymentMethods").textContent = methodsStr;
        
        togglePhotoView(false);
        if ($("receiptModal")) $("receiptModal").classList.remove("hidden");
    });

    window.togglePhotoView = function(isPhoto) {
        if (isPhoto) {
            if ($("receiptModalActions")) $("receiptModalActions").style.display = "none";
            if ($("photoViewTip")) $("photoViewTip").style.display = "block";
        } else {
            if ($("receiptModalActions")) $("receiptModalActions").style.display = "flex";
            if ($("photoViewTip")) $("photoViewTip").style.display = "none";
        }
    };

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

    on("payDebtBtn", "click", function() {
        if(!currentId) return;
        const st = students[currentId];
        if(!st || !st.debt) return;
        
        let v = st.debt;
        st.paid = (st.paid || 0) + v;
        if (!st.payments) st.payments = [];
        st.payments.push({ date: nowDateStr(), amount: v, method: "cash" });
        
        const today = nowDateStr();
        if (!revenueByDate[today]) revenueByDate[today] = 0;
        revenueByDate[today] += v;
        
        st.debt = 0;
        if (typeof logAction === "function") logAction("تسديد مديونية", `تم تسديد كامل مديونية الطالب ${st.name || currentId} بقيمة ${v} ج كاش`);
        
        saveAll(); updateStudentUI(currentId);
        fireConfetti(); playSound("money"); showToast("تم سداد المديونية بالكامل ✅");
    });

    on("addPaymentBtn", "click", function() {
        if(!currentId) return;
        const payInp = $("newPaymentInput"); if (!payInp) return;
        const v = toInt(payInp.value); if(!v) return;
        
        const methodInp = $("newPaymentMethod");
        const method = methodInp ? methodInp.value : "cash";
        let methodName = "كاش 💵";
        if (method === "instapay") methodName = "إنستاباي 🟣";
        if (method === "wallet") methodName = "فودافون كاش 🔴";
        
        const st = students[currentId];
        if ($("stName")) st.name = $("stName").value; 
        if ($("stClass")) st.className = $("stClass").value; 
        if ($("stPhone")) st.phone = $("stPhone").value;
        
        st.paid = (st.paid || 0) + v;
        if (!st.payments) st.payments = [];
        st.payments.push({ date: nowDateStr(), amount: v, method: method });
        const today = nowDateStr();
        if (!revenueByDate[today]) revenueByDate[today] = 0;
        revenueByDate[today] += v;
        
        if (typeof logAction === "function") logAction("تسجيل دفعة", `تم دفع مبلغ ${v} ج للطالب ${st.name || currentId} عن طريق ${methodName}`);
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
            let msg = `مرحباً ${st.name}،\nتم إيداع مبلغ ${v} ج (${methodName}) ✅\nإجمالي المدفوع: ${st.paid} ج.\n\nمع تحيات: أ/ ${currentManager}`;
            setTimeout(function() { 
                window.open(`https://wa.me/20${st.phone}?text=${encodeURIComponent(msg)}`, '_blank'); 
            }, 1000);
        }
        payInp.value = "";
    });

    window.deleteStudentPayment = function(index) {
        if(!currentId) return;
        let st = students[currentId];
        if(!st || !st.payments || !st.payments[index]) return;
        
        let msg = currentLang === 'ar' ? "⚠️ متأكد من حذف هذه الدفعة نهائياً؟" : "⚠️ Are you sure you want to delete this payment?";
        Swal.fire({
            title: 'تأكيد الحذف',
            text: msg,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: currentLang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
            cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                let p = st.payments[index];
                st.paid = Math.max(0, st.paid - p.amount);
                
                if (revenueByDate[p.date]) {
                    revenueByDate[p.date] = Math.max(0, revenueByDate[p.date] - p.amount);
                }
                
                st.payments.splice(index, 1);
                
                saveAll(); 
                updateStudentUI(currentId); 
                renderReport(nowDateStr()); 
                renderCharts();
                if (typeof showToast === "function") showToast(currentLang === 'ar' ? "تم حذف الدفعة وتعديل الحساب ✅" : "Payment deleted ✅", "warning");
            }
        });
    };

    on("correctPayBtn", "click", function() {
        if(!currentId) return; 
        Swal.fire({
            title: currentLang === 'ar' ? 'قيمة الخصم' : 'Deduct amount',
            input: 'number',
            inputAttributes: { min: 1 },
            showCancelButton: true,
            confirmButtonText: currentLang === 'ar' ? 'خصم' : 'Deduct',
            cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const v = toInt(result.value);
                if(!v) return;
                let st = students[currentId];
                st.paid = Math.max(0, st.paid - v);
                const today = nowDateStr();
                revenueByDate[today] = Math.max(0, (revenueByDate[today] || 0) - v);
                
                if(st.payments && st.payments.length > 0) {
                    let remToDeduct = v;
                    for(let j = st.payments.length - 1; j >= 0; j--) {
                        if(st.payments[j].date === today) {
                            if(st.payments[j].amount <= remToDeduct) {
                                remToDeduct -= st.payments[j].amount;
                                st.payments.splice(j, 1);
                            } else {
                                st.payments[j].amount -= remToDeduct;
                                remToDeduct = 0;
                                break;
                            }
                        }
                    }
                }
                
                saveAll(); showToast(t("msg_discount"), "warning"); updateStudentUI(currentId); renderReport(nowDateStr()); renderCharts();
            }
        });
    });

    window.renderStudentNotes = function(id) {
        const container = $("stNotesListContainer"); if (!container) return;
        const st = students[id]; if (!st) return;
        
        let notesStr = st.notes ? st.notes.trim() : "";
        if (!notesStr) {
            container.innerHTML = `<div class="mutedCenter" style="font-size:0.85em;">${t("txt_no_notes")}</div>`;
            return;
        }
        
        let lines = notesStr.split("\n").filter(l => l.trim() !== "");
        if (lines.length === 0) {
            container.innerHTML = `<div class="mutedCenter" style="font-size:0.85em;">${t("txt_no_notes")}</div>`;
            return;
        }
        
        let html = "";
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let datePart = "";
            let textPart = line;
            
            let match = line.match(/^\[([^\]]+)\]\s*:\s*(.*)$/);
            if (match) {
                datePart = match[1];
                textPart = match[2];
            }
            
            html += `
            <div class="note-card" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; background:var(--bg-surface); border:1px solid var(--border); border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div style="flex:1; line-height:1.4;">
                    ${datePart ? `<span class="badge" style="background:#334155; color:#f8fafc; font-size:0.75em; margin-bottom:4px; display:inline-block;">📅 ${datePart}</span><br>` : ""}
                    <span style="color:var(--text); font-size:0.9em;">${textPart}</span>
                </div>
                <div class="row" style="width:auto; gap:6px;">
                    <button class="btn warning smallBtn iconOnly edit-note-btn" data-index="${i}" title="${t('btn_edit_note')}">✏️</button>
                    <button class="btn danger smallBtn iconOnly delete-note-btn" data-index="${i}" title="${t('btn_del_note')}">🗑️</button>
                </div>
            </div>`;
        }
        
        container.innerHTML = html;
        
        container.querySelectorAll(".edit-note-btn").forEach(btn => {
            btn.onclick = function() {
                let idx = toInt(this.getAttribute("data-index"));
                let allLines = (students[currentId].notes || "").split("\n").filter(l => l.trim() !== "");
                let currentLine = allLines[idx];
                
                let existingDate = "";
                let editableText = currentLine;
                let match = currentLine.match(/^\[([^\]]+)\]\s*:\s*(.*)$/);
                if (match) {
                    existingDate = match[1];
                    editableText = match[2];
                }
                
                Swal.fire({
                    title: t("prompt_edit_note"),
                    input: 'textarea',
                    inputValue: editableText,
                    showCancelButton: true,
                    confirmButtonText: currentLang === 'ar' ? 'حفظ' : 'Save',
                    cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
                }).then((res) => {
                    if (res.isConfirmed && res.value !== null) {
                        let newText = res.value;
                        if (newText.trim() === "") {
                            Swal.fire({
                                title: 'تأكيد الحذف',
                                text: t("confirm_empty_note"),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: currentLang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
                                cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
                            }).then((delRes) => {
                                if (delRes.isConfirmed) {
                                    allLines.splice(idx, 1);
                                    students[currentId].notes = allLines.join("\n");
                                    saveAll();
                                    renderStudentNotes(currentId);
                                    if(typeof showToast === "function") showToast(t("msg_note_deleted"), "warning");
                                }
                            });
                        } else {
                            allLines[idx] = existingDate ? `[${existingDate}] : ${newText.trim()}` : newText.trim();
                            students[currentId].notes = allLines.join("\n");
                            saveAll();
                            renderStudentNotes(currentId);
                            if (typeof showToast === "function") showToast(t("msg_note_edited"), "success");
                        }
                    }
                });
            };
        });
        
        container.querySelectorAll(".delete-note-btn").forEach(btn => {
            btn.onclick = function() {
                let idx = toInt(this.getAttribute("data-index"));
                Swal.fire({
                    title: 'تأكيد الحذف',
                    text: t("confirm_del_note"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: currentLang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
                    cancelButtonText: currentLang === 'ar' ? 'إلغاء' : 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        let allLines = (students[currentId].notes || "").split("\n").filter(l => l.trim() !== "");
                        allLines.splice(idx, 1);
                        students[currentId].notes = allLines.join("\n");
                        saveAll();
                        renderStudentNotes(currentId);
                        if(typeof showToast === "function") showToast(t("msg_note_deleted"), "warning");
                    }
                });
            };
        });
    };

    on("addNoteBtn", "click", function() {
        if(!currentId) return; 
        const noteInp = $("newNoteInp"); if (!noteInp) return;
        const txt = noteInp.value.trim(); if(!txt) return;
        
        const now = new Date(); const stamp = `[${now.toISOString().split('T')[0]}]`;
        let oldNotes = students[currentId].notes ? students[currentId].notes : "";
        students[currentId].notes = `${stamp} : ${txt}\n${oldNotes}`;
        
        saveAll(); renderStudentNotes(currentId); showToast(t("msg_saved"));
        noteInp.value = "";
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
            h += `<div class="group-fee-row" style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; padding:10px; background:var(--bg-surface); border:1px solid var(--border); border-radius:8px;">
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span>📘</span>
                        <input type="text" class="inp g-fee-name-inp" data-old-group="${g}" value="${g}" style="flex:1; font-weight:bold;">
                    </div>
                    <div class="row" style="width:auto; gap:5px;">
                        <input type="number" class="inp g-fee-inp" data-group="${g}" value="${val}" style="width:90px; text-align:center;"> ج
                        <button class="btn danger smallBtn iconOnly delete-pkg-btn" data-group="${g}" title="حذف الباقة">🗑️</button>
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
                Swal.fire({
                    title: 'تأكيد الحذف',
                    text: "⚠️ متأكد من حذف هذه الباقة من السيستم؟",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'نعم، احذف',
                    cancelButtonText: 'إلغاء'
                }).then((res) => {
                    if (res.isConfirmed) {
                        delete groupFees[g];
                        saveAll(); renderGroupFeesModal(); populatePackages(); 
                        if(typeof showToast==="function") showToast("تم الحذف");
                    }
                });
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
        const nameInputs = document.querySelectorAll(".g-fee-name-inp");
        const priceInputs = document.querySelectorAll(".g-fee-inp");
        let newGroupFees = {};
        let renamedGroups = {};
        
        for (let i = 0; i < nameInputs.length; i++) {
            let oldName = nameInputs[i].getAttribute("data-old-group");
            let newName = nameInputs[i].value.trim() || oldName;
            let price = toInt(priceInputs[i].value);
            newGroupFees[newName] = price;
            if (newName !== oldName) {
                renamedGroups[oldName] = newName;
            }
        }
        groupFees = newGroupFees;
        
        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.className && renamedGroups[s.className]) {
                s.className = renamedGroups[s.className];
            }
        }
        
        saveAll(); 
        populatePackages(); 
        if ($("groupFeesModal")) $("groupFeesModal").classList.add("hidden"); 
        if(typeof showToast === 'function') showToast(currentLang === 'ar' ? 'تم الحفظ' : 'Saved');
    });

    on("changeLangBtn", "click", function() { 
        const targetLang = (currentLang === "ar" ? "en" : "ar");
        const overlay = $("langSwitchOverlay");
        const textEl = $("langSwitchText");
        if(overlay && textEl) {
            textEl.innerText = targetLang === "en" ? "Switching to English... ⏳" : "جاري التبديل للعربية... ⏳";
            overlay.classList.add("active");
            setTimeout(() => {
                currentLang = targetLang;
                localStorage.setItem(K_LANG, currentLang); 
                applyLanguage();
                if(typeof currentId !== 'undefined' && currentId) {
                    if(typeof updateStudentUI === 'function') updateStudentUI(currentId);
                }
                setTimeout(() => {
                    overlay.classList.remove("active");
                }, 400);
            }, 600);
        } else {
            currentLang = targetLang;
            localStorage.setItem(K_LANG, currentLang); 
            applyLanguage();
            if(typeof currentId !== 'undefined' && currentId) {
                if(typeof updateStudentUI === 'function') updateStudentUI(currentId);
            }
        }
    });

    on("themeSelector", "change", function(e) { switchThemeWithAnimation(e.target.value); });

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
        
        let warnMsg = currentLang==='ar' ? 'تحذير: سيتم مسح البيانات الحالية واستبدالها' : 'Warning: Overwrite current data?';
        const confirmRes = await Swal.fire({
            title: 'تأكيد الاستيراد',
            text: warnMsg,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، استبدل',
            cancelButtonText: 'إلغاء',
            customClass: {
                popup: 'glass-modal',
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        });
        if(!confirmRes.isConfirmed) return;
        
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
            
            const doDelete = (deducted) => {
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
                if (typeof logAction === "function") logAction("حذف طالب", `نقل الطالب ${backup.name || targetId} إلى سلة المحذوفات`);
                saveAll(); updateStudentUI(null); window.switchTab('Home');
                
                showUndoToast(t("msg_deleted"), function() {
                    if (typeof logAction === "function") logAction("استرجاع طالب", `تم استرجاع الطالب ${backup.name || targetId}`);
                    students[targetId] = backup; delete deletedStudents[targetId];
                    revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()] || 0) + deducted;
                    saveAll(); window.extOpen(targetId); renderReport(nowDateStr()); renderCharts(); showToast(t("msg_undo"));
                });
            };

            if(st.paid > 0) {
                Swal.fire({
                    title: 'تأكيد الخصم',
                    text: currentLang==='ar' ? 'خصم مدفوعاته من إيراد اليوم؟' : 'Deduct from revenue?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: currentLang==='ar' ? 'نعم، اخصم' : 'Yes, deduct',
                    cancelButtonText: currentLang==='ar' ? 'لا تخصم' : 'No'
                }).then((res) => {
                    doDelete(res.isConfirmed ? st.paid : 0);
                });
            } else {
                doDelete(0);
            }
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
    on("simplePrevPageBtn", "click", function() { if(simpleCurrentPage > 1) { simpleCurrentPage--; renderSimpleTable(); } });
    on("simpleNextPageBtn", "click", function() { simpleCurrentPage++; renderSimpleTable(); });

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
            Swal.fire({
                title: 'تأكيد التصفير',
                text: msg,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، صفر',
                cancelButtonText: 'إلغاء'
            }).then((res) => {
                if(res.isConfirmed) {
                    for(let k in students) { students[k].paid = 0; students[k].attendanceDates = []; }
                    attByDate = {}; revenueByDate = {}; expensesByDate = {}; saveAll(); location.reload();
                }
            });
        });
    });

    on("resetBtn", "click", function() {
        askAdminPass(function() {
            let msg = currentLang==='ar' ? "مسح شامل وإعادة ضبط المصنع للسيستم بالكامل؟" : "Factory Reset the whole system?";
            Swal.fire({
                title: 'تأكيد ضبط المصنع',
                text: msg,
                icon: 'error',
                showCancelButton: true,
                confirmButtonText: 'نعم، امسح كل شيء',
                cancelButtonText: 'إلغاء'
            }).then((res) => {
                if(res.isConfirmed) { localStorage.clear(); location.reload(); }
            });
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
        showToast(t("msg_att_ok")); renderList(true); handleBulk(); 
    });

    on("bulkAbsentBtn", "click", function() { 
        const checkedBoxes = document.querySelectorAll(".stCheckbox:checked");
        for (let i = 0; i < checkedBoxes.length; i++) { removeAttendance(checkedBoxes[i].getAttribute("data-id"), nowDateStr()); }
        showToast(t("msg_att_warn"), "warning"); renderList(true); handleBulk();
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
        // 1. Settings from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith("ca_")) backupData[key] = localStorage.getItem(key);
        }
        
        // 2. Add heavy data from memory (since they are in IndexedDB, not localStorage)
        backupData[K_STUDENTS] = JSON.stringify(students || {});
        backupData[K_ATT_BY_DATE] = JSON.stringify(attByDate || {});
        backupData[K_REVENUE] = JSON.stringify(revenueByDate || {});
        backupData[K_GROUP_FEES] = JSON.stringify(groupFees || {});
        backupData[K_EXPENSES] = JSON.stringify(expensesByDate || {});
        backupData[K_DELETED] = JSON.stringify(deletedStudents || {});
        backupData[K_SYLLABUS] = JSON.stringify(syllabusData || []);
        backupData[K_EVAL] = JSON.stringify(evalData || {});
        backupData[K_SESSION_STUDENTS] = JSON.stringify(sessionStudentsByDate || {});
        backupData[K_BOOKLETS] = JSON.stringify(bookletsStock || {});
        backupData[K_EXTRA_IDS] = JSON.stringify(extraIds || []);

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
        const confirmRes = await Swal.fire({
            title: 'تحذير شديد',
            text: currentLang === 'ar' ? "⚠️ تحذير شديد: سيتم مسح كل البيانات الحالية واستبدالها بنسخة السحابة، متأكد؟" : "⚠️ WARNING: Current data will be replaced by cloud backup. Sure?",
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'نعم، استرجع البيانات',
            cancelButtonText: 'إلغاء'
        });
        if (!confirmRes.isConfirmed) return;

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'&fields=files(id)`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            const data = await response.json();

            if (data.files && data.files.length > 0) {
                const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                const backupData = await fileRes.json();
                
                // Helper to fallback to older backup keys (e.g. v5)
                const safeGet = (keys) => {
                    for(let k of keys) { if (backupData[k] !== undefined) return backupData[k]; }
                    return undefined;
                };
                
                const restoreMap = {
                    [K_STUDENTS]: safeGet([K_STUDENTS, "ca_students_v5", "ca_students_v4"]),
                    [K_EXTRA_IDS]: safeGet([K_EXTRA_IDS, "ca_extra_ids_v5"]),
                    [K_ATT_BY_DATE]: safeGet([K_ATT_BY_DATE, "ca_att_by_date_v5"]),
                    [K_REVENUE]: safeGet([K_REVENUE, "ca_revenue_v5"]),
                    [K_DELETED]: safeGet([K_DELETED, "ca_deleted_v8", "ca_deleted_v7"]),
                    [K_NOTEBOOK]: backupData[K_NOTEBOOK],
                    [K_GROUP_FEES]: backupData[K_GROUP_FEES],
                    [K_EXPENSES]: backupData[K_EXPENSES],
                    [K_SYLLABUS]: backupData[K_SYLLABUS],
                    [K_EVAL]: backupData[K_EVAL],
                    [K_SESSION_STUDENTS]: backupData[K_SESSION_STUDENTS],
                    [K_BOOKLETS]: backupData[K_BOOKLETS]
                };

                // Save data correctly (to IndexedDB for heavy data, localStorage for lightweight)
                for (const [key, value] of Object.entries(restoreMap)) {
                    if (value !== undefined) {
                        if (HEAVY_DATA_KEYS.includes(key)) {
                            try {
                                await secureSave(key, JSON.parse(value));
                            } catch (e) { console.error("Restore parse err", key); }
                        } else {
                            localStorage.setItem(key, value);
                        }
                    }
                }

                // Push to Firebase if manager is logged in
                if (window.CURRENT_MANAGER_ID) {
                    const indicator = document.getElementById("cloudSyncIndicator");
                    if (indicator) indicator.classList.add("syncing");
                    
                    const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
                    await update(dbRef, {
                        'students': JSON.parse(restoreMap[K_STUDENTS] || "{}"),
                        'attendance': JSON.parse(restoreMap[K_ATT_BY_DATE] || "{}"),
                        'finances/revenue': JSON.parse(restoreMap[K_REVENUE] || "{}"),
                        'packages': JSON.parse(restoreMap[K_GROUP_FEES] || "{}"),
                        'finances/expenses': JSON.parse(restoreMap[K_EXPENSES] || "{}"),
                        'deletedStudents': JSON.parse(restoreMap[K_DELETED] || "{}"),
                        'syllabus': JSON.parse(restoreMap[K_SYLLABUS] || "[]"),
                        'evaluations': JSON.parse(restoreMap[K_EVAL] || "{}"),
                        'sessionStudents': JSON.parse(restoreMap[K_SESSION_STUDENTS] || "{}"),
                        'booklets': JSON.parse(restoreMap[K_BOOKLETS] || "{}")
                    });
                }
                
                showToast(currentLang === 'ar' ? "تم استرجاع البيانات بنجاح، سيتم إعادة التحميل..." : "Data restored successfully. Restarting...");
                setTimeout(() => location.reload(), 1500);
            } else { showToast(currentLang === 'ar' ? "لم يتم العثور على نسخة احتياطية في الدرايف" : "No backup found in Drive", "err"); }
        } catch (err) { console.error(err); showToast(currentLang === 'ar' ? "فشل الاسترجاع، تأكد من الاتصال بالنت" : "Restore failed, check connection", "err"); }
    });
// ==========================================
    // 17.8. ASSISTANT MANAGEMENT (SAAS)
    // ==========================================
    let currentManager = localStorage.getItem("ca_current_username") || "المدير";

    if($("currentShiftManagerName")) $("currentShiftManagerName").innerText = currentManager;

    if ($("addNewAsstBtn")) {
        on("addNewAsstBtn", "click", async function() {
            const rawAsstU = $("newAsstUsername") ? $("newAsstUsername").value.trim() : "";
            const asstP = $("newAsstPassword") ? $("newAsstPassword").value.trim() : "";
            
            if (!rawAsstU || !asstP) {
                return showToast("أدخل اسم المستخدم وكلمة المرور", "err");
            }
            
            const asstU = sanitizeKey(rawAsstU);
            const managerId = localStorage.getItem("ca_manager_id");
            if (!managerId) return showToast("يجب أن تكون مديراً لإضافة مساعدين.", "err");
            
            try {
                // 1. Save to Manager's node
                await set(ref(database, `users/${managerId}/settings/assistants/${asstU}`), {
                    username: rawAsstU,
                    password: asstP,
                    created_at: new Date().toISOString()
                });
                
                // 2. Save to global mapping
                await set(ref(database, `global_assistants/${asstU}`), managerId);
                
                showToast("تم إنشاء حساب المساعد بنجاح ✅", "success");
                
                $("newAsstUsername").value = "";
                $("newAsstPassword").value = "";
                
                fetchManagerAssistants();
            } catch (err) {
                console.error(err);
                showToast("فشل إنشاء الحساب. تأكد من اتصال الإنترنت.", "err");
            }
        });
    }

    async function fetchManagerAssistants() {
        const listEl = $("managerAssistantsList");
        if (!listEl) return;
        
        const managerId = localStorage.getItem("ca_manager_id");
        if (!managerId) return;
        
        listEl.innerHTML = `<div class="mutedCenter">جاري التحميل...</div>`;
        
        try {
            const snapshot = await get(child(ref(database), `users/${managerId}/settings/assistants`));
            if (snapshot.exists()) {
                const assistants = snapshot.val();
                let html = "";
                for (let key in assistants) {
                    let uName = key;
                    let pass  = assistants[key];
                    if (typeof assistants[key] === "object") {
                        uName = assistants[key].username || key;
                        pass  = assistants[key].password;
                    }
                    const initial = (uName[0] || "?").toUpperCase();
                    const createdAt = (assistants[key] && assistants[key].created_at)
                        ? new Date(assistants[key].created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                    html += `
                    <div class="assistant-card">
                        <div class="assistant-avatar">${initial}</div>
                        <div class="assistant-info">
                            <div class="assistant-name">${uName}</div>
                            <div class="assistant-sub">كلمة المرور: ${pass} &nbsp;•&nbsp; تاريخ الإنشاء: ${createdAt}</div>
                        </div>
                        <div class="assistant-actions">
                            <button class="btn danger smallBtn" onclick="window.deleteAssistant('${key}')" style="display:flex;align-items:center;gap:5px;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                حذف
                            </button>
                        </div>
                    </div>`;
                }
                listEl.innerHTML = html || `<div class="mutedCenter">لا يوجد مساعدين مسجلين.</div>`;
            } else {
                listEl.innerHTML = `<div class="mutedCenter">لا يوجد مساعدين مسجلين بعد.</div>`;
            }
        } catch (err) {
            console.error(err);
            listEl.innerHTML = `<div class="mutedCenter">فشل جلب قائمة المساعدين.</div>`;
        }
    }


    window.deleteAssistant = async function(asstKey) {
        const res = await Swal.fire({
            title: 'تأكيد الحذف',
            text: currentLang === 'ar' ? `هل أنت متأكد من حذف المساعد نهائياً؟` : `Delete assistant?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        if (!res.isConfirmed) return;
        
        const managerId = localStorage.getItem("ca_manager_id");
        try {
            await set(ref(database, `users/${managerId}/settings/assistants/${asstKey}`), null);
            await set(ref(database, `global_assistants/${asstKey}`), null);
            showToast("تم حذف المساعد ✅", "success");
            fetchManagerAssistants();
        } catch (err) {
            console.error(err);
            showToast("فشل في حذف المساعد.", "err");
        }
    };
    
    // (switchManagerTab defined earlier - section 5)

    // ==========================================
    // 17.9. MANAGER: DAILY REPORT
    // ==========================================
    function renderManagerDailyReport(d) {
        if ($("mgrDailyDate")) $("mgrDailyDate").value = d;
        const ids     = attByDate[d] || [];
        const rev     = revenueByDate[d] || 0;
        const expArr  = expensesByDate[d] || [];
        const validStudents = Object.values(students || {}).filter(s => s && s.name && s.name.trim() !== "");
        const totalSt = validStudents.length;
        let totalExp  = 0; expArr.forEach(e => totalExp += (e.amount || 0));

        if ($("mgrDailyAttendCount")) $("mgrDailyAttendCount").textContent = ids.length;
        if ($("mgrDailyRevenue"))     $("mgrDailyRevenue").textContent     = rev;
        if ($("mgrDailyAbsent"))      $("mgrDailyAbsent").textContent      = Math.max(0, totalSt - ids.length);
        if ($("mgrDailyExpenses"))    $("mgrDailyExpenses").textContent    = totalExp;

        const body = $("mgrDailyReportBody");
        if (!body) return;
        if (ids.length === 0 && expArr.length === 0) {
            body.innerHTML = `<div class="mutedCenter">لا يوجد بيانات لهذا اليوم</div>`;
            return;
        }
        // Group by class
        let groups = {};
        ids.forEach(id => {
            const st = students[id];
            const cls = (st && st.className) ? st.className.trim() : "عام";
            if (!groups[cls]) groups[cls] = { count: 0, revenue: 0 };
            groups[cls].count++;
            if (st && st.paid !== undefined) {
                const req = groupFees[cls] ? toInt(groupFees[cls]) : 0;
                if (req > 0) groups[cls].revenue += req;
            }
        });
        let html = "";
        for (let g in groups) {
            const gColor = getTagColor(g);
            html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-inline-start:4px solid ${gColor};background:var(--bg-inset);border-radius:8px;margin-bottom:8px;">
                <span style="font-weight:700;color:${gColor};">${g}</span>
                <span style="font-weight:600;">${groups[g].count} طالب</span>
            </div>`;
        }
        if (expArr.length > 0) {
            html += `<div style="margin-top:14px;"><h4 style="color:var(--danger);margin-bottom:8px;">المصروفات</h4>`;
            expArr.forEach(e => {
                html += `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-danger-subtle);border-radius:6px;margin-bottom:6px;font-size:0.9em;">
                    <span>${e.reason || "غير محدد"}</span>
                    <span style="color:var(--danger);font-weight:700;">${e.amount} ج</span>
                </div>`;
            });
            html += `</div>`;
        }
        body.innerHTML = html;
    }

    if ($("mgrDailyDate")) {
        $("mgrDailyDate").addEventListener("change", e => renderManagerDailyReport(e.target.value));
    }

    // ==========================================
    // 17.10. MANAGER: TERM REPORT
    // ==========================================
    function renderManagerTermReport() {
        const search   = ($("mgrTermSearch") ? $("mgrTermSearch").value.toLowerCase() : "");
        const clsFilter= ($("mgrTermClass") ? $("mgrTermClass").value : "");
        const tbody    = $("mgrTermTableBody");
        const clsSel   = $("mgrTermClass");

        // populate class filter
        if (clsSel) {
            const existing = [...clsSel.options].map(o => o.value);
            const classes  = [...new Set(Object.values(students).map(s => s.className || "عام"))];
            classes.forEach(c => {
                if (!existing.includes(c)) {
                    const opt = document.createElement("option");
                    opt.value = c; opt.textContent = c;
                    clsSel.appendChild(opt);
                }
            });
        }

        let rows = [], totalRev = 0, totalDebt = 0;
        Object.values(students).forEach(st => {
            if (!st || !st.name) return;
            if (search && !st.name.toLowerCase().includes(search)) return;
            const cls  = (st.className || "عام").trim();
            if (clsFilter && cls !== clsFilter) return;
            const req  = groupFees[cls] ? toInt(groupFees[cls]) : 0;
            const paid = st.paid || 0;
            const debt = req > 0 ? Math.max(0, req - paid) : 0;
            const attCount = Object.values(attByDate).reduce((n, ids) => n + (ids.includes(String(st.id)) ? 1 : 0), 0);
            totalRev  += paid;
            totalDebt += debt;
            rows.push({ st, cls, req, paid, debt, attCount });
        });

        if ($("mgrTermTotalStudents")) $("mgrTermTotalStudents").textContent = rows.length;
        if ($("mgrTermTotalRevenue"))  $("mgrTermTotalRevenue").textContent  = totalRev;
        if ($("mgrTermTotalDebt"))     $("mgrTermTotalDebt").textContent     = totalDebt;

        if (!tbody) return;
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="mutedCenter" style="padding:20px;">لا يوجد طلاب</td></tr>`;
            return;
        }
        const gColor = c => getTagColor ? getTagColor(c) : "#888";
        tbody.innerHTML = rows.map(r => `
            <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-inset)'" onmouseout="this.style.background=''"">
                <td style="padding:10px 16px;font-weight:600;">${r.st.name}</td>
                <td style="padding:10px 16px;"><span style="background:${gColor(r.cls)}22;color:${gColor(r.cls)};padding:3px 8px;border-radius:5px;font-size:0.82em;font-weight:700;">${r.cls}</span></td>
                <td style="padding:10px 16px;">${r.req > 0 ? r.req + " ج" : "—"}</td>
                <td style="padding:10px 16px;color:var(--success);font-weight:700;">${r.paid > 0 ? r.paid + " ج" : "—"}</td>
                <td style="padding:10px 16px;color:${r.debt > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:700;">${r.debt > 0 ? r.debt + " ج" : "✓"}</td>
                <td style="padding:10px 16px;">${r.attCount}</td>
                <td style="padding:10px 16px;">
                    <button class="btn primary smallBtn" onclick="window.extOpen('${r.st.id}')">فتح</button>
                </td>
            </tr>`).join("");
    }

    if ($("mgrTermSearch")) $("mgrTermSearch").addEventListener("input", renderManagerTermReport);
    if ($("mgrTermClass"))  $("mgrTermClass").addEventListener("change", renderManagerTermReport);

    // ==========================================
    // 17.11. MANAGER: PERMISSIONS SYSTEM
    // ==========================================
    const PERMISSIONS_DEFS = [
        { key: "show_revenue",           label: "إظهار الإيراد اليومي",         desc: "يسمح للمساعد برؤية إيراد اليوم في الشريط العلوي" },
        { key: "can_add_student",        label: "إضافة طالب جديد",              desc: "يسمح للمساعد بإضافة طلاب جديدين للنظام" },
        { key: "can_manage_packages",    label: "إدارة الباقات والأسعار",        desc: "يسمح للمساعد بتعديل الباقات والأسعار" },
        { key: "can_view_reports",       label: "الوصول لصفحة التقارير",         desc: "يسمح للمساعد بفتح صفحة التقارير اليومية" },
        { key: "can_access_marketing",   label: "أدوات التسويق",                desc: "يسمح للمساعد بفتح صفحة أدوات التسويق" },
        { key: "can_access_session_students", label: "طلاب الحصة",             desc: "يسمح للمساعد بفتح صفحة طلاب الحصة" },
        { key: "can_request_discount",   label: "طلب خصم / إعفاء",             desc: "يسمح للمساعد بإرسال طلب خصم للمدير لمراجعته" },
    ];

    // Default: all permissions ON
    let currentPermissions = {};
    PERMISSIONS_DEFS.forEach(p => currentPermissions[p.key] = true);

    async function loadPermissions() {
        const mid = localStorage.getItem("ca_manager_id");
        if (!mid || !isFirebaseConnected) return;
        try {
            const snap = await get(child(ref(database), `users/${mid}/settings/permissions`));
            if (snap.exists()) {
                const saved = snap.val();
                PERMISSIONS_DEFS.forEach(p => {
                    if (saved[p.key] !== undefined) currentPermissions[p.key] = saved[p.key];
                });
            }
        } catch(e) { console.error("Load permissions error:", e); }
    }

    async function savePermissionsToFirebase(toggledKey, toggledVal) {
        const mid = window.CURRENT_MANAGER_ID || localStorage.getItem("ca_manager_id");
        if (!mid) throw new Error("Missing manager ID");

        await update(ref(database, `users/${mid}/settings/permissions`), currentPermissions);

        let detailMsg = "";
        if (toggledKey !== undefined) {
            const def = PERMISSIONS_DEFS.find(p => p.key === toggledKey);
            const name = def ? def.label : toggledKey;
            detailMsg = toggledVal ? `🟢 تم فتح خاصية: "${name}"` : `⛔ تم إغلاق خاصية: "${name}"`;
        } else {
            detailMsg = "تم تحديث الصلاحيات العامة";
        }

        showToast(detailMsg, toggledVal !== false ? "success" : "warning");

        // Send detailed notification to assistants inbox
        const msgId = Date.now();
        await update(ref(database, `users/${mid}/assistant_messages/${msgId}`), {
            title: toggledVal ? "🟢 فتح صلاحية جديدة" : "⛔ إغلاق صلاحية",
            body: `قام المدير بتعديل صلاحياتك: ${detailMsg}`,
            type: "feature_toggle",
            timestamp: msgId,
            read: false
        });
    }

    function renderPermissionsPanel() {
        const grid = $("permissionsGrid");
        if (!grid) return;
        grid.innerHTML = PERMISSIONS_DEFS.map(p => `
            <div class="permission-card">
                <div class="permission-info">
                    <div class="permission-title">${p.label}</div>
                    <div class="permission-desc">${p.desc}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span id="perm_status_${p.key}" style="font-size:0.82em; transition:all 0.3s;"></span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="perm_${p.key}" ${currentPermissions[p.key] ? "checked" : ""} onchange="window.onPermissionToggle('${p.key}', this.checked)">
                        <span class="toggle-track"></span>
                    </label>
                </div>
            </div>`).join("");
    }

    window.onPermissionToggle = async function(key, val) {
        const inputEl = $("perm_" + key);
        const statusEl = $("perm_status_" + key);

        if (inputEl) inputEl.disabled = true;
        if (statusEl) {
            statusEl.innerHTML = `<div style="display:inline-block; width:14px; height:14px; border:2px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle;"></div> <span style="color:var(--text-muted);">جاري الحفظ...</span>`;
        }

        currentPermissions[key] = val;
        try {
            await savePermissionsToFirebase(key, val);
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:var(--success); font-weight:700;">✅ تم الحفظ</span>`;
                setTimeout(() => { if (statusEl) statusEl.innerHTML = ""; }, 2500);
            }
        } catch (e) {
            console.error("Permission toggle error:", e);
            currentPermissions[key] = !val;
            if (inputEl) {
                inputEl.checked = !val;
                inputEl.disabled = false;
            }
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:var(--danger); font-weight:700;">❌ فشل الحفظ</span>`;
                setTimeout(() => { if (statusEl) statusEl.innerHTML = ""; }, 3000);
            }
            showToast("فشل حفظ الصلاحيات. حاول مرة أخرى.", "err");
            return;
        }

        if (inputEl) inputEl.disabled = false;
    };

    // ── CENTRAL PERMISSION-TO-UI MAP ──
    // To add a NEW permission in the future, just add an entry here + in PERMISSIONS_DEFS above.
    const PERMISSION_TAB_MAP = {
        can_view_reports:              { btnId: "btnTabReports" },
        can_access_marketing:          { btnId: "btnTabMarketing" },
        can_access_session_students:   { btnId: "btnTabSessionStudents" },
    };

    function applyPermissionsToAssistantUI() {
        if (currentUserRole === "admin") return; // Manager sees everything

        // 1. Revenue visibility
        const revPill = document.querySelector(".stat-pill.adminOnly");
        if (revPill) {
            if (!currentPermissions.show_revenue) {
                revPill.style.filter = "blur(5px)";
                revPill.style.pointerEvents = "none";
            } else {
                revPill.style.filter = "";
                revPill.style.pointerEvents = "";
            }
        }

        // 2. Tab/Section locks (uses central map)
        Object.entries(PERMISSION_TAB_MAP).forEach(([permKey, { btnId }]) => {
            const btn = $(btnId);
            if (!btn) return;
            if (!currentPermissions[permKey]) {
                // LOCK
                btn.classList.add("locked-feature");
                let badge = btn.querySelector(".locked-badge");
                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "locked-badge";
                    badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> مقفل من المدير`;
                    btn.appendChild(badge);
                }
            } else {
                // UNLOCK
                btn.classList.remove("locked-feature");
                const badge = btn.querySelector(".locked-badge");
                if (badge) badge.remove();
            }
        });

        // 3. Add student lock (correct ID: addNewBtn)
        const addStBtn = $("addNewBtn");
        if (addStBtn) {
            if (!currentPermissions.can_add_student) {
                addStBtn.classList.add("locked-feature");
                addStBtn.title = "مقفل من المدير 🔒";
            } else {
                addStBtn.classList.remove("locked-feature");
                addStBtn.title = "";
            }
        }

        // 4. Manage packages lock
        const pkgBtn = $("quickGroupFeesBtn");
        if (pkgBtn) {
            if (!currentPermissions.can_manage_packages) {
                pkgBtn.classList.add("locked-feature");
                pkgBtn.title = "مقفل من المدير 🔒";
            } else {
                pkgBtn.classList.remove("locked-feature");
                pkgBtn.title = "";
            }
        }

        // 5. Discount request lock
        const discountBtn = $("correctPayBtn");
        if (discountBtn) {
            if (!currentPermissions.can_request_discount) {
                discountBtn.classList.add("locked-feature");
                discountBtn.title = "مقفل من المدير 🔒";
            } else {
                discountBtn.classList.remove("locked-feature");
                discountBtn.title = "";
            }
        }
    }

    function updateManagerPermissionsUI() {
        PERMISSIONS_DEFS.forEach(p => {
            const checkbox = document.getElementById("perm_" + p.key);
            if (checkbox && checkbox.checked !== !!currentPermissions[p.key]) {
                checkbox.checked = !!currentPermissions[p.key];
            }
        });
    }

    // ── REAL-TIME PERMISSIONS LISTENER ──
    // Called from initSystem() after data loads to guarantee reliability.
    let _prevAssistantPermissions = null;
    let _permListenerRegistered = false;
    function setupPermissionsListener() {
        if (_permListenerRegistered) return;
        const mid = window.CURRENT_MANAGER_ID || localStorage.getItem("ca_manager_id");
        if (!mid) return;
        _permListenerRegistered = true;

        // Firebase onValue works even when offline — it caches and syncs automatically.
        const permRef = ref(database, `users/${mid}/settings/permissions`);
        onValue(permRef, snap => {
            if (snap.exists()) {
                const saved = snap.val();

                // Live Toast notification for assistant on real-time change
                if (currentUserRole !== "admin" && _prevAssistantPermissions) {
                    PERMISSIONS_DEFS.forEach(p => {
                        if (saved[p.key] !== undefined && _prevAssistantPermissions[p.key] !== undefined && saved[p.key] !== _prevAssistantPermissions[p.key]) {
                            const isNowEnabled = saved[p.key];
                            const msg = isNowEnabled ? `🟢 قام المدير بفتح خاصية: "${p.label}"` : `⛔ قام المدير بإغلاق خاصية: "${p.label}"`;
                            showToast(msg, isNowEnabled ? "success" : "warning");
                        }
                    });
                }

                PERMISSIONS_DEFS.forEach(p => {
                    if (saved[p.key] !== undefined) currentPermissions[p.key] = saved[p.key];
                });

                _prevAssistantPermissions = { ...currentPermissions };
            }
            
            if (currentUserRole !== "admin") {
                // Apply locks to assistant UI
                applyPermissionsToAssistantUI();
            } else {
                // Safely update manager toggle switches without breaking the UI
                updateManagerPermissionsUI();
            }
        });
        console.log("[Permissions] Real-time listener registered for:", mid);
    }

    // ==========================================
    // 17.12. MANAGER: DECISION REQUESTS INBOX
    // ==========================================
    async function fetchManagerRequests() {
        const listEl = $("managerRequestsList");
        if (!listEl) return;
        const mid = localStorage.getItem("ca_manager_id");
        if (!mid) return;
        listEl.innerHTML = `<div class="mutedCenter">جاري التحميل...</div>`;
        try {
            const snap = await get(child(ref(database), `users/${mid}/requests`));
            const badge = $("managerDecisionsBadge");
            if (snap.exists()) {
                const reqs = snap.val();
                let pending = [], html = "";
                for (let id in reqs) {
                    const r = reqs[id];
                    if (r.status === "pending") pending.push({ id, ...r });
                }
                if (badge) {
                    if (pending.length > 0) { badge.textContent = pending.length; badge.classList.remove("hidden"); }
                    else badge.classList.add("hidden");
                }
                if (pending.length === 0) {
                    listEl.innerHTML = `<div class="mutedCenter">لا توجد طلبات معلقة</div>`;
                    return;
                }
                pending.forEach(r => {
                    const date = new Date(r.timestamp).toLocaleString("ar-EG");
                    const typeLabel = r.type === "exemption" ? "إعفاء كامل" : `خصم ${r.amount} ج`;
                    html += `<div class="decision-card">
                        <div class="decision-card-info">
                            <div class="decision-student-name">${r.studentName || r.studentId}</div>
                            <div class="decision-meta">${typeLabel} • طلب من: ${r.requestedBy || "مساعد"} • ${date}</div>
                            <div class="decision-meta" style="margin-top:4px;">السبب: ${r.reason || "—"}</div>
                        </div>
                        <div class="decision-amount">${r.type === "exemption" ? "إعفاء" : r.amount + " ج"}</div>
                        <div class="decision-actions">
                            <button class="btn success smallBtn" onclick="window.approveRequest('${r.id}')">قبول</button>
                            <button class="btn danger smallBtn" onclick="window.rejectRequest('${r.id}')">رفض</button>
                        </div>
                    </div>`;
                });
                listEl.innerHTML = html;
            } else {
                if (badge) badge.classList.add("hidden");
                listEl.innerHTML = `<div class="mutedCenter">لا توجد طلبات معلقة</div>`;
            }
        } catch(e) {
            console.error(e);
            listEl.innerHTML = `<div class="mutedCenter">فشل جلب الطلبات</div>`;
        }
    }

    window.approveRequest = async function(reqId) {
        const mid = localStorage.getItem("ca_manager_id");
        if (!mid) return;
        try {
            const snap = await get(child(ref(database), `users/${mid}/requests/${reqId}`));
            if (!snap.exists()) return;
            const r = snap.val();

            // Apply the discount/exemption
            const stId = String(r.studentId);
            if (students[stId]) {
                if (r.type === "exemption") {
                    const cls = (students[stId].className || "").trim();
                    students[stId].paid = groupFees[cls] ? toInt(groupFees[cls]) : students[stId].paid;
                } else if (r.type === "discount") {
                    const cls = (students[stId].className || "").trim();
                    const req = groupFees[cls] ? toInt(groupFees[cls]) : 0;
                    const discounted = Math.max(0, req - toInt(r.amount));
                    students[stId].paid = Math.max(students[stId].paid || 0, discounted > 0 ? req - toInt(r.amount) : 0);
                }
                saveAll();
            }

            // Mark request as approved
            await update(ref(database, `users/${mid}/requests/${reqId}`), { status: "approved" });

            // Notify assistant
            const msgId = Date.now();
            await update(ref(database, `users/${mid}/assistant_messages/${msgId}`), {
                title: "✅ تمت الموافقة على طلبك",
                body: `وافق المدير على ${r.type === "exemption" ? "إعفاء" : "خصم " + r.amount + " ج"} للطالب ${r.studentName || r.studentId}. السبب: ${r.reason || "—"}`,
                type: "discount_approved",
                timestamp: msgId,
                read: false
            });

            showToast("تمت الموافقة وتطبيق الخصم ✅", "success");
            fetchManagerRequests();
        } catch(e) {
            console.error(e);
            showToast("فشل تنفيذ الطلب", "err");
        }
    };

    window.rejectRequest = async function(reqId) {
        const mid = localStorage.getItem("ca_manager_id");
        if (!mid) return;
        try {
            const snap = await get(child(ref(database), `users/${mid}/requests/${reqId}`));
            if (!snap.exists()) return;
            const r = snap.val();
            await update(ref(database, `users/${mid}/requests/${reqId}`), { status: "rejected" });

            // Notify assistant
            const msgId = Date.now();
            await update(ref(database, `users/${mid}/assistant_messages/${msgId}`), {
                title: "❌ تم رفض طلبك",
                body: `رفض المدير طلب ${r.type === "exemption" ? "الإعفاء" : "الخصم " + r.amount + " ج"} للطالب ${r.studentName || r.studentId}.`,
                type: "discount_rejected",
                timestamp: msgId,
                read: false
            });

            showToast("تم رفض الطلب", "warning");
            fetchManagerRequests();
        } catch(e) {
            console.error(e);
            showToast("فشل في الرفض", "err");
        }
    };

    // Direct discount by manager
    if ($("mgrApplyDirectDiscountBtn")) {
        on("mgrApplyDirectDiscountBtn", "click", async function() {
            const stId   = $("mgrDirectStudentId") ? $("mgrDirectStudentId").value.trim() : "";
            const amount = $("mgrDirectAmount")    ? toInt($("mgrDirectAmount").value) : 0;
            const reason = $("mgrDirectReason")    ? $("mgrDirectReason").value.trim() : "";
            if (!stId || !students[stId]) return showToast("الطالب غير موجود", "err");
            const cls = (students[stId].className || "").trim();
            const req = groupFees[cls] ? toInt(groupFees[cls]) : 0;
            if (amount > 0 && req > 0) {
                students[stId].paid = Math.max(students[stId].paid || 0, req - amount);
            } else if (amount === 0 && req > 0) {
                students[stId].paid = req; // Full exemption
            }
            saveAll();
            if ($("mgrDirectStudentId")) $("mgrDirectStudentId").value = "";
            if ($("mgrDirectAmount")) $("mgrDirectAmount").value = "";
            if ($("mgrDirectReason")) $("mgrDirectReason").value = "";
            showToast(`تم تطبيق الخصم على ${students[stId].name} ✅`, "success");
        });
    }

    // ==========================================
    // 17.13. ASSISTANT: SEND DISCOUNT REQUEST
    // ==========================================
    window.openDiscountRequestModal = function(studentId) {
        const st = students[String(studentId)];
        if (!st) return;
        if (!currentPermissions.can_request_discount) {
            showToast("إرسال طلبات الخصم مقفل من المدير 🔒", "warning");
            return;
        }
        if ($("discReqStudentId")) $("discReqStudentId").value = studentId;
        if ($("discReqStudentName")) $("discReqStudentName").textContent = `${st.name} (ID: ${studentId})`;
        if ($("discReqAmount")) $("discReqAmount").value = "";
        if ($("discReqReason")) $("discReqReason").value = "";
        if ($("discountRequestModal")) $("discountRequestModal").classList.remove("hidden");
    };

    if ($("submitDiscountRequestBtn")) {
        on("submitDiscountRequestBtn", "click", async function() {
            const stId   = $("discReqStudentId") ? $("discReqStudentId").value : "";
            const type   = $("discReqType")      ? $("discReqType").value : "discount";
            const amount = $("discReqAmount")    ? toInt($("discReqAmount").value) : 0;
            const reason = $("discReqReason")    ? $("discReqReason").value.trim() : "";
            const mid    = localStorage.getItem("ca_manager_id") || window.CURRENT_MANAGER_ID;
            const st     = students[String(stId)];
            if (!st || !mid) return showToast("حدث خطأ، تأكد من الاتصال", "err");
            if (!reason) return showToast("من فضلك اكتب سبب الطلب", "err");
            const reqId = Date.now();
            try {
                await update(ref(database, `users/${mid}/requests/${reqId}`), {
                    studentId: stId,
                    studentName: st.name,
                    type,
                    amount,
                    reason,
                    requestedBy: localStorage.getItem("ca_current_username") || "مساعد",
                    timestamp: reqId,
                    status: "pending"
                });
                if ($("discountRequestModal")) $("discountRequestModal").classList.add("hidden");
                showToast("تم إرسال الطلب للمدير ✅", "success");
            } catch(e) {
                console.error(e);
                showToast("فشل إرسال الطلب، تأكد من الاتصال", "err");
            }
        });
    }

    // ==========================================
    // 17.14. ASSISTANT MESSAGES INBOX
    // ==========================================
    let assistantMessages = [];
    let lastReadMsgTime = toInt(localStorage.getItem("ca_last_read_msg") || "0");

    function fetchAssistantMessages() {
        const mid = window.CURRENT_MANAGER_ID;
        if (!mid || !isFirebaseConnected || window.CURRENT_ROLE === "admin") return;
        const msgsRef = ref(database, `users/${mid}/assistant_messages`);
        onValue(msgsRef, snap => {
            assistantMessages = [];
            if (snap.exists()) {
                const data = snap.val();
                for (let id in data) assistantMessages.push({ id, ...data[id] });
                assistantMessages.sort((a, b) => b.timestamp - a.timestamp);
            }
            updateAssistantMsgBadge();
        });
    }

    function updateAssistantMsgBadge() {
        const badge = $("notificationsBadge");
        const unread = assistantMessages.filter(m => !m.read && m.timestamp > lastReadMsgTime).length;
        if (badge) {
            if (unread > 0) { badge.textContent = unread; badge.classList.remove("hidden"); }
            else badge.classList.add("hidden");
        }
    }

    // Override notifications dropdown content for assistants: show tabs (Activity Log + Messages)
    function renderAssistantNotifDropdown() {
        const listEl = $("notificationsList");
        if (!listEl) return;
        if (window.CURRENT_ROLE === "admin") return; // Admins keep the original activity log view

        // Inject tabs if not already
        const dropdown = $("notificationsDropdown");
        if (dropdown && !dropdown.querySelector(".msg-tabs")) {
            const tabsDiv = document.createElement("div");
            tabsDiv.className = "msg-tabs";
            tabsDiv.innerHTML = `
                <button class="msg-tab-btn active" id="msgTabMessages" onclick="window.switchMsgTab('messages')">الرسائل</button>
                <button class="msg-tab-btn" id="msgTabActivity" onclick="window.switchMsgTab('activity')">سجل العمليات</button>`;
            dropdown.insertBefore(tabsDiv, listEl);
        }

        renderAssistantMessages();
    }

    window.switchMsgTab = function(tab) {
        document.querySelectorAll(".msg-tab-btn").forEach(b => b.classList.remove("active"));
        if (tab === "messages") {
            if ($("msgTabMessages")) $("msgTabMessages").classList.add("active");
            renderAssistantMessages();
        } else {
            if ($("msgTabActivity")) $("msgTabActivity").classList.add("active");
            // Re-render activity log in listEl
            window.fetchActivityLog && window.fetchActivityLog();
        }
    };

    function renderAssistantMessages() {
        const listEl = $("notificationsList");
        if (!listEl) return;
        if (assistantMessages.length === 0) {
            listEl.innerHTML = `<div style="text-align:center;color:#888;padding:10px;">لا توجد رسائل</div>`;
            return;
        }
        listEl.innerHTML = assistantMessages.slice(0, 20).map(m => {
            const isUnread = !m.read;
            const date = new Date(m.timestamp).toLocaleString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            const color = m.type === "discount_approved" ? "var(--success)" : m.type === "discount_rejected" ? "var(--danger)" : "var(--primary)";
            return `<div style="padding:10px;border-radius:8px;background:${isUnread ? "rgba(37,99,235,0.08)" : "transparent"};border-inline-start:3px solid ${isUnread ? color : "var(--border)"};font-size:0.88em;cursor:pointer;" onclick="window.markMsgRead('${m.id}')">
                <div style="font-weight:700;margin-bottom:3px;color:${color};">${m.title}</div>
                <div style="color:var(--text-primary);opacity:0.85;margin-bottom:4px;">${m.body}</div>
                <div style="font-size:0.78em;color:#888;">${date}</div>
            </div>`;
        }).join("");
        // Mark as read after viewing
        lastReadMsgTime = Date.now();
        localStorage.setItem("ca_last_read_msg", lastReadMsgTime.toString());
        updateAssistantMsgBadge();
    }

    window.markMsgRead = async function(msgId) {
        const mid = window.CURRENT_MANAGER_ID;
        if (!mid) return;
        try { await update(ref(database, `users/${mid}/assistant_messages/${msgId}`), { read: true }); }
        catch(e) { console.error(e); }
    };

    // Hook: when notifications dropdown opens, render properly
    on("notificationsToggleBtn", "click", function() {
        setTimeout(() => {
            if (window.CURRENT_ROLE !== "admin") renderAssistantNotifDropdown();
        }, 50);
    });

    // Fetch messages for assistant on startup
    if (window.CURRENT_ROLE !== "admin") fetchAssistantMessages();

    // showAddAsstModal button
    if ($("showAddAsstModalBtn")) {
        on("showAddAsstModalBtn", "click", function() {
            const panel = $("addAsstFormPanel");
            if (panel) panel.classList.toggle("hidden");
        });
    }

    // ==========================================
    // AUTO-FETCH: Decisions badge on dashboard load
    // ==========================================
    if (window.CURRENT_ROLE === "admin" && isFirebaseConnected) {
        const mid = localStorage.getItem("ca_manager_id");
        if (mid) {
            const reqRef = ref(database, `users/${mid}/requests`);
            onValue(reqRef, snap => {
                const badge = $("managerDecisionsBadge");
                if (!badge) return;
                let pendingCount = 0;
                if (snap.exists()) {
                    const reqs = snap.val();
                    for (let id in reqs) if (reqs[id].status === "pending") pendingCount++;
                }
                if (pendingCount > 0) { badge.textContent = pendingCount; badge.classList.remove("hidden"); }
                else badge.classList.add("hidden");
            });
        }
    }

    // ==========================================
    // 18. INITIALIZATION (START ENGINE)
    // ==========================================
    function checkDailyBackup() {
        const last = localStorage.getItem(K_LAST_BACKUP);
        if(last !== nowDateStr()) {
            if($("btnTabAdmin")) $("btnTabAdmin").classList.add("needs-backup");
            setTimeout(function() {
                let msg = currentLang==='ar' ? '⚠️ تذكير: لم تقم بتصدير نسخة Excel اليوم' : '⚠️ Backup reminder';
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

    window.renderReportsPage = function() {
        let totalExpected = 0;
        let totalPaid = 0;
        let totalRemaining = 0;
        let debtors = [];

        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.name || s.paid > 0) {
                let sClass = s.className ? s.className.trim() : "";
                let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
                let p = s.paid || 0;
                let remain = req > 0 ? (req - p) : 0;
                if (remain < 0) remain = 0;

                totalExpected += req;
                totalPaid += p;
                totalRemaining += remain;

                if (remain > 0) {
                    debtors.push({ id: s.id, name: s.name || "بدون اسم", className: sClass || "عام", remain: remain });
                }
            }
        }

        if ($("totalExpectedTerm")) $("totalExpectedTerm").textContent = totalExpected;
        if ($("totalPaidTerm")) $("totalPaidTerm").textContent = totalPaid;
        if ($("totalRemainingTerm")) $("totalRemainingTerm").textContent = totalRemaining;
        if ($("debtorsCount")) $("debtorsCount").textContent = debtors.length;

        const tb = $("debtsTable");
        if (tb) {
            const tbody = tb.querySelector("tbody");
            if (tbody) {
                tbody.innerHTML = "";
                for (let i = 0; i < debtors.length; i++) {
                    let d = debtors[i];
                    let gColor = getTagColor(d.className);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${d.id}</td>
                        <td><b>${d.name}</b></td>
                        <td><span class="badge" style="background:${gColor}; border-color:${gColor}; color:#fff;">${d.className}</span></td>
                        <td style="color:var(--danger); font-weight:bold;">${d.remain} ج</td>
                    `;
                    tr.style.cursor = "pointer";
                    tr.onclick = function() { window.extOpen(d.id); };
                    tbody.appendChild(tr);
                }
                if (debtors.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="mutedCenter">${currentLang === 'ar' ? "🎉 لا يوجد طلاب مديونين، الجميع خالص." : "🎉 No debtors found."}</td></tr>`;
                }
            }
        }
    };

    on("saveEvalBtn", "click", function() {
        evalData = {
            centerName: $("evalCenterName") ? $("evalCenterName").value.trim() : "",
            manager: $("evalManager") ? $("evalManager").value.trim() : "",
            packages: $("evalPackages") ? $("evalPackages").value.trim() : "",
            studentsCount: $("evalStudentsCount") ? $("evalStudentsCount").value.trim() : "",
            currentCourses: $("evalCurrentCourses") ? $("evalCurrentCourses").value.trim() : "",
            collabOpps: $("evalCollabOpps") ? $("evalCollabOpps").value.trim() : "",
            notes: $("evalNotes") ? $("evalNotes").value.trim() : "",
            followupPlan: $("evalFollowupPlan") ? $("evalFollowupPlan").value.trim() : "",
            needs: $("evalNeeds") ? $("evalNeeds").value.trim() : "",
            finalRate: $("evalFinalRate") ? $("evalFinalRate").value : "⭐⭐⭐⭐⭐ ممتاز"
        };
        saveAll();
        showToast(t("msg_saved"), "success");
    });

    function exportColoredReport() {
        if (typeof XLSX === "undefined") {
            return showToast("⚠️ مكتبة الإكسيل غير موجودة", "err");
        }
        const wb = XLSX.utils.book_new();

        // --- الشيت الأول: الملخص المالي التحليلي ---
        let totalExpected = 0;
        let totalPaid = 0;
        let totalRemaining = 0;
        let debtors = [];

        const allStuds = Object.values(students);
        for (let i = 0; i < allStuds.length; i++) {
            let s = allStuds[i];
            if (s.name || s.paid > 0) {
                let sClass = s.className ? s.className.trim() : "";
                let req = (sClass && groupFees[sClass] !== undefined) ? toInt(groupFees[sClass]) : 0;
                let p = s.paid || 0;
                let remain = req > 0 ? (req - p) : 0;
                if (remain < 0) remain = 0;

                totalExpected += req;
                totalPaid += p;
                totalRemaining += remain;

                if (remain > 0) {
                    debtors.push({ id: s.id, name: s.name || "بدون اسم", className: sClass || "عام", remain: remain });
                }
            }
        }

        const finSummaryRows = [
            ["البند", "المبلغ (جنيه)"],
            ["إجمالي المطلوب (الكامل)", totalExpected],
            ["إجمالي المحصل (الفعلي)", totalPaid],
            ["إجمالي المتبقي (المديونيات)", totalRemaining]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(finSummaryRows);
        wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
        
        // تنسيق الألوان للملخص المالي (متوافق مع xlsx-js-style)
        if (wsSummary["A1"]) wsSummary["A1"].s = { fill: { fgColor: { rgb: "2B3648" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } };
        if (wsSummary["B1"]) wsSummary["B1"].s = { fill: { fgColor: { rgb: "2B3648" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } };
        
        if (wsSummary["A2"]) wsSummary["A2"].s = { font: { bold: true }, alignment: { horizontal: "right" } };
        if (wsSummary["B2"]) wsSummary["B2"].s = { font: { bold: true, color: { rgb: "2F6BFF" } }, alignment: { horizontal: "center" } };

        if (wsSummary["A3"]) wsSummary["A3"].s = { font: { bold: true }, alignment: { horizontal: "right" } };
        if (wsSummary["B3"]) wsSummary["B3"].s = { fill: { fgColor: { rgb: "D4EDDA" } }, font: { bold: true, color: { rgb: "155724" } }, alignment: { horizontal: "center" } };

        if (wsSummary["A4"]) wsSummary["A4"].s = { font: { bold: true }, alignment: { horizontal: "right" } };
        if (wsSummary["B4"]) wsSummary["B4"].s = { fill: { fgColor: { rgb: "F8D7DA" } }, font: { bold: true, color: { rgb: "721C24" } }, alignment: { horizontal: "center" } };

        XLSX.utils.book_append_sheet(wb, wsSummary, "الملخص المالي");

        // --- الشيت الثاني: قائمة الطلاب المديونين ---
        const debtRows = [["كود الطالب", "اسم الطالب", "الباقة", "المبلغ المتبقي عليه"]];
        for (let i = 0; i < debtors.length; i++) {
            debtRows.push([debtors[i].id, debtors[i].name, debtors[i].className, debtors[i].remain]);
        }
        const wsDebts = XLSX.utils.aoa_to_sheet(debtRows);
        wsDebts["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
        
        // تنسيق عناوين قائمة المديونيات
        const debtHeaders = ["A1", "B1", "C1", "D1"];
        for (let h = 0; h < debtHeaders.length; h++) {
            if (wsDebts[debtHeaders[h]]) wsDebts[debtHeaders[h]].s = { fill: { fgColor: { rgb: "721C24" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } };
        }
        for (let r = 2; r <= debtRows.length; r++) {
            if (wsDebts["A" + r]) wsDebts["A" + r].s = { alignment: { horizontal: "center" } };
            if (wsDebts["B" + r]) wsDebts["B" + r].s = { font: { bold: true }, alignment: { horizontal: "right" } };
            if (wsDebts["C" + r]) wsDebts["C" + r].s = { alignment: { horizontal: "center" } };
            if (wsDebts["D" + r]) wsDebts["D" + r].s = { fill: { fgColor: { rgb: "F8D7DA" } }, font: { bold: true, color: { rgb: "721C24" } }, alignment: { horizontal: "center" } };
        }
        XLSX.utils.book_append_sheet(wb, wsDebts, "قائمة المديونيات");

        // --- الشيت الثالث: تقرير التقييم الإداري ---
        const evalRows = [
            ["عنصر التقييم", "البيان / التفاصيل"],
            ["اسم السنتر", evalData.centerName || ""],
            ["المسؤول", evalData.manager || ""],
            ["الباقات", evalData.packages || ""],
            ["عدد الطلبة", evalData.studentsCount || ""],
            ["الكورسات الحالية", evalData.currentCourses || ""],
            ["فرص التعاون", evalData.collabOpps || ""],
            ["ملاحظات", evalData.notes || ""],
            ["خطة المتابعة", evalData.followupPlan || ""],
            ["احتياجات السنتر أو المقترحات", evalData.needs || ""],
            ["التقييم النهائي", evalData.finalRate || ""]
        ];
        const wsEval = XLSX.utils.aoa_to_sheet(evalRows);
        wsEval["!cols"] = [{ wch: 30 }, { wch: 50 }];
        
        if (wsEval["A1"]) wsEval["A1"].s = { fill: { fgColor: { rgb: "1F2937" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } };
        if (wsEval["B1"]) wsEval["B1"].s = { fill: { fgColor: { rgb: "1F2937" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, alignment: { horizontal: "center" } };
        
        for (let r = 2; r <= evalRows.length; r++) {
            if (wsEval["A" + r]) wsEval["A" + r].s = { font: { bold: true }, alignment: { horizontal: "right" } };
            if (wsEval["B" + r]) wsEval["B" + r].s = { alignment: { horizontal: "right", wrapText: true } };
        }
        XLSX.utils.book_append_sheet(wb, wsEval, "التقييم الإداري");

        XLSX.writeFile(wb, `تقرير_السنتر_التحليلي_${nowDateStr()}.xlsx`);
        showToast(currentLang === 'ar' ? "تم تصدير التقرير الملون بنجاح ✅" : "Colored Report Exported ✅", "success");
    }

    on("exportReportExcelBtn", "click", exportColoredReport);
    on("exportReportExcelBtnBottom", "click", exportColoredReport);

    // Tabs Listeners
    on("btnTabHome", "click", function() { window.switchTab('Home'); });
    on("btnTabStudents", "click", function() { window.switchTab('Students'); renderList(true); });
    on("btnTabSessionStudents", "click", function() { window.switchTab('SessionStudents'); renderSessionStudentsList(nowDateStr()); if($("sessFilterDate")) $("sessFilterDate").value = nowDateStr(); });
    on("btnTabRevenue", "click", function() { window.switchTab('Revenue'); renderCharts(); updateFinanceSummary(); });
    on("btnTabReports", "click", function() { window.switchTab('Reports'); renderReportsPage(); });
    on("btnTabAdmin", "click", function() { window.switchTab('Admin'); });
    on("btnTabSyllabus", "click", function() { window.switchTab('Syllabus'); renderSyllabus(); });
    on("btnTabBooklets", "click", function() { window.switchTab('Booklets'); renderBookletsStock(); });
    on("btnTabMarketing", "click", function() { window.switchTab('Marketing'); populateMarketingGroups(); filterCampaignTarget(); });

    // === SESSION STUDENTS FUNCTIONS ===
    window.renderSessionStudentsList = function(d) {
        const slist = $("sessStudentsList"); if(!slist) return;
        let arr = sessionStudentsByDate[d] || [];
        let count = arr.length;
        let totalRev = 0;
        let h = "";
        for(let i=0; i<arr.length; i++) {
            let item = arr[i];
            totalRev += toInt(item.amount);
            let mBadge = item.method === "instapay" ? "📱 إنستاباي" : (item.method === "wallet" ? "🟢 فودافون كاش/محفظة" : "💵 كاش");
            let badgeBg = item.method === "instapay" ? "#e3f2fd" : (item.method === "wallet" ? "#e8f5e9" : "#eef2f5");
            let badgeColor = item.method === "instapay" ? "#0288d1" : (item.method === "wallet" ? "#2e7d32" : "#333");

            h += `
            <div class="item flexBetween" style="margin-bottom:10px; padding:12px; background:var(--bg-surface); border:1px solid var(--border); border-radius:8px;">
                <div>
                    <b>${item.name}</b> <span class="badge" style="background:#eee; color:#333;">${item.className || "عام"}</span>
                    <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-size:0.8em; margin-inline-start:5px;">${mBadge}</span>
                    <div style="font-size:0.8em; color:var(--text-secondary); margin-top:4px;">⏰ ${item.timestamp || ""} ${item.phone ? `| 📞 ${item.phone}` : ""}</div>
                </div>
                <div class="row" style="width:auto; gap:10px;">
                    <span style="color:var(--success); font-weight:bold; font-size:1.1em;">+ ${item.amount} ج</span>
                    ${item.phone ? `<button class="btn success smallBtn iconOnly" title="مراسلة واتساب" onclick="window.open('https://wa.me/20${item.phone}', '_blank')">💬</button>` : ""}
                    <button class="btn danger smallBtn iconOnly delete-sess-btn" data-date="${d}" data-index="${i}" title="حذف وإلغاء الدفعة">🗑️</button>
                </div>
            </div>`;
        }

        if(count === 0) h = `<div class="mutedCenter">لا يوجد طلاب مسجلين بالحصة لهذا اليوم</div>`;
        slist.innerHTML = h;

        if($("sessCountBadge")) $("sessCountBadge").textContent = count;
        if($("sessRevenueBadge")) $("sessRevenueBadge").textContent = totalRev;

        document.querySelectorAll(".delete-sess-btn").forEach(btn => {
            btn.onclick = function() {
                let dt = this.getAttribute("data-date");
                let idx = toInt(this.getAttribute("data-index"));
                if(confirm("⚠️ متأكد من حذف وإلغاء حضور هذا الطالب المالي لليوم؟")) {
                    let delItem = sessionStudentsByDate[dt][idx];
                    revenueByDate[dt] = Math.max(0, (revenueByDate[dt] || 0) - toInt(delItem.amount));
                    sessionStudentsByDate[dt].splice(idx, 1);
                    saveAll();
                    renderSessionStudentsList(dt);
                    showToast("تم إلغاء تسجيل الحضور والمبلغ 🗑️");
                }
            };
        });
    };

    on("saveSessionStudentBtn", "click", function() {
        let name = $("sessStName") ? $("sessStName").value.trim() : "";
        let phone = $("sessStPhone") ? $("sessStPhone").value.trim() : "";
        let className = $("sessStClass") ? $("sessStClass").value : "حصة فردية";
        let amount = $("sessStAmount") ? toInt($("sessStAmount").value) : 0;
        let method = $("sessStMethod") ? $("sessStMethod").value : "cash";

        if(!name || amount <= 0) {
            showToast("⚠️ يرجى إدخال اسم الطالب والمبلغ بشكل صحيح", "warning");
            return;
        }

        const today = nowDateStr();
        if(!sessionStudentsByDate[today]) sessionStudentsByDate[today] = [];

        let record = {
            id: Date.now(),
            name: name,
            phone: phone,
            className: className,
            amount: amount,
            method: method,
            timestamp: new Date().toLocaleTimeString()
        };

        sessionStudentsByDate[today].push(record);
        revenueByDate[today] = (revenueByDate[today] || 0) + amount;

        saveAll();
        renderSessionStudentsList(today);
        showToast("تم تسجيل حضور الحصة وتحصيل المبلغ بنجاح ✅", "success");
        playSound("success");

        if($("sessStName")) $("sessStName").value = "";
        if($("sessStPhone")) $("sessStPhone").value = "";
        if($("sessStAmount")) $("sessStAmount").value = "";

        if(phone) {
            let centerMgr = evalData.manager || "إدارة السنتر";
            let mName = method === "instapay" ? "إنستاباي 📱" : (method === "wallet" ? "فودافون كاش 🟢" : "كاش 💵");
            let msg = `مرحباً ${name}،\nتم تسجيل حضورك بنجاح لحصة اليوم (${className}) ✅\nالمبلغ المدفوع: ${amount} ج (${mName}).\n\nمع تحيات: أ/ ${centerMgr}`;
            window.open(`https://wa.me/20${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
    });

    on("sessFilterDate", "change", function(e) {
        renderSessionStudentsList(e.target.value);
    });

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
                        
                        let m = s.payments[j].method || "cash";
                        let mBadge = "💵 كاش";
                        let badgeBg = "#eef2f5"; let badgeColor = "#333";
                        if (m === "instapay") { mBadge = "📱 إنستاباي"; badgeBg = "#e3f2fd"; badgeColor = "#0288d1"; }
                        if (m === "wallet") { mBadge = "🟢 فودافون كاش/محفظة"; badgeBg = "#e8f5e9"; badgeColor = "#2e7d32"; }

                        html += `
                        <div class="item flexBetween" style="margin-bottom:8px; cursor:pointer;" onclick="document.getElementById('revenueModal').classList.add('hidden'); window.extOpen('${s.id}')">
                            <div>
                                <b>${s.name}</b> (#${s.id}) <span class="badge" style="background:#eee; color:#333;">${sClass}</span>
                                <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-size:0.8em; margin-inline-start:5px;">${mBadge}</span>
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

        let sArr = sessionStudentsByDate[today] || [];
        for(let i=0; i<sArr.length; i++) {
            let item = sArr[i];
            let mBadge = item.method === "instapay" ? "📱 إنستاباي" : (item.method === "wallet" ? "🟢 فودافون كاش/محفظة" : "💵 كاش");
            let badgeBg = item.method === "instapay" ? "#e3f2fd" : (item.method === "wallet" ? "#e8f5e9" : "#eef2f5");
            let badgeColor = item.method === "instapay" ? "#0288d1" : (item.method === "wallet" ? "#2e7d32" : "#333");

            html += `
            <div class="item flexBetween" style="margin-bottom:8px; cursor:pointer;" onclick="document.getElementById('revenueModal').classList.add('hidden'); window.switchTab('SessionStudents'); if($('sessFilterDate')) $('sessFilterDate').value='${today}'; renderSessionStudentsList('${today}');">
                <div>
                    <b>${item.name}</b> <span class="badge" style="background:#fff3e0; color:#e65100;">طالب حصة 🎟️</span> <span class="badge" style="background:#eee; color:#333;">${item.className || "عام"}</span>
                    <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-size:0.8em; margin-inline-start:5px;">${mBadge}</span>
                </div>
                <div style="text-align:left;">
                    <span style="color:var(--success); font-weight:bold;">+ ${item.amount} ج</span><br>
                    <span style="font-size:11px; color:#666;">دفع فوري</span>
                </div>
            </div>`;
            count++;
        }
        
        if(count === 0) html = `<div class="mutedCenter">${t("txt_no_rev")}</div>`;
        
        if($("revenueModalBody")) $("revenueModalBody").innerHTML = html;
        if($("revenueModal")) $("revenueModal").classList.remove("hidden");
    });

    // === GLOBAL BARCODE SCANNER LISTENER ===
    let barcodeBuffer = "";
    let barcodeTimer = null;
    document.addEventListener("keydown", function(e) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
            return;
        }
        if (e.key === "Enter") {
            if (barcodeBuffer.length > 0) {
                let scannedId = toInt(barcodeBuffer);
                barcodeBuffer = "";
                clearTimeout(barcodeTimer);
                if (scannedId && students[String(scannedId)]) {
                    window.switchTab('Home');
                    let res = addAttendance(scannedId, nowDateStr());
                    if (res.ok) playSound("pop"); else playSound("error");
                    showToast(res.msg, res.ok ? "success" : "warning");
                    updateStudentUI(scannedId);
                    updateTopStats();
                } else if (scannedId) {
                    showToast("الطالب غير مسجل: " + scannedId, "err");
                    showFullscreenFeedback(false, false);
                }
            }
        } else if (!isNaN(e.key) && e.key.trim() !== "") {
            barcodeBuffer += e.key;
            clearTimeout(barcodeTimer);
            barcodeTimer = setTimeout(() => { barcodeBuffer = ""; }, 100);
        }
    });

    // === SIDEBAR & THEME TOGGLE LISTENERS ===
    on("topbarThemeToggle", "click", function() {
        var current = localStorage.getItem(K_THEME) || "dark";
        switchThemeWithAnimation(current === "dark" ? "light" : "dark");
    });

    on("sidebarCollapseBtn", "click", function() {
        var shell = $("appBox");
        if(shell) shell.classList.toggle("sidebar-collapsed");
    });

    on("mobileSidebarToggle", "click", function() {
        var sidebar = $("sidebarNav");
        if(sidebar && sidebar.classList.contains("mobile-open")) {
            closeMobileSidebar(false);
        } else {
            openMobileSidebar();
        }
    });

    on("sidebarOverlay", "click", function() {
        closeMobileSidebar(false);
    });

    // === SIDEBAR ACCORDION LOGIC ===
    window.toggleNavGroup = function(btn) {
        const group = btn.closest('.nav-group');
        if (group) {
            const isCollapsed = group.classList.contains('collapsed');
            document.querySelectorAll('.nav-group').forEach(g => g.classList.add('collapsed'));
            if (isCollapsed) {
                group.classList.remove('collapsed');
            }
        }
    };

    // Auto-expand the accordion group containing the active tab on initial load
    const activeNavItem = document.querySelector('.sidebar-menu .nav-item.active');
    if (activeNavItem) {
        const activeGroup = activeNavItem.closest('.nav-group');
        if (activeGroup) {
            document.querySelectorAll('.nav-group').forEach(g => g.classList.add('collapsed'));
            activeGroup.classList.remove('collapsed');
        }
    }

    // ==========================================
    // === BOOKLETS STOCK MANAGEMENT ===
    // ==========================================
    window.renderBookletsStock = function() {
        const blist = $("bookletsStockList"); if(!blist) return;
        let keys = Object.keys(bookletsStock);
        let totalTypes = keys.length;
        let totalReceived = 0;
        let totalSold = 0;
        let totalRemain = 0;
        let totalRevenue = 0;
        
        let h = "";
        for(let i = 0; i < keys.length; i++) {
            let id = keys[i];
            let b = bookletsStock[id];
            let qty = toInt(b.qty);
            let price = toInt(b.price);
            let sold = toInt(b.sold);
            let remain = qty - sold;
            let rev = sold * price;
            
            totalReceived += qty;
            totalSold += sold;
            totalRemain += remain;
            totalRevenue += rev;
            
            h += `
            <div class="card item-card flexBetween wrap" style="background: var(--bg-inset); border: 1px solid var(--border); padding: 18px; border-radius: 10px; margin-bottom: 12px; gap: 15px;">
                <div style="flex: 1; min-width: 220px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.5em;">📘</span>
                        <h4 style="margin:0; color:var(--text); font-size:1.2em;">${b.name}</h4>
                    </div>
                    <div style="font-size:0.9em; color:var(--text-secondary); margin-top:8px; display:flex; gap:15px; flex-wrap:wrap;">
                        <span>الكمية الكلية: <b>${qty}</b></span>
                        <span>سعر النسخة: <b>${price} ج</b></span>
                        <span style="color:#10b981;">المباع: <b>${sold}</b></span>
                        <span style="color:#f59e0b;">المخزون المتبقي: <b>${remain}</b></span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="background:var(--bg-surface); padding:8px 15px; border-radius:8px; border:1px solid var(--border); text-align:center;">
                        <span style="font-size:0.8em; color:var(--text-secondary); display:block;">عائد المذكرة</span>
                        <strong style="color:var(--primary); font-size:1.2em;">${rev} ج</strong>
                    </div>
                    <button class="btn success" style="padding:10px 18px; font-weight:bold; font-size:1.05em; display:flex; align-items:center; gap:5px;" onclick="sellBookletCopy('${id}')">
                        🛒 بيع نسخة (+1)
                    </button>
                    <button class="btn warning smallBtn" title="إرجاع نسخة (-1)" onclick="returnBookletCopy('${id}')">➖</button>
                    <button class="btn primary smallBtn" title="تعديل العدد الكلي المستلم" onclick="editBookletQty('${id}')">✏️</button>
                    <button class="btn danger smallBtn" title="حذف المذكرة" onclick="deleteBooklet('${id}')">🗑️</button>
                </div>
            </div>`;
        }
        
        if (keys.length === 0) {
            h = `<div class="mutedCenter" style="padding: 30px;">لا توجد مذكرات أو ورق مسجل بالمخزون حالياً .. أضف مذكرة جديدة بالترويسة أعلاه 📚</div>`;
        }
        
        blist.innerHTML = h;
        
        if($("statTotalBookletTypes")) $("statTotalBookletTypes").textContent = totalTypes;
        if($("statTotalCopiesReceived")) $("statTotalCopiesReceived").textContent = totalReceived;
        if($("statTotalCopiesSold")) $("statTotalCopiesSold").textContent = totalSold;
        if($("statTotalCopiesRemain")) $("statTotalCopiesRemain").textContent = totalRemain;
        if($("statTotalBookletsRevenue")) $("statTotalBookletsRevenue").textContent = totalRevenue + " ج";
    };

    on("btnSaveBooklet", "click", function() {
        let name = $("bookletNameInp") ? $("bookletNameInp").value.trim() : "";
        let qty = $("bookletQtyInp") ? toInt($("bookletQtyInp").value) : 0;
        let price = $("bookletPriceInp") ? toInt($("bookletPriceInp").value) : 0;
        
        if (!name) { showToast("يرجى إدخال اسم المذكرة أو الورق", "err"); return; }
        if (qty <= 0) { showToast("يرجى إدخال عدد النسخ المستلمة", "err"); return; }
        
        let id = "b_" + Date.now();
        bookletsStock[id] = { name: name, qty: qty, price: price, sold: 0 };
        saveAll();
        renderBookletsStock();
        
        if($("bookletNameInp")) $("bookletNameInp").value = "";
        if($("bookletQtyInp")) $("bookletQtyInp").value = "";
        if($("bookletPriceInp")) $("bookletPriceInp").value = "";
        showToast("تم استلام وإضافة المذكرة للمخزون بنجاح ✅", "success");
        playSound("beep");
    });

    window.sellBookletCopy = function(id) {
        if (!bookletsStock[id]) return;
        let b = bookletsStock[id];
        if (b.sold >= b.qty) {
            showToast("⚠️ انتهى مخزون هذه المذكرة، يرجى تعديل العدد الكلي إذا قمت بطباعة نسخ إضافية.", "err");
            playSound("error");
            return;
        }
        b.sold += 1;
        
        // تسجيل العائد في إيرادات اليوم التلقائية بالخزينة كاش
        let today = nowDateStr();
        if(!revenueByDate[today]) revenueByDate[today] = [];
        revenueByDate[today].push({
            stId: `مبيعات مذكرات (#${b.name})`,
            stName: `بيع نسخة مذكرة: ${b.name}`,
            amount: b.price,
            method: "cash",
            ts: Date.now()
        });
        
        saveAll();
        renderBookletsStock();
        showToast(`تم بيع نسخة من ${b.name} وإضافة ${b.price} ج للخزينة كاش ✅`, "success");
        playSound("beep");
    };

    window.returnBookletCopy = function(id) {
        if (!bookletsStock[id]) return;
        let b = bookletsStock[id];
        if (b.sold <= 0) {
            showToast("لم يتم بيع أي نسخة من هذه المذكرة لإرجاعها", "err");
            return;
        }
        b.sold -= 1;
        saveAll();
        renderBookletsStock();
        showToast(`تم إرجاع نسخة من ${b.name} بنجاح ➖`, "warning");
    };

    window.editBookletQty = function(id) {
        if (!bookletsStock[id]) return;
        let b = bookletsStock[id];
        let nQty = prompt(`تعديل العدد الكلي المستلم لمذكرة (${b.name}):`, b.qty);
        if (nQty !== null) {
            let q = toInt(nQty);
            if (q >= 0) {
                b.qty = q;
                saveAll();
                renderBookletsStock();
                showToast("تم تحديث العدد الكلي بنجاح ✅");
            }
        }
    };

    window.deleteBooklet = function(id) {
        if (!bookletsStock[id]) return;
        let b = bookletsStock[id];
        if (confirm(`هل أنت متأكد من حذف مذكرة (${b.name}) من قائمة الجرد؟`)) {
            delete bookletsStock[id];
            saveAll();
            renderBookletsStock();
            showToast("تم حذف المذكرة من قائمة المخزون 🗑️");
        }
    };

    // ==========================================
    // === MARKETING CAMPAIGNS MANAGEMENT ===
    // ==========================================
    window.populateMarketingGroups = function() {
        const sel = $("marketingTargetGroupSelect"); if(!sel) return;
        let html = `<option value="">-- اختر الباقة / المجموعة --</option>`;
        let keys = Object.keys(groupFees);
        for(let i=0; i<keys.length; i++) {
            html += `<option value="${keys[i]}">${keys[i]} (${groupFees[keys[i]]} ج)</option>`;
        }
        sel.innerHTML = html;
    };

    on("marketingTargetFilter", "change", function() {
        let val = this.value;
        let gContainer = $("marketingGroupSelectContainer");
        if(gContainer) {
            gContainer.style.display = (val === "groups") ? "block" : "none";
        }
        let msgInp = $("marketingMsgBody");
        if (val === "debtors" && msgInp) {
            if (!msgInp.value || msgInp.value.trim() === "") {
                msgInp.value = "مساء الخير أ/ [اسم_الطالب]،\nنتمنى أن تكون بكل خير.\nحابة أفكّرك بأن الرصيد المتبقي من رسوم الكورس هو [المبلغ] ج، ونستأذنك في استكماله خلال حضورك في أقرب محاضرة لضمان استمرار الخدمة بسلاسة.\nشكراً جداً لتعاونك معنا 🤍";
            }
        }
    });

    let currentCampaignList = [];

    window.filterCampaignTarget = function() {
        let filter = $("marketingTargetFilter") ? $("marketingTargetFilter").value : "all";
        let grp = $("marketingTargetGroupSelect") ? $("marketingTargetGroupSelect").value : "";
        
        let list = [];
        let sKeys = Object.keys(students);
        
        if (filter === "session") {
            // تجميع أرقام طلاب الحصة الفورية لليوم أو لكل الأيام
            let sDates = Object.keys(sessionStudentsByDate);
            let seenPhones = {};
            for(let d=0; d<sDates.length; d++) {
                let arr = sessionStudentsByDate[sDates[d]] || [];
                for(let k=0; k<arr.length; k++) {
                    let sess = arr[k];
                    if (sess.phone && sess.phone.trim() !== "" && !seenPhones[sess.phone]) {
                        seenPhones[sess.phone] = true;
                        list.push({ name: sess.name || "طالب حصة", phone: sess.phone, desc: `طالب حصة (${sDates[d]})`, remain: 0 });
                    }
                }
            }
        } else {
            for(let i=0; i<sKeys.length; i++) {
                let st = students[sKeys[i]];
                if (!st || !st.name) continue;
                if (!st.phone || st.phone.trim() === "") continue;
                
                let p = st.phone.trim();
                let stClassName = st.className ? st.className.trim() : "";
                let req = (stClassName && groupFees[stClassName] !== undefined) ? toInt(groupFees[stClassName]) : 0;
                let paid = st.paid || 0;
                let remain = req - paid;
                
                if (filter === "all") {
                    list.push({ name: st.name, phone: p, desc: `باقة: ${st.className || "عام"}`, remain: remain > 0 ? remain : 0 });
                } else if (filter === "groups") {
                    if (grp && stClassName === grp) {
                        list.push({ name: st.name, phone: p, desc: `باقة: ${grp}`, remain: remain > 0 ? remain : 0 });
                    }
                } else if (filter === "vip") {
                    if (st.rank === "vip") {
                        list.push({ name: st.name, phone: p, desc: `⭐ VIP`, remain: remain > 0 ? remain : 0 });
                    }
                } else if (filter === "debtors") {
                    if (req > 0 && remain > 0) {
                        list.push({ name: st.name, phone: p, desc: `متبقي عليه: ${remain} ج`, remain: remain });
                    }
                }
            }
        }
        
        currentCampaignList = list;
        
        const clist = $("campaignNumbersList"); if(!clist) return;
        if($("campaignTargetCount")) $("campaignTargetCount").textContent = list.length;
        
        let msgBody = $("marketingMsgBody") ? $("marketingMsgBody").value.trim() : "";
        
        let h = "";
        for(let i=0; i<list.length; i++) {
            let item = list[i];
            let cleanPhone = item.phone.startsWith("0") ? "+2" + item.phone : "+20" + item.phone;
            
            let customMsg = msgBody;
            if (customMsg) {
                customMsg = customMsg.replace(/\[اسم_الطالب\]/g, item.name);
                customMsg = customMsg.replace(/\[المبلغ\]/g, item.remain || 0);
            } else {
                customMsg = `مرحباً بك أ/ ${item.name}،\nيرجى التواصل مع إدارة السنتر.`;
            }
            
            let waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMsg)}`;
            
            h += `
            <div class="card item-card flexBetween wrap" style="background: var(--bg-inset); border: 1px solid var(--border); padding: 15px; border-radius: 10px; margin-bottom: 10px; gap: 15px;">
                <div>
                    <h4 style="margin:0; color:var(--text); font-size:1.1em;">👤 ${item.name}</h4>
                    <div style="font-size:0.9em; color:var(--text-secondary); margin-top:5px;">
                        <span>📱 ${item.phone}</span> | <span style="color:var(--primary);">${item.desc}</span>
                    </div>
                </div>
                <a href="${waUrl}" target="_blank" class="btn success" style="padding:8px 18px; text-decoration:none; font-weight:bold; display:flex; align-items:center; gap:5px;">
                    💬 مراسلة واتساب
                </a>
            </div>`;
        }
        
        if (list.length === 0) {
            h = `<div class="mutedCenter" style="padding:30px;">لا يوجد أرقام هواتف مسجلة تطابق الشريحة المحددة 🎯</div>`;
        }
        clist.innerHTML = h;
    };

    on("btnFilterCampaign", "click", function() {
        filterCampaignTarget();
        showToast("تم تصفية الأرقام المستهدفة بنجاح 🔍");
    });

    on("btnCopyCampaignNumbers", "click", function() {
        if (currentCampaignList.length === 0) {
            showToast("قائمة الأرقام فارغة، قم بتصفية داتا الطلاب أولاً.", "err");
            return;
        }
        let arr = currentCampaignList.map(item => item.phone);
        let textToCopy = arr.join("\n");
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(`تم نسخ ${arr.length} رقم موبايل بنجاح 📋 (جاهز للصق في برامج الإرسال)`, "success");
            playSound("beep");
        }).catch(() => {
            showToast("فشل النسخ المباشر، يرجى تكرار المحاولة", "err");
        });
    });

    // ==========================================
    // 17.9. SMART ANTI-BAN AUTO BROADCASTER
    // ==========================================
    let broadcastTimer = null;
    let broadcastCurrentIndex = 0;
    let broadcastIntervalSeconds = 10;
    let broadcastCurrentCount = 10;
    let broadcastIsPaused = false;

    function startNextBroadcastWindow() {
        if (broadcastCurrentIndex >= currentCampaignList.length) {
            endBroadcast(true);
            return;
        }

        let item = currentCampaignList[broadcastCurrentIndex];
        let msgBody = $("marketingMsgBody") ? $("marketingMsgBody").value.trim() : "";
        let customMsg = msgBody;
        if (customMsg) {
            customMsg = customMsg.replace(/\[اسم_الطالب\]/g, item.name);
            customMsg = customMsg.replace(/\[المبلغ\]/g, item.remain || 0);
        } else {
            customMsg = `مرحباً بك أ/ ${item.name}،\nيرجى التواصل مع إدارة السنتر.`;
        }

        let cleanPhone = item.phone.startsWith("0") ? "+2" + item.phone : "+20" + item.phone;
        let waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMsg)}`;

        // فتح نافذة المحادثة
        window.open(waUrl, '_blank');

        broadcastCurrentIndex++;
        if ($("broadcastProgressText")) $("broadcastProgressText").textContent = `${broadcastCurrentIndex} / ${currentCampaignList.length}`;
        if ($("broadcastCurrentStudentInfo")) {
            $("broadcastCurrentStudentInfo").innerHTML = `✨ جاري التواصل مع: <b>${item.name}</b> (📱 ${item.phone}) <br><span style="font-size:0.85em; color:#94a3b8; font-weight:normal;">💡 اضغط إرسال (Enter) في نافذة الواتساب المفتوحة.. النافذة التالية تفتح قريباً.</span>`;
        }

        let pct = (broadcastCurrentIndex / currentCampaignList.length) * 100;
        if ($("broadcastProgressBar")) $("broadcastProgressBar").style.width = pct + "%";

        if (broadcastCurrentIndex >= currentCampaignList.length) {
            setTimeout(() => endBroadcast(true), 3000);
            return;
        }

        // بدء العد التنازلي للنافذة التالية
        broadcastCurrentCount = broadcastIntervalSeconds;
        if ($("broadcastTimerText")) $("broadcastTimerText").textContent = broadcastCurrentCount;
        
        broadcastTimer = setInterval(() => {
            if (broadcastIsPaused) return;
            broadcastCurrentCount--;
            if ($("broadcastTimerText")) $("broadcastTimerText").textContent = broadcastCurrentCount;
            if (broadcastCurrentCount <= 0) {
                clearInterval(broadcastTimer);
                startNextBroadcastWindow();
            }
        }, 1000);
    }

    function endBroadcast(completed) {
        if (broadcastTimer) clearInterval(broadcastTimer);
        broadcastTimer = null;
        broadcastIsPaused = false;
        if ($("btnPauseBroadcast")) $("btnPauseBroadcast").textContent = "⏸ إيقاف مؤقت";
        if ($("broadcastStatusTitle")) $("broadcastStatusTitle").textContent = completed ? "🎉 اكتمل البث التلقائي بنجاح" : "⏹ تم إنهاء البث التلقائي";
        if ($("broadcastStatusSub")) $("broadcastStatusSub").textContent = completed ? "تم فتح جميع المحادثات بنجاح وإرسال الإشعارات بدون التعرض لأي حظر." : "تم إيقاف عملية البث التلقائي بناءً على طلبك.";
        if ($("broadcastPulseIcon")) $("broadcastPulseIcon").style.animation = "none";
        if ($("broadcastCurrentStudentInfo")) $("broadcastCurrentStudentInfo").innerHTML = completed ? "✅ اكتملت المهمة بنجاح" : "تم الإيقاف";
        showToast(completed ? "اكتمل البث التلقائي الذكي لجميع الطلاب ✅" : "تم إيقاف البث التلقائي ⏹", completed ? "success" : "warning");
        playSound(completed ? "beep" : "error");
    }

    on("btnStartAutoBroadcast", "click", function() {
        if (currentCampaignList.length === 0) {
            showToast("⚠️ قائمة الأرقام فارغة، قم بتصفية داتا الطلاب أولاً.", "err");
            return;
        }
        if (broadcastTimer) clearInterval(broadcastTimer);
        
        broadcastCurrentIndex = 0;
        broadcastIsPaused = false;
        broadcastCurrentCount = broadcastIntervalSeconds;
        
        if ($("broadcastControllerPanel")) $("broadcastControllerPanel").classList.remove("hidden");
        if ($("broadcastStatusTitle")) $("broadcastStatusTitle").textContent = "🚀 جاري تشغيل البث التلقائي المضاد للحظر (Anti-Ban)...";
        if ($("broadcastStatusSub")) $("broadcastStatusSub").textContent = "سيتم فتح نوافذ المحادثات تباعاً بفاصل زمني آمن لحماية حسابك من الحظر (Anti-Ban).";
        if ($("broadcastPulseIcon")) $("broadcastPulseIcon").style.animation = "pulse 1.5s infinite";
        if ($("broadcastProgressText")) $("broadcastProgressText").textContent = `0 / ${currentCampaignList.length}`;
        if ($("broadcastProgressBar")) $("broadcastProgressBar").style.width = "0%";
        if ($("btnPauseBroadcast")) $("btnPauseBroadcast").textContent = "⏸ إيقاف مؤقت";

        showToast("🚀 بدء تشغيل البث التلقائي الآمن، يرجى السماح بالنوافذ المنبثقة (Pop-ups)", "success");
        playSound("beep");
        
        // البدء بالنافذة الأولى فوراً
        startNextBroadcastWindow();
    });

    on("btnPauseBroadcast", "click", function() {
        if (!broadcastTimer && !broadcastIsPaused) return;
        broadcastIsPaused = !broadcastIsPaused;
        if (broadcastIsPaused) {
            this.textContent = "▶ استئناف البث";
            if ($("broadcastStatusTitle")) $("broadcastStatusTitle").textContent = "⏸ البث التلقائي متوقف مؤقتاً...";
            if ($("broadcastPulseIcon")) $("broadcastPulseIcon").style.animation = "none";
            showToast("تم إيقاف البث مؤقتاً ⏸", "warning");
        } else {
            this.textContent = "⏸ إيقاف مؤقت";
            if ($("broadcastStatusTitle")) $("broadcastStatusTitle").textContent = "🚀 جاري تشغيل البث التلقائي المضاد للحظر (Anti-Ban)...";
            if ($("broadcastPulseIcon")) $("broadcastPulseIcon").style.animation = "pulse 1.5s infinite";
            showToast("تم استئناف البث التلقائي ▶", "success");
        }
    });

    on("btnStopBroadcast", "click", function() {
        endBroadcast(false);
    });

    // ==========================================
    // DAILY ADMINISTRATIVE HARD-LOCK SYSTEM
    // ==========================================
    function initDailyApprovalSystem() {
        const mgrSettingDailyApproval = document.getElementById("mgrSettingDailyApproval");
        const assistantHardLockOverlay = document.getElementById("assistantHardLockOverlay");
        const assistantHardLockTitle = document.getElementById("assistantHardLockTitle");
        const assistantHardLockMsg = document.getElementById("assistantHardLockMsg");
        const managerDailyApprovalWidget = document.getElementById("managerDailyApprovalWidget");
        const btnApproveDaily = document.getElementById("btnApproveDaily");
        const btnRejectDaily = document.getElementById("btnRejectDaily");
        const btnConfirmRejectDaily = document.getElementById("btnConfirmRejectDaily");
        const managerDailyRejectNoteContainer = document.getElementById("managerDailyRejectNoteContainer");
        const managerDailyRejectNote = document.getElementById("managerDailyRejectNote");

        if(!mgrSettingDailyApproval || !managerDailyApprovalWidget || !assistantHardLockOverlay) return;

        let dailyApprovalEnabled = false;
        let dailyStatusObj = null;

        // Auto-detect manager ID
        const getMid = () => localStorage.getItem("ca_manager_id") || window.CURRENT_MANAGER_ID;

        // 1. Listen to Settings Toggle State
        onValue(ref(database, `users/${getMid()}/settings/dailyApprovalEnabled`), (snap) => {
            dailyApprovalEnabled = snap.val() === true;
            if(window.CURRENT_ROLE === 'admin') {
                mgrSettingDailyApproval.checked = dailyApprovalEnabled;
                managerDailyApprovalWidget.classList.toggle("hidden", !dailyApprovalEnabled);
            }
            evaluateAssistantLock();
        });

        // 2. Listen to Daily Status
        onValue(ref(database, `users/${getMid()}/daily_status`), (snap) => {
            dailyStatusObj = snap.val() || { status: 'Pending', lastDate: '', managerNote: '' };
            evaluateAssistantLock();
        });

        // Manager Side Logic
        mgrSettingDailyApproval.addEventListener("change", async (e) => {
            const isEnabled = e.target.checked;
            try {
                await set(ref(database, `users/${getMid()}/settings/dailyApprovalEnabled`), isEnabled);
                if (typeof showToast === "function") showToast(isEnabled ? "تم تفعيل الاعتماد اليومي" : "تم إيقاف الاعتماد اليومي", "success");
                if (isEnabled) {
                    await update(ref(database, `users/${getMid()}/daily_status`), {
                        status: 'Pending',
                        managerNote: '',
                        lastDate: nowDateStr()
                    });
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === "function") showToast("حدث خطأ أثناء حفظ الإعداد", "err");
            }
        });

        btnApproveDaily.addEventListener("click", async () => {
            try {
                await set(ref(database, `users/${getMid()}/daily_status`), {
                    status: 'Approved',
                    managerNote: '',
                    lastDate: nowDateStr()
                });
                managerDailyRejectNoteContainer.classList.add("hidden");
                if (typeof showToast === "function") showToast("تم اعتماد تقرير الأمس بنجاح. النظام مفتوح الآن للمساعدين.", "success");
            } catch (err) {
                console.error(err);
            }
        });

        btnRejectDaily.addEventListener("click", () => {
            managerDailyRejectNoteContainer.classList.remove("hidden");
        });

        btnConfirmRejectDaily.addEventListener("click", async () => {
            const note = managerDailyRejectNote.value.trim();
            if(!note) {
                if (typeof showToast === "function") showToast("برجاء كتابة سبب الرفض", "err");
                return;
            }
            try {
                await set(ref(database, `users/${getMid()}/daily_status`), {
                    status: 'Rejected',
                    managerNote: note,
                    lastDate: nowDateStr()
                });
                managerDailyRejectNoteContainer.classList.add("hidden");
                managerDailyRejectNote.value = '';
                if (typeof showToast === "function") showToast("تم إيقاف النظام وإرسال سبب الرفض للمساعدين.", "warning");
            } catch (err) {
                console.error(err);
            }
        });

        // Assistant Side Logic
        function evaluateAssistantLock() {
            if (window.CURRENT_ROLE === 'admin') {
                assistantHardLockOverlay.classList.add("hidden");
                return;
            }

            if (!dailyApprovalEnabled) {
                assistantHardLockOverlay.classList.add("hidden");
                return;
            }

            // Auto-reset logic: if date is different, lock it
            let effectiveStatus = dailyStatusObj?.status || 'Pending';
            const note = dailyStatusObj?.managerNote || '';
            
            if (dailyStatusObj?.lastDate !== nowDateStr()) {
                effectiveStatus = 'Pending';
            }

            if (effectiveStatus === 'Approved') {
                assistantHardLockOverlay.classList.add("hidden");
            } else {
                assistantHardLockOverlay.classList.remove("hidden");
                const contentBox = document.getElementById("assistantHardLockContent");
                
                if (effectiveStatus === 'Rejected') {
                    contentBox.style.borderColor = "var(--danger)";
                    assistantHardLockTitle.textContent = "تم إيقاف النظام (مرفوض)";
                    assistantHardLockTitle.style.color = "var(--danger)";
                    assistantHardLockMsg.innerHTML = `تم رفض تقرير الأمس من الإدارة بسبب:<br><strong style="color:var(--danger); display:block; margin-top:10px;">"${note}"</strong>`;
                } else {
                    contentBox.style.borderColor = "var(--warning)";
                    assistantHardLockTitle.textContent = "النظام مغلق مؤقتاً";
                    assistantHardLockTitle.style.color = "var(--warning)";
                    assistantHardLockMsg.innerHTML = "في انتظار اعتماد الإدارة لتقرير الأمس لبدء العمل.";
                }
            }
        }
    }

    // ==========================================
    // 25. NOTICE BOARD (Global Announcements)
    // ==========================================
    function initNoticeBoardSystem() {
        const getMid = () => window.CURRENT_MANAGER_ID || localStorage.getItem("ca_manager_id");
        
        const btnSendBroadcast = $("btnSendBroadcast");
        const broadcastMsgInput = $("broadcastMessageInput");
        const managerBroadcastHistory = $("managerBroadcastHistory");
        
        const btnNoticeBoard = $("btnNoticeBoard");
        const noticeBadge = $("noticeBadge");
        const noticeBoardModal = $("noticeBoardModal");
        const closeNoticeBoardBtn = $("closeNoticeBoardBtn");
        const noticeBoardList = $("noticeBoardList");
        
        let localAnnouncements = [];
        let currentAsstId = localStorage.getItem("ca_auth_v2") || "unknown_assistant";

        // 1. Send Broadcast (Manager Only)
        if (btnSendBroadcast) {
            btnSendBroadcast.addEventListener("click", async () => {
                const msg = broadcastMsgInput.value.trim();
                if(!msg) return showToast(currentLang==='ar' ? "أدخل نص الإعلان" : "Enter message", "warning");
                
                const mid = getMid();
                if(!mid) return;
                
                const pushId = Date.now().toString(); // simple ID
                const payload = {
                    id: pushId,
                    message: msg,
                    timestamp: Date.now(),
                    readBy: {}
                };
                
                try {
                    btnSendBroadcast.disabled = true;
                    btnSendBroadcast.innerHTML = "جاري الإرسال...";
                    await set(ref(database, `users/${mid}/global_announcements/${pushId}`), payload);
                    broadcastMsgInput.value = '';
                    showToast(currentLang==='ar' ? "تم إرسال الإعلان لجميع المساعدين" : "Broadcast sent!", "success");
                } catch(e) {
                    console.error(e);
                    showToast(currentLang==='ar' ? "فشل الإرسال" : "Failed to send", "err");
                } finally {
                    btnSendBroadcast.disabled = false;
                    btnSendBroadcast.innerHTML = "📢 نشر الإعلان";
                }
            });
        }
        
        // 2. Listen to Announcements
        // Need to wait until we know if it's manager or assistant
        setTimeout(() => {
            const mid = getMid();
            if(!mid) return;
            
            onValue(ref(database, `users/${mid}/global_announcements`), (snap) => {
                localAnnouncements = [];
                let unreadCount = 0;
                const isManager = window.CURRENT_ROLE === 'admin';
                
                if(snap.exists()) {
                    const data = snap.val();
                    for(let key in data) {
                        localAnnouncements.push(data[key]);
                    }
                    localAnnouncements.sort((a,b) => b.timestamp - a.timestamp);
                }
                
                if (isManager && managerBroadcastHistory) {
                    renderManagerBroadcastHistory();
                }
                
                if (!isManager && btnNoticeBoard) {
                    btnNoticeBoard.style.display = 'inline-block';
                    localAnnouncements.forEach(ann => {
                        const reads = ann.readBy || {};
                        if (!reads[currentAsstId]) {
                            unreadCount++;
                        }
                    });
                    
                    if (unreadCount > 0) {
                        noticeBadge.classList.remove("hidden");
                        noticeBadge.textContent = unreadCount > 9 ? "+9" : unreadCount;
                    } else {
                        noticeBadge.classList.add("hidden");
                    }
                }
            });
        }, 1500); // give time for checkAuth() to set role
        
        // 3. Render Manager History
        function renderManagerBroadcastHistory() {
            if(!managerBroadcastHistory) return;
            managerBroadcastHistory.innerHTML = '';
            
            if(localAnnouncements.length === 0) {
                managerBroadcastHistory.innerHTML = '<div style="color:#777;">لا يوجد إعلانات سابقة.</div>';
                return;
            }
            
            const historyToShow = localAnnouncements.slice(0, 20);
            
            historyToShow.forEach(ann => {
                const div = document.createElement("div");
                div.style.cssText = "background:var(--bg-inset); padding:15px; border-radius:10px; border:1px solid var(--border);";
                
                const d = new Date(ann.timestamp);
                const readsCount = ann.readBy ? Object.keys(ann.readBy).length : 0;
                
                div.innerHTML = `
                    <div style="font-size:0.85em; color:var(--text-secondary); margin-bottom:5px;">🕒 ${d.toLocaleString()}</div>
                    <div style="font-weight:bold; margin-bottom:10px; color:var(--text-main);">${ann.message.replace(/\n/g, '<br>')}</div>
                    <div style="font-size:0.85em; color:var(--primary);">👁️ تمت القراءة بواسطة: ${readsCount} مساعد</div>
                `;
                managerBroadcastHistory.appendChild(div);
            });
        }
        
        // 4. Render Assistant Modal
        if (btnNoticeBoard) {
            btnNoticeBoard.addEventListener("click", () => {
                renderAssistantNoticeBoard();
                noticeBoardModal.classList.remove("hidden");
            });
        }
        if (closeNoticeBoardBtn) {
            closeNoticeBoardBtn.addEventListener("click", () => {
                noticeBoardModal.classList.add("hidden");
            });
        }
        
        async function renderAssistantNoticeBoard() {
            if(!noticeBoardList) return;
            noticeBoardList.innerHTML = '';
            
            if(localAnnouncements.length === 0) {
                noticeBoardList.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">لا توجد إعلانات حالياً.</div>';
                return;
            }
            
            const listToShow = localAnnouncements.slice(0, 10);
            
            for(const ann of listToShow) {
                const reads = ann.readBy || {};
                const isRead = !!reads[currentAsstId];
                
                const div = document.createElement("div");
                div.style.cssText = `background: ${isRead ? 'var(--bg-inset)' : 'var(--bg-surface)'}; padding:15px; border-radius:10px; border:1px solid var(--border); opacity: ${isRead ? '0.7' : '1'}; position: relative;`;
                
                const d = new Date(ann.timestamp);
                
                // the red dot for unread
                const dotHtml = isRead ? '' : `<div style="position:absolute; top:15px; left:15px; width:10px; height:10px; border-radius:50%; background:var(--danger);"></div>`;
                
                div.innerHTML = `
                    ${dotHtml}
                    <div style="font-size:0.85em; color:var(--text-secondary); margin-bottom:8px;">🕒 ${d.toLocaleString()}</div>
                    <div style="font-weight:bold; color:var(--text-main); line-height: 1.5; padding-left: ${!isRead ? '20px' : '0'}">${ann.message.replace(/\n/g, '<br>')}</div>
                `;
                
                noticeBoardList.appendChild(div);
                
                if (!isRead) {
                    try {
                        const mid = getMid();
                        if (mid) {
                            await update(ref(database, `users/${mid}/global_announcements/${ann.id}/readBy`), {
                                [currentAsstId]: true
                            });
                        }
                    } catch(e) { console.error("Error marking read", e); }
                }
            }
        }
    }

    // ==========================================
    // FORCE SYNC & MANUAL SYNC (with 12s timeout)
    // ==========================================
    async function syncWithFirebase() {
        if (syncInProgress) return;
        window.CURRENT_MANAGER_ID = window.CURRENT_MANAGER_ID || localStorage.getItem("ca_manager_id");
        if (!window.CURRENT_MANAGER_ID) {
            showToast("لا يوجد حساب مسجل للمزامنة.", "err");
            return;
        }

        if (!navigator.onLine || !isFirebaseConnected) {
            updateSyncUI('offline', 'غير متصل بالإنترنت');
            showToast("مفيش نت! يرجى التأكد من اتصالك بالإنترنت", "err");
            return;
        }
        
        syncInProgress = true;
        updateSyncUI('syncing', 'جاري المزامنة...');
        
        try {
            // Race between actual sync and a 12-second timeout
            const syncWork = (async () => {
                const snapshot = await get(child(ref(database), `users/${window.CURRENT_MANAGER_ID}`));
                
                if (snapshot.exists()) {
                    const remote = snapshot.val();
                    const remoteTimestamp = remote._lastModified || 0;
                    const localTimestamp = localTimestamps[K_STUDENTS] || 0;

                    if (!hasUnsavedChanges && localTimestamp >= remoteTimestamp) {
                        // Artificial delay so user sees the animation and feels the sync
                        await new Promise(r => setTimeout(r, 800));
                        updateSyncUI('online', 'متصل ومتزامن ✅');
                        showToast("كل البيانات متزامنة بالفعل ✅", "success");
                        return;
                    }

                    if (localTimestamp > remoteTimestamp) {
                        console.log("[Sync] Local is newer → Pushing");
                        const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
                        await update(dbRef, {
                            'students': students,
                            'attendance': attByDate,
                            'finances/revenue': revenueByDate,
                            'packages': groupFees,
                            'finances/expenses': expensesByDate,
                            'deletedStudents': deletedStudents,
                            'syllabus': syllabusData,
                            'evaluations': evalData,
                            'sessionStudents': sessionStudentsByDate,
                            'booklets': bookletsStock,
                            '_lastModified': Date.now()
                        });
                        showToast("تم رفع البيانات إلى السحابة ✅", "success");
                    } else {
                        console.log("[Sync] Server is newer → Pulling");
                        const remoteStudents = remote.students || {};
                        for (const id in remoteStudents) {
                            const remoteStudent = remoteStudents[id];
                            const localStudent = students[id];
                            if (!localStudent) {
                                students[id] = remoteStudent;
                            } else {
                                const rMod = remoteStudent.lastModified || 0;
                                const lMod = localStudent.lastModified || 0;
                                if (rMod > lMod) students[id] = remoteStudent;
                            }
                        }
                        attByDate = remote.attendance || attByDate;
                        revenueByDate = remote.finances?.revenue || revenueByDate;
                        expensesByDate = remote.finances?.expenses || expensesByDate;
                        groupFees = remote.packages || groupFees;
                        deletedStudents = remote.deletedStudents || deletedStudents;
                        syllabusData = remote.syllabus || syllabusData;
                        evalData = remote.evaluations || evalData;
                        sessionStudentsByDate = remote.sessionStudents || sessionStudentsByDate;
                        bookletsStock = remote.booklets || bookletsStock;
                        
                        await Promise.all([
                            secureSave(K_STUDENTS, students),
                            secureSave(K_ATT_BY_DATE, attByDate),
                            secureSave(K_REVENUE, revenueByDate),
                            secureSave(K_GROUP_FEES, groupFees),
                            secureSave(K_EXPENSES, expensesByDate),
                            secureSave(K_DELETED, deletedStudents),
                            secureSave(K_SYLLABUS, syllabusData),
                            secureSave(K_EVAL, evalData),
                            secureSave(K_SESSION_STUDENTS, sessionStudentsByDate),
                            secureSave(K_BOOKLETS, bookletsStock)
                        ]);
                        updateTopStats(); updateFinanceSummary(); renderCharts();
                        showToast("تم تحديث البيانات من السحابة ✅", "success");
                    }
                } else {
                    console.log("[Sync] No remote data → Initial push");
                    const dbRef = ref(database, `users/${window.CURRENT_MANAGER_ID}`);
                    await update(dbRef, {
                        'students': students, 'attendance': attByDate,
                        'finances/revenue': revenueByDate, 'packages': groupFees,
                        'finances/expenses': expensesByDate, 'deletedStudents': deletedStudents,
                        'syllabus': syllabusData, 'evaluations': evalData,
                        'sessionStudents': sessionStudentsByDate, 'booklets': bookletsStock,
                        '_lastModified': Date.now()
                    });
                    showToast("تم رفع البيانات لأول مرة ✅", "success");
                }
                hasUnsavedChanges = false;
                updateSyncUI('online', 'متصل ومتزامن ✅');
            })();

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 12000)
            );

            await Promise.race([syncWork, timeout]);

        } catch(e) {
            console.error("[Sync] Error:", e);
            if (e.message === 'SYNC_TIMEOUT') {
                updateSyncUI('offline', 'انتهى وقت المزامنة - تأكد من الإنترنت');
                showToast("المزامنة أخدت وقت طويل ❌ تأكد من جودة الإنترنت", "err");
            } else {
                updateSyncUI('offline', 'فشلت المزامنة');
                showToast("فشلت المزامنة. تأكد من اتصال الإنترنت.", "err");
            }
        } finally {
            syncInProgress = false;
        }
    }

    // Cloud Sync Click Handler
    if ($("cloudSyncIndicator")) {
        $("cloudSyncIndicator").addEventListener("click", function() {
            syncWithFirebase();
        });
    }

    // Automatic Online/Offline Detection
    window.addEventListener('offline', () => {
        updateSyncUI('offline', 'تم قطع الاتصال بالإنترنت');
        showToast("انقطع الاتصال بالإنترنت", "err");
    });
    
    window.addEventListener('online', () => {
        updateSyncUI('pending', 'عاد الاتصال بالإنترنت، جاري المزامنة...');
        setTimeout(() => {
            syncWithFirebase();
        }, 2000);
    });

    // Startup Sequence
    async function initSystem() {
        // Step 0: Run storage migration (localStorage → IndexedDB)
        await initStorageMigration();
        
        // Step 1: Load data (from IndexedDB first, then merge with Firebase)
        await loadAll(); 
        ensureBase500(); 
        checkAuth(); // Re-run after data loaded
        applyLanguage(); 
        setTimeout(checkQR, 500);

        initDailyApprovalSystem();
        initNoticeBoardSystem();

        // Step 2: Setup real-time permissions listener (works for both admin & assistant)
        await loadPermissions();
        setupPermissionsListener();

        // مزامنة صامتة عند فتح البرنامج في يوم جديد
        if (localStorage.getItem("last_cloud_sync_date") !== nowDateStr()) {
            setTimeout(() => { 
                if (typeof accessToken !== "undefined" && accessToken) backupToDrive(false); 
            }, 8000);
        }
    }

    // ==========================================
    // CLOUD DATA MONITOR
    // ==========================================
    const CLOUD_MONITOR_SECTIONS = [
        { key: 'students',         firebaseKey: 'students',              label: '👥 الطلاب',                  localVar: () => students },
        { key: 'attendance',       firebaseKey: 'attendance',            label: '📋 الحضور',                  localVar: () => attByDate },
        { key: 'revenue',          firebaseKey: 'finances/revenue',      label: '💰 الإيرادات',               localVar: () => revenueByDate },
        { key: 'expenses',         firebaseKey: 'finances/expenses',     label: '🧾 المصروفات',               localVar: () => expensesByDate },
        { key: 'packages',         firebaseKey: 'packages',             label: '📦 الباقات',                 localVar: () => groupFees },
        { key: 'deletedStudents',  firebaseKey: 'deletedStudents',      label: '🗑️ المحذوفات',              localVar: () => deletedStudents },
        { key: 'syllabus',         firebaseKey: 'syllabus',             label: '📚 المنهج',                  localVar: () => syllabusData },
        { key: 'evaluations',      firebaseKey: 'evaluations',          label: '📝 التقييمات',               localVar: () => evalData },
        { key: 'sessionStudents',  firebaseKey: 'sessionStudents',      label: '🎟️ طلاب الحصة',            localVar: () => sessionStudentsByDate },
        { key: 'booklets',         firebaseKey: 'booklets',             label: '📖 المذكرات',                localVar: () => bookletsStock },
    ];

    function countData(data) {
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        if (typeof data === 'object') return Object.keys(data).length;
        return 0;
    }

    async function runCloudDataCheck() {
        const tbody = $("cloudMonitorTableBody");
        const treeEl = $("cloudMonitorTree");
        if (!tbody) return;

        const mid = window.CURRENT_MANAGER_ID || localStorage.getItem("ca_manager_id");
        if (!mid) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--danger);">⚠️ لم يتم تسجيل الدخول — لا يمكن فحص السحابة</td></tr>`;
            return;
        }

        // Show loading
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px;"><div style="display:inline-block; width:24px; height:24px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation: spin 0.8s linear infinite;"></div> جاري جلب البيانات من السيرفر...</td></tr>`;
        if ($("cloudMonitorOverallIcon")) $("cloudMonitorOverallIcon").textContent = "⏳";
        if ($("cloudMonitorOverallText")) $("cloudMonitorOverallText").textContent = "جاري الفحص...";

        try {
            const snapshot = await Promise.race([
                get(child(ref(database), `users/${mid}`)),
                new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 15000))
            ]);

            const remote = snapshot.exists() ? snapshot.val() : {};
            let rows = '';
            let matchCount = 0;
            let mismatchCount = 0;
            let missingCloud = 0;
            let totalSections = CLOUD_MONITOR_SECTIONS.length;

            for (const sec of CLOUD_MONITOR_SECTIONS) {
                const localData = sec.localVar();
                // Navigate nested Firebase keys (e.g. "finances/revenue")
                let remoteData = remote;
                for (const part of sec.firebaseKey.split('/')) {
                    remoteData = remoteData ? remoteData[part] : undefined;
                }

                const localCount = countData(localData);
                const cloudCount = countData(remoteData);

                let status = '';
                let statusStyle = '';
                if (!remoteData && localCount === 0) {
                    status = '➖ فارغ';
                    statusStyle = 'color:var(--text-muted);';
                    matchCount++;
                } else if (!remoteData && localCount > 0) {
                    status = '⚠️ غير موجود بالسحابة!';
                    statusStyle = 'color:var(--danger); font-weight:700;';
                    missingCloud++;
                    mismatchCount++;
                } else if (localCount === cloudCount) {
                    status = '✅ متطابق';
                    statusStyle = 'color:var(--success); font-weight:700;';
                    matchCount++;
                } else {
                    status = `⚠️ مختلف (فرق: ${Math.abs(localCount - cloudCount)})`;
                    statusStyle = 'color:var(--warning); font-weight:700;';
                    mismatchCount++;
                }

                rows += `<tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:12px 16px; font-weight:600;">${sec.label}</td>
                    <td style="padding:12px 16px; text-align:center; font-weight:700;">${localCount}</td>
                    <td style="padding:12px 16px; text-align:center; font-weight:700;">${cloudCount}</td>
                    <td style="padding:12px 16px; text-align:center; ${statusStyle}">${status}</td>
                </tr>`;
            }

            // Add _lastModified row
            const lastMod = remote._lastModified;
            const lastModStr = lastMod ? new Date(lastMod).toLocaleString('ar-EG') : 'غير متاح';
            rows += `<tr style="border-bottom:1px solid var(--border); background:var(--bg-inset);">
                <td style="padding:12px 16px; font-weight:600;">🕐 آخر تعديل سحابي</td>
                <td style="padding:12px 16px; text-align:center;" colspan="2">${lastModStr}</td>
                <td style="padding:12px 16px; text-align:center; color:var(--primary); font-weight:700;">📡 مسجل</td>
            </tr>`;

            tbody.innerHTML = rows;

            // Update summary cards
            if ($("cloudMonitorLocalCount")) $("cloudMonitorLocalCount").textContent = totalSections;
            if ($("cloudMonitorCloudCount")) {
                const cloudSections = CLOUD_MONITOR_SECTIONS.filter(sec => {
                    let d = remote;
                    for (const p of sec.firebaseKey.split('/')) { d = d ? d[p] : undefined; }
                    return d !== undefined && countData(d) > 0;
                }).length;
                $("cloudMonitorCloudCount").textContent = cloudSections;
            }
            const now = new Date();
            if ($("cloudMonitorLastSync")) $("cloudMonitorLastSync").textContent = now.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});

            // Overall status
            const card = $("cloudMonitorStatusCard");
            if (mismatchCount === 0) {
                if ($("cloudMonitorOverallIcon")) $("cloudMonitorOverallIcon").textContent = "✅";
                if ($("cloudMonitorOverallText")) $("cloudMonitorOverallText").textContent = "كل الأقسام متزامنة بأمان!";
                if (card) card.style.background = "linear-gradient(135deg, #059669, #10b981)";
            } else {
                if ($("cloudMonitorOverallIcon")) $("cloudMonitorOverallIcon").textContent = "⚠️";
                if ($("cloudMonitorOverallText")) $("cloudMonitorOverallText").textContent = `يوجد ${mismatchCount} أقسام غير متطابقة`;
                if (card) card.style.background = "linear-gradient(135deg, #d97706, #f59e0b)";
            }

            // Build tree view
            if (treeEl) {
                let tree = `<span style="color:#10b981;">📂</span> users/\n`;
                tree += `  <span style="color:#10b981;">📂</span> ${mid}/\n`;
                const allKeys = Object.keys(remote).filter(k => k !== '_lastModified').sort();
                for (let i = 0; i < allKeys.length; i++) {
                    const k = allKeys[i];
                    const val = remote[k];
                    const isLast = i === allKeys.length - 1;
                    const connector = isLast ? '└── ' : '├── ';
                    const subConnector = isLast ? '    ' : '│   ';

                    if (typeof val === 'object' && val !== null) {
                        const subKeys = Object.keys(val);
                        const count = subKeys.length;
                        tree += `    ${connector}<span style="color:#3b82f6;">📂</span> <strong>${k}</strong> <span style="color:#6b7280;">(${count} عنصر)</span>\n`;
                        // Show first 3 sub-keys as preview
                        const preview = subKeys.slice(0, 3);
                        for (let j = 0; j < preview.length; j++) {
                            const subIsLast = j === preview.length - 1 && count <= 3;
                            const sc = subIsLast ? '└── ' : '├── ';
                            tree += `    ${subConnector}${sc}<span style="color:#8b5cf6;">📄</span> ${preview[j]}\n`;
                        }
                        if (count > 3) {
                            tree += `    ${subConnector}└── <span style="color:#6b7280;">... و ${count - 3} عنصر آخر</span>\n`;
                        }
                    } else {
                        tree += `    ${connector}<span style="color:#f59e0b;">📄</span> ${k}: <span style="color:#6b7280;">${String(val).substring(0, 50)}</span>\n`;
                    }
                }
                tree += `    └── <span style="color:#f59e0b;">📄</span> _lastModified: <span style="color:#6b7280;">${lastModStr}</span>\n`;
                treeEl.innerHTML = `<pre style="margin:0; white-space:pre; overflow-x:auto;">${tree}</pre>`;
            }

            showToast("تم فحص السحابة بنجاح ✅", "success");
        } catch (err) {
            console.error("[CloudMonitor] Error:", err);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--danger);">❌ فشل الاتصال بالسيرفر: ${err.message}</td></tr>`;
            if ($("cloudMonitorOverallIcon")) $("cloudMonitorOverallIcon").textContent = "❌";
            if ($("cloudMonitorOverallText")) $("cloudMonitorOverallText").textContent = "فشل الفحص!";
            if ($("cloudMonitorStatusCard")) $("cloudMonitorStatusCard").style.background = "linear-gradient(135deg, #dc2626, #ef4444)";
        }
    }

    // Bind buttons
    if ($("btnRunCloudCheck")) on("btnRunCloudCheck", "click", () => runCloudDataCheck());
    if ($("btnForceUpload")) on("btnForceUpload", "click", async () => {
        const confirm = await Swal.fire({
            title: 'رفع إجباري',
            text: 'سيتم رفع جميع البيانات المحلية إلى السحابة. هل أنت متأكد؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، ارفع الآن',
            cancelButtonText: 'إلغاء'
        });
        if (!confirm.isConfirmed) return;
        
        showToast("جاري الرفع الإجباري...", "warning");
        await saveAll();
        showToast("تم الرفع الإجباري بنجاح ✅", "success");
        setTimeout(() => runCloudDataCheck(), 2000);
    });

    // PRE-AUTH: Run synchronously BEFORE async initSystem
    // This prevents login page flash when user is already logged in
    checkAuth();



    initSystem();
});
