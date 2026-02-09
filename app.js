/* =============================================
   Center System V27 (Stable Base + New Features)
   - Base: V22 (Proven Stability)
   - Added: Money Sound, Wallpaper Fix, Danger Zone
   - Fixed: Search, WhatsApp, Term Fee Security
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    console.log("System V27 Loaded...");

    // =================================================
    // 1. التعريفات والإعدادات (Constants)
    // =================================================
    const ADMIN_USER = "Admin";
    const ADMIN_PASS = "####1111"; // باسوورد المدير
    const ASST_USER  = "User";
    const ASST_PASS  = "11112222"; // باسوورد المساعد
    
    const BASE_MIN_ID = 1;
    const BASE_MAX_ID = 500;
    const MAX_IMG_SIZE = 3000000; // 3MB (للخلفية)

    // مفاتيح الذاكرة (Local Storage Keys)
    const K_AUTH = "ca_auth_v2";
    const K_ROLE = "ca_role_v1";
    const K_STUDENTS = "ca_students_v6";
    const K_DATA = "ca_data_v6"; // يشمل الإيراد والحضور
    const K_THEME = "ca_theme_v1";
    const K_LANG = "ca_lang";
    const K_BG_IMAGE = "ca_bg_image";
    const K_LAST_BACKUP = "ca_last_backup";

    // المتغيرات العامة
    let students = {};
    let systemData = { revenue: {}, attendance: {}, termFee: 0, deleted: {} };
    let currentId = null;
    let currentUserRole = "admin";
    let currentLang = "ar";

    // =================================================
    // 2. أدوات المساعدة (Helpers)
    // =================================================
    const $ = (id) => document.getElementById(id);
    const nowDateStr = () => new Date().toISOString().split('T')[0];
    const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
    const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };

    // دالة الصوت (Sound Effect) - تم تعديلها لتكون مسموعة
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === "money") {
                // صوت رنة الفلوس (High Pitch)
                osc.type = "sine";
                osc.frequency.setValueAtTime(1500, now);
                osc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === "success") {
                // صوت نجاح (Ding)
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else {
                // صوت خطأ (Buzz)
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.2, now);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.log("Audio blocked by browser");
        }
    };

    // إنشاء طالب فارغ
    const makeEmptyStudent = (id) => ({ 
        id: id, name: "", className: "", phone: "", 
        paid: 0, notes: "", joinedDate: nowDateStr(), attendanceDates: [] 
    });

    // =================================================
    // 3. وظائف النظام الأساسية (Core Functions)
    // =================================================

    // حفظ البيانات
    const saveAll = () => {
        localStorage.setItem(K_STUDENTS, JSON.stringify(students));
        localStorage.setItem(K_DATA, JSON.stringify(systemData));
        updateTopStats();
    };

    // تحميل البيانات
    const loadAll = () => {
        try {
            students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}");
            systemData = JSON.parse(localStorage.getItem(K_DATA) || '{"revenue":{}, "attendance":{}, "termFee":0, "deleted":{}}');
            
            // إصلاح البيانات القديمة
            if (!systemData.revenue) systemData.revenue = {};
            if (!systemData.attendance) systemData.attendance = {};
            if (!systemData.deleted) systemData.deleted = {};

            // تحميل الثيم
            const savedTheme = localStorage.getItem(K_THEME) || "classic";
            if(savedTheme !== "classic") document.body.classList.add(`theme-${savedTheme}`);
            if($("themeSelector")) $("themeSelector").value = savedTheme;

            // تحميل الخلفية
            const savedBg = localStorage.getItem(K_BG_IMAGE);
            if(savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;

            // تحميل مطلوب الترم
            if($("termFeeInp")) $("termFeeInp").value = systemData.termFee || "";

            updateTopStats();
            checkBackupStatus();

        } catch (e) { console.error("Load Error", e); }
    };

    // التأكد من 500 طالب
    const ensureBase500 = () => {
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) {
            if (!students[i]) students[i] = makeEmptyStudent(i);
        }
        saveAll();
    };

    // تحديث العدادات العلوية
    const updateTopStats = () => {
        const filledCount = Object.values(students).filter(s => s.name || s.paid > 0).length;
        const today = nowDateStr();
        const todayAttend = (systemData.attendance[today] || []).length;
        const money = systemData.revenue[today] || 0;

        if($("totalStudentsCount")) $("totalStudentsCount").textContent = filledCount;
        if($("todayCountTop")) $("todayCountTop").textContent = todayAttend;
        if($("todayRevenue")) $("todayRevenue").textContent = money + " ج";
    };

    // =================================================
    // 4. واجهة الطالب (Student UI)
    // =================================================
    const updateStudentUI = (id) => {
        currentId = id;
        const st = students[id];
        if (!st) return;

        // تعبئة البيانات
        $("studentIdPill").textContent = `ID: ${id}`;
        $("stName").value = st.name || "";
        $("stClass").value = st.className || "";
        $("stPhone").value = st.phone || "";
        $("stNotes").value = st.notes || "";
        $("stTotalPaid").value = (st.paid || 0);
        
        $("newNoteInp").value = "";
        $("newPaymentInput").value = "";

        // حالة المصاريف (الشريط الجانبي)
        const card = document.querySelector(".studentCard");
        card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
        const fee = systemData.termFee || 0;
        const paid = st.paid || 0;
        if (fee > 0) {
            if (paid >= fee) card.classList.add("status-border-green");
            else if (paid > 0) card.classList.add("status-border-yellow");
            else card.classList.add("status-border-red");
        }

        // حالة الحضور (الأفاتار)
        const today = nowDateStr();
        const isPresent = (st.attendanceDates || []).includes(today);
        const avatar = $("stAvatar");
        if (avatar) {
            if (isPresent) {
                avatar.classList.add("present");
                $("todayStatus").textContent = "✅ حاضر";
                $("todayStatus").style.color = "green";
            } else {
                avatar.classList.remove("present");
                $("todayStatus").textContent = "✖ غياب";
                $("todayStatus").style.color = "red";
            }
        }

        $("daysCount").textContent = (st.attendanceDates || []).length;
        $("attList").innerHTML = (st.attendanceDates || []).slice().reverse().slice(0, 15).map(d => `<div>${prettyDate(d)}</div>`).join("");
        
        // شارة "جديد"
        const badge = $("newBadge");
        if (badge) {
            if (st.attendanceDates.length === 0 && st.name) badge.classList.remove("hidden");
            else badge.classList.add("hidden");
        }
    };

    // تسجيل الحضور
    const addAttendance = (id, dateStr) => {
        const st = students[id];
        if (!st) return { ok: false };
        if (!st.attendanceDates.includes(dateStr)) {
            st.attendanceDates.push(dateStr);
            // تحديث سجل اليوم
            if (!systemData.attendance[dateStr]) systemData.attendance[dateStr] = [];
            if (!systemData.attendance[dateStr].includes(id)) systemData.attendance[dateStr].push(id);
            
            saveAll();
            playSound("success");
            return { ok: true, msg: "تم التسجيل ✅" };
        }
        playSound("error");
        return { ok: false, msg: "مسجل مسبقاً ⚠️" };
    };

    // حذف الحضور
    const removeAttendance = (id, dateStr) => {
        const st = students[id];
        if (!st) return;
        st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
        if (systemData.attendance[dateStr]) {
            systemData.attendance[dateStr] = systemData.attendance[dateStr].filter(x => x !== id);
        }
        saveAll();
    };

    // =================================================
    // 5. الوظائف العالمية (Global Functions)
    // =================================================
    
    // فتح الطالب (متاح في HTML)
    window.extOpen = (id) => {
        updateStudentUI(id);
        const card = document.querySelector(".studentCard");
        if (card) card.scrollIntoView({ behavior: "smooth" });
    };

    // استرجاع من السلة
    window.restoreSt = (id) => {
        if (students[id] && (students[id].name || students[id].paid > 0)) {
            if (!confirm("يوجد بيانات حالية لهذا الكود. هل تريد الاستبدال؟")) return;
        }
        const st = systemData.deleted[id];
        students[id] = st;
        delete systemData.deleted[id];
        
        // استرجاع الفلوس للخزنة (اختياري)
        if (st.paid > 0 && confirm("هل تريد استرجاع المبلغ ("+st.paid+") لإيراد اليوم؟")) {
            const today = nowDateStr();
            systemData.revenue[today] = (systemData.revenue[today] || 0) + st.paid;
        }
        
        saveAll();
        renderBinList();
        updateTopStats();
        alert("تم الاسترجاع بنجاح ✅");
        window.extOpen(id);
    };

    // =================================================
    // 6. تشغيل الأزرار (Event Listeners - Safe Mode)
    // =================================================
    
    // دالة أمان عشان لو زرار مش موجود الموقع ميقعش
    const safeOn = (id, event, handler) => {
        const el = $(id);
        if (el) el.addEventListener(event, handler);
    };

    // --- تسجيل الدخول ---
    safeOn("loginBtn", "click", () => {
        const u = $("user").value.trim();
        const p = $("pass").value.trim();
        if (u === ADMIN_USER && p === ADMIN_PASS) {
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "admin"); location.reload();
        } else if (u.toLowerCase() === ASST_USER.toLowerCase() && p === ASST_PASS) {
            localStorage.setItem(K_AUTH, "1"); localStorage.setItem(K_ROLE, "user"); location.reload();
        } else {
            alert("بيانات خاطئة ❌"); playSound("error");
        }
    });
    safeOn("logoutBtn", "click", () => { localStorage.clear(); location.reload(); });
    safeOn("togglePass", "click", () => { const p=$("pass"); p.type = p.type==="password"?"text":"password"; });

    // --- الإعدادات (Settings) ---
    safeOn("settingsBtn", "click", () => $("settingsModal").classList.remove("hidden"));
    safeOn("closeSettingsBtn", "click", () => $("settingsModal").classList.add("hidden"));
    safeOn("themeSelector", "change", (e) => {
        document.body.className = "";
        if(e.target.value !== "classic") document.body.classList.add(`theme-${e.target.value}`);
        localStorage.setItem(K_THEME, e.target.value);
    });

    // --- الخلفية (Fix: Check Size) ---
    safeOn("bgInput", "change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_IMG_SIZE) return alert("⚠️ الصورة كبيرة جداً (أكبر من 3 ميجا).");
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            document.body.style.backgroundImage = `url('${data}')`;
            localStorage.setItem(K_BG_IMAGE, data);
        };
        reader.readAsDataURL(file);
    });
    safeOn("clearBgBtn", "click", () => {
        document.body.style.backgroundImage = "none";
        localStorage.removeItem(K_BG_IMAGE);
    });

    // --- البحث الشامل (Fix) ---
    safeOn("openBtn", "click", () => {
        const id = toInt($("openId").value);
        if (students[id]) window.extOpen(id); else alert("غير موجود");
    });
    safeOn("searchAny", "input", (e) => {
        const q = e.target.value.toLowerCase();
        const res = $("searchMsg");
        if (!q) { res.style.display = "none"; return; }
        
        const found = Object.values(students).filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) || 
            (s.id && String(s.id).includes(q)) || 
            (s.phone && String(s.phone).includes(q))
        ).slice(0, 5);

        if (found.length > 0) {
            res.style.display = "block";
            res.innerHTML = found.map(s => 
                `<div class="item" onclick="window.extOpen(${s.id}); document.getElementById('searchMsg').style.display='none';">
                    <b>${s.name}</b> (${s.id}) <span style="color:green">${s.phone || ""}</span>
                 </div>`
            ).join("");
        } else {
            res.style.display = "none";
        }
    });

    // --- إضافة طالب جديد (Fix) ---
    safeOn("addNewBtn", "click", () => {
        const id = toInt($("newId").value);
        if (!id) return alert("أدخل الكود");
        if (students[id]) return alert("الكود مستخدم بالفعل!");
        students[id] = makeEmptyStudent(id);
        saveAll();
        window.extOpen(id);
        alert("تمت الإضافة بنجاح ✅");
    });

    // --- العمليات على الطالب ---
    safeOn("saveStudentBtn", "click", () => {
        if (!currentId) return;
        const s = students[currentId];
        s.name = $("stName").value;
        s.className = $("stClass").value;
        s.phone = $("stPhone").value;
        s.notes = $("stNotes").value;
        saveAll(); alert("تم الحفظ 💾");
    });

    safeOn("addNoteBtn", "click", () => {
        if (!currentId) return;
        const txt = $("newNoteInp").value.trim();
        if (!txt) return;
        const stamp = `[${nowDateStr()}]`;
        students[currentId].notes = `${stamp} : ${txt}\n${students[currentId].notes || ""}`;
        saveAll(); updateStudentUI(currentId);
    });

    safeOn("markTodayBtn", "click", () => { if (currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
    safeOn("unmarkTodayBtn", "click", () => { if (currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});

    // --- التعاملات المالية (Sound Fix) ---
    safeOn("addPaymentBtn", "click", () => {
        if (!currentId) return;
        const v = parseInt($("newPaymentInput").value);
        if (!v) return;
        
        students[currentId].paid = (students[currentId].paid || 0) + v;
        const today = nowDateStr();
        systemData.revenue[today] = (systemData.revenue[today] || 0) + v;
        
        saveAll();
        playSound("money"); // 💰
        alert("تم الإيداع: " + v + " ج");
        updateStudentUI(currentId);
        renderReport(today);
    });

    safeOn("correctPayBtn", "click", () => {
        if (!currentId) return;
        const v = parseInt(prompt("أدخل مبلغ الخصم (للتصحيح):"));
        if (!v) return;
        
        students[currentId].paid = Math.max(0, (students[currentId].paid || 0) - v);
        const today = nowDateStr();
        systemData.revenue[today] = Math.max(0, (systemData.revenue[today] || 0) - v);
        
        saveAll();
        alert("تم الخصم وتصحيح الرصيد ✅");
        updateStudentUI(currentId);
    });

    // --- الواتساب (Fix) ---
    safeOn("waBtn", "click", () => {
        const ph = $("stPhone").value;
        if (ph && ph.length > 9) window.open(`https://wa.me/20${ph}`, '_blank');
        else alert("رقم الموبايل غير صحيح");
    });

    // --- الحذف والسلة ---
    safeOn("deleteStudentBtn", "click", () => {
        if (currentId && confirm("هل أنت متأكد من الحذف؟")) {
            // نقل للسلة
            systemData.deleted[currentId] = JSON.parse(JSON.stringify(students[currentId]));
            
            // خصم من الإيراد (اختياري)
            if (students[currentId].paid > 0 && confirm("هل تريد خصم المبلغ المدفوع من الخزنة؟")) {
                const today = nowDateStr();
                systemData.revenue[today] = (systemData.revenue[today] || 0) - students[currentId].paid;
            }
            
            delete students[currentId]; // حذف فعلي من القائمة النشطة
            saveAll();
            alert("تم النقل لسلة المحذوفات 🗑️");
            location.reload();
        }
    });

    // فتح السلة
    const renderBinList = () => {
        const bl = $("binList"); if (!bl) return;
        const ids = Object.keys(systemData.deleted || {});
        if (ids.length === 0) { bl.innerHTML = "<div class='mutedCenter'>فارغة</div>"; return; }
        bl.innerHTML = ids.map(id => {
            const s = systemData.deleted[id];
            return `<div class="binItem"><b>${s.name} (${id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${id})">استرجاع</button></div>`;
        }).join("");
    };
    safeOn("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
    safeOn("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
    safeOn("emptyBinBtn", "click", () => { if(confirm("حذف نهائي؟")) { systemData.deleted = {}; saveAll(); renderBinList(); } });

    // --- إدارة البيانات (Danger Zone & Fees) ---
    safeOn("saveFeeBtn", "click", () => {
        if (prompt("أدخل باسوورد المدير:") === ADMIN_PASS) {
            systemData.termFee = toInt($("termFeeInp").value) || 0;
            saveAll();
            alert("تم حفظ المصاريف ✅");
            if(currentId) updateStudentUI(currentId);
        } else {
            alert("باسوورد خاطئ!");
        }
    });

    safeOn("resetTermBtn", "click", () => {
        if (prompt("أدخل باسوورد المدير للتأكيد:") === ADMIN_PASS) {
            if (confirm("هل أنت متأكد من تصفير الترم؟ (سيتم مسح المصاريف والحضور)")) {
                for (let k in students) { students[k].paid = 0; students[k].attendanceDates = []; }
                systemData.revenue = {}; systemData.attendance = {};
                saveAll(); alert("تم التصفير بنجاح ✅"); location.reload();
            }
        }
    });

    safeOn("resetBtn", "click", () => {
        if (prompt("أدخل باسوورد المدير:") === ADMIN_PASS && confirm("تحذير: سيتم مسح كل البيانات!")) {
            localStorage.clear(); location.reload();
        }
    });

    // --- التقارير ---
    safeOn("reportBtn", "click", () => renderReport($("reportDate").value));
    safeOn("copyReportBtn", "click", () => {
        const d = $("reportDate").value || nowDateStr();
        const txt = `📊 تقرير ${d}\n✅ العدد: ${$("reportCount").textContent}\n💰 الإيراد: ${$("reportMoney").textContent}`;
        navigator.clipboard.writeText(txt).then(() => alert("تم النسخ 📋"));
    });

    const renderReport = (d) => {
        const list = $("reportList"); if (!list) return;
        const ids = systemData.attendance[d] || [];
        $("reportDateLabel").textContent = prettyDate(d);
        $("reportCount").textContent = ids.length;
        $("reportMoney").textContent = (systemData.revenue[d] || 0) + " ج";
        
        if (ids.length === 0) list.innerHTML = "<div class='mutedCenter'>—</div>";
        else list.innerHTML = ids.map(id => `<div class="item" onclick="window.extOpen(${id})">(${id}) ${students[id]?students[id].name:"?"}</div>`).join("");
    };

    // --- التصدير والاستيراد ---
    const checkBackupStatus = () => {
        const last = localStorage.getItem(K_LAST_BACKUP);
        const now = Date.now();
        if (!last || (now - parseInt(last) > 24 * 60 * 60 * 1000)) $("backupDot").classList.remove("hidden");
        else $("backupDot").classList.add("hidden");
    };

    safeOn("exportExcelBtn", "click", () => {
        if (typeof XLSX === "undefined") return alert("مكتبة Excel غير موجودة");
        const filled = Object.values(students).filter(s => s.name || s.paid > 0);
        const wsData = [["كود", "الاسم", "المجموعة", "رقم الموبايل", "المدفوع", "ملاحظات", "سجل الحضور"]];
        filled.forEach(s => wsData.push([s.id, s.name, s.className, s.phone, s.paid, s.notes, (s.attendanceDates||[]).join(", ")]));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
        XLSX.writeFile(wb, `Center_Data_${nowDateStr()}.xlsx`);
        localStorage.setItem(K_LAST_BACKUP, Date.now()); checkBackupStatus();
    });

    safeOn("importExcelInput", "change", async () => {
        const f = $("importExcelInput").files[0]; if (!f) return;
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
        if (!confirm("هل أنت متأكد؟ سيتم استبدال البيانات الحالية.")) return;
        
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        students = {}; systemData.attendance = {}; systemData.revenue = {}; 
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) students[i] = makeEmptyStudent(i);

        rows.forEach(row => {
            const id = parseInt(row["كود"] || row["ID"]);
            if (id) {
                let st = makeEmptyStudent(id);
                st.name = row["الاسم"] || row["Name"] || "";
                st.className = row["المجموعة"] || row["Class"] || "";
                st.phone = row["رقم الموبايل"] || row["Phone"] || "";
                st.paid = parseInt(row["المدفوع"] || row["Paid"] || 0);
                st.notes = row["ملاحظات"] || row["Notes"] || "";
                let hist = row["سجل الحضور"] || row["History"];
                if (hist && typeof hist === 'string') {
                    st.attendanceDates = hist.split(",").map(s => s.trim()).filter(s => s);
                    st.attendanceDates.forEach(d => {
                        if (!systemData.attendance[d]) systemData.attendance[d] = [];
                        if (!systemData.attendance[d].includes(id)) systemData.attendance[d].push(id);
                    });
                }
                students[id] = st;
            }
        });
        saveAll(); alert("تم الاستيراد بنجاح ✅"); location.reload();
    });

    // =================================================
    // 7. التشغيل المبدئي (Initialization)
    // =================================================
    loadAll();
    ensureBase500();

    // فحص الدخول
    if (localStorage.getItem(K_AUTH) !== "1") {
        $("loginBox").classList.remove("hidden");
    } else {
        $("appBox").classList.remove("hidden");
        // تطبيق الصلاحيات
        currentUserRole = localStorage.getItem(K_ROLE);
        if (currentUserRole !== "admin") {
            document.querySelectorAll(".adminOnly").forEach(el => el.classList.add("hidden"));
        }
        // فحص QR كود من الرابط
        const p = new URLSearchParams(window.location.search);
        const id = toInt(p.get("id"));
        if (id && students[id]) { 
            addAttendance(id, nowDateStr()); 
            window.extOpen(id); 
            window.history.replaceState(null, null, window.location.pathname);
        }
    }
});
