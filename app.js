/* =============================================
   Center System V30 (Stable Release)
   - Fixes: Caching issues, Search, Wallpaper, Sound.
   - Logic: Functions defined BEFORE usage.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    console.log("System V30 Started...");

    // ==========================================
    // 1. إعدادات النظام (System Config)
    // ==========================================
    const ADMIN_PASS = "####1111"; // باسوورد المدير
    const ASST_PASS  = "11112222"; // باسوورد المساعد
    const MAX_IMG_SIZE = 3000000;  // أقصى حجم للصورة (3 ميجا)

    // مفاتيح التخزين
    const KEYS = {
        STUDENTS: "ca_students_v6",
        DATA: "ca_data_v6", // For revenue & attendance
        THEME: "ca_theme_v1",
        BG: "ca_bg_image",
        AUTH: "ca_auth_v2",
        ROLE: "ca_role_v1"
    };

    // متغيرات النظام
    let students = {};
    let systemData = { 
        revenue: {}, 
        attendance: {}, 
        termFee: 0, 
        deleted: {} 
    };
    let currentId = null;

    // أدوات مساعدة (Helpers)
    const $ = (id) => document.getElementById(id);
    const todayStr = () => new Date().toISOString().split('T')[0];
    
    // دالة الصوت (Sound Effect)
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            
            if (type === "money") {
                // صوت رنة عملات (High Pitch Ding)
                osc.type = "sine";
                osc.frequency.setValueAtTime(1500, now);
                osc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === "error") {
                // صوت خطأ (Buzz)
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else {
                // صوت نجاح عادي (Simple Beep)
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.1, now);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            console.log("Sound error (ignore if muted)");
        }
    };

    // ==========================================
    // 2. وظائف النظام (Core Functions)
    // ==========================================

    // حفظ البيانات
    const saveSystem = () => {
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
        localStorage.setItem(KEYS.DATA, JSON.stringify(systemData));
        updateStats();
    };

    // تحميل البيانات
    const loadSystem = () => {
        try {
            students = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || "{}");
            systemData = JSON.parse(localStorage.getItem(KEYS.DATA) || '{"revenue":{}, "attendance":{}, "termFee":0, "deleted":{}}');
            
            // إصلاح البيانات القديمة إذا كانت ناقصة
            if (!systemData.revenue) systemData.revenue = {};
            if (!systemData.attendance) systemData.attendance = {};
            if (!systemData.deleted) systemData.deleted = {};
            
            // تحميل الثيم والخلفية
            const theme = localStorage.getItem(KEYS.THEME) || "classic";
            if(theme !== "classic") document.body.classList.add(`theme-${theme}`);
            if($("themeSelector")) $("themeSelector").value = theme;

            const bg = localStorage.getItem(KEYS.BG);
            if(bg) document.body.style.backgroundImage = `url('${bg}')`;

            // عرض المطلوب
            if($("termFeeInp")) $("termFeeInp").value = systemData.termFee || "";

            updateStats();
        } catch (e) {
            console.error("Error loading data", e);
            alert("حدث خطأ في تحميل البيانات. قد تحتاج لعمل ضبط مصنع.");
        }
    };

    // تحديث الإحصائيات العلوية
    const updateStats = () => {
        const count = Object.values(students).filter(s => s.name || s.paid > 0).length;
        const today = todayStr();
        const attend = (systemData.attendance[today] || []).length;
        const money = systemData.revenue[today] || 0;

        if($("totalStudentsCount")) $("totalStudentsCount").textContent = count;
        if($("todayCountTop")) $("todayCountTop").textContent = attend;
        if($("todayRevenue")) $("todayRevenue").textContent = money + " ج";
    };

    // تحديث واجهة الطالب
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
        
        // تفريغ الخانات
        $("newPaymentInput").value = "";
        $("newNoteInp").value = "";

        // حالة الحضور (الأفاتار)
        const today = todayStr();
        const isPresent = (st.attendanceDates || []).includes(today);
        const avatar = $("stAvatar");
        if (isPresent) {
            avatar.classList.add("present");
            $("todayStatus").textContent = "✅ حاضر";
            $("todayStatus").style.color = "green";
        } else {
            avatar.classList.remove("present");
            $("todayStatus").textContent = "✖ غياب";
            $("todayStatus").style.color = "red";
        }

        // الشريط الجانبي الملون (حسب المصاريف)
        const card = document.querySelector(".studentCard");
        card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
        const fee = systemData.termFee || 0;
        const paid = st.paid || 0;
        
        if (fee > 0) {
            if (paid >= fee) card.classList.add("status-border-green");
            else if (paid > 0) card.classList.add("status-border-yellow");
            else card.classList.add("status-border-red");
        }

        $("daysCount").textContent = (st.attendanceDates || []).length;
        $("attList").innerHTML = (st.attendanceDates || []).slice().reverse().slice(0, 15).map(d => `<div>${d}</div>`).join("");
    };

    // ==========================================
    // 3. تشغيل الأزرار (Event Listeners)
    // ==========================================

    // --- تسجيل الدخول ---
    const loginBtn = $("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const u = $("user").value.trim();
            const p = $("pass").value.trim();
            
            if (u === "Admin" && p === ADMIN_PASS) {
                localStorage.setItem(KEYS.AUTH, "1");
                localStorage.setItem(KEYS.ROLE, "admin");
                location.reload();
            } else if (u === "User" && p === ASST_PASS) {
                localStorage.setItem(KEYS.AUTH, "1");
                localStorage.setItem(KEYS.ROLE, "user");
                location.reload();
            } else {
                alert("بيانات الدخول خطأ ❌");
                playSound("error");
            }
        });
    }

    const logoutBtn = $("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => {
        localStorage.clear(); // مسح كامل للخروج الآمن
        location.reload();
    });

    // --- البحث والفتح ---
    const openBtn = $("openBtn");
    if (openBtn) openBtn.addEventListener("click", () => {
        const id = parseInt($("openId").value);
        if (students[id]) {
            updateStudentUI(id);
            document.querySelector(".studentCard").scrollIntoView({ behavior: "smooth" });
        } else {
            alert("هذا الكود غير موجود!");
        }
    });

    const searchInp = $("searchAny");
    if (searchInp) searchInp.addEventListener("input", (e) => {
        const txt = e.target.value.toLowerCase();
        const resBox = $("searchMsg");
        
        if (!txt) { resBox.style.display = "none"; return; }
        
        // البحث بالاسم أو الرقم أو الكود
        const results = Object.values(students).filter(s => 
            (s.name && s.name.toLowerCase().includes(txt)) || 
            (s.id && String(s.id).includes(txt)) || 
            (s.phone && s.phone.includes(txt))
        ).slice(0, 5);

        if (results.length > 0) {
            resBox.style.display = "block";
            resBox.innerHTML = results.map(s => 
                `<div class="item" onclick="window.loadSt(${s.id})">
                    <b>${s.name}</b> (${s.id}) 
                    <span style="float:left; color:green;">${s.phone || ""}</span>
                 </div>`
            ).join("");
        } else {
            resBox.style.display = "none";
        }
    });

    // دالة مساعدة لفتح الطالب من البحث
    window.loadSt = (id) => {
        $("searchMsg").style.display = "none";
        updateStudentUI(id);
        document.querySelector(".studentCard").scrollIntoView({ behavior: "smooth" });
    };

    // --- إضافة طالب جديد ---
    const addNewBtn = $("addNewBtn");
    if (addNewBtn) addNewBtn.addEventListener("click", () => {
        const id = parseInt($("newId").value);
        if (!id) return alert("اكتب كود الطالب");
        if (students[id]) return alert("هذا الكود موجود بالفعل!");

        // إنشاء طالب جديد
        students[id] = { id: id, name: "", paid: 0, attendanceDates: [], joinedDate: todayStr() };
        saveSystem();
        updateStudentUI(id);
        alert("تم إنشاء الملف بنجاح ✅");
    });

    // --- الحفظ والإيداع ---
    const saveStBtn = $("saveStudentBtn");
    if (saveStBtn) saveStBtn.addEventListener("click", () => {
        if (!currentId) return;
        const s = students[currentId];
        s.name = $("stName").value;
        s.className = $("stClass").value;
        s.phone = $("stPhone").value;
        s.notes = $("stNotes").value;
        saveSystem();
        alert("تم حفظ البيانات 💾");
    });

    const payBtn = $("addPaymentBtn");
    if (payBtn) payBtn.addEventListener("click", () => {
        if (!currentId) return;
        const amount = parseInt($("newPaymentInput").value);
        if (!amount) return;

        students[currentId].paid = (students[currentId].paid || 0) + amount;
        
        // تسجيل الإيراد
        const today = todayStr();
        systemData.revenue[today] = (systemData.revenue[today] || 0) + amount;
        
        saveSystem();
        playSound("money"); // 💰💰 صوت الفلوس
        alert("تم تسجيل الإيداع: " + amount + " ج");
        updateStudentUI(currentId);
    });

    const deductBtn = $("correctPayBtn");
    if (deductBtn) deductBtn.addEventListener("click", () => {
        if (!currentId) return;
        const amount = parseInt(prompt("اكتب المبلغ المراد خصمه (تصحيح خطأ):"));
        if (!amount) return;

        students[currentId].paid = Math.max(0, (students[currentId].paid || 0) - amount);
        
        // خصم من الإيراد أيضاً
        const today = todayStr();
        systemData.revenue[today] = Math.max(0, (systemData.revenue[today] || 0) - amount);

        saveSystem();
        alert("تم الخصم وتصحيح الرصيد ✅");
        updateStudentUI(currentId);
    });

    // --- الواتساب ---
    const waBtn = $("waBtn");
    if (waBtn) waBtn.addEventListener("click", () => {
        const ph = $("stPhone").value;
        if (ph && ph.length > 9) {
            window.open(`https://wa.me/20${ph}`, '_blank');
        } else {
            alert("رقم الموبايل غير صحيح");
        }
    });

    // --- الإعدادات والخلفية ---
    const bgInput = $("bgInput");
    if (bgInput) bgInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_IMG_SIZE) return alert("الصورة كبيرة جداً! اختر صورة أقل من 3 ميجا.");

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            document.body.style.backgroundImage = `url('${data}')`;
            localStorage.setItem(KEYS.BG, data);
        };
        reader.readAsDataURL(file);
    });

    const clearBg = $("clearBgBtn");
    if (clearBg) clearBg.addEventListener("click", () => {
        document.body.style.backgroundImage = "none";
        localStorage.removeItem(KEYS.BG);
    });

    // --- إدارة البيانات (Admin Only) ---
    const resetTermBtn = $("resetTermBtn");
    if (resetTermBtn) resetTermBtn.addEventListener("click", () => {
        const pass = prompt("أدخل باسوورد المدير للتأكيد:");
        if (pass === ADMIN_PASS) {
            if (confirm("هل أنت متأكد من تصفير الترم؟ (سيتم مسح المصاريف والحضور فقط)")) {
                for (let id in students) {
                    students[id].paid = 0;
                    students[id].attendanceDates = [];
                }
                systemData.revenue = {};
                systemData.attendance = {};
                saveSystem();
                alert("تم تصفير الترم بنجاح ✅");
                location.reload();
            }
        } else {
            alert("باسوورد خاطئ!");
        }
    });

    // حفظ المطلوب للترم
    const saveFeeBtn = $("saveFeeBtn");
    if (saveFeeBtn) saveFeeBtn.addEventListener("click", () => {
        const pass = prompt("أدخل باسوورد المدير:");
        if (pass === ADMIN_PASS) {
            const val = parseInt($("termFeeInp").value);
            systemData.termFee = val || 0;
            saveSystem();
            alert("تم حفظ قيمة مصاريف الترم: " + systemData.termFee);
            if (currentId) updateStudentUI(currentId);
        } else {
            alert("باسوورد خاطئ");
        }
    });

    // --- سلة المحذوفات ---
    const delBtn = $("deleteStudentBtn");
    if (delBtn) delBtn.addEventListener("click", () => {
        if (currentId && confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
            // نقل للسلة
            systemData.deleted[currentId] = students[currentId];
            
            // هل نخصم فلوسه من الإيراد؟
            if (students[currentId].paid > 0 && confirm("هل تريد خصم المبلغ المدفوع من الخزنة؟")) {
                const today = todayStr();
                systemData.revenue[today] = (systemData.revenue[today] || 0) - students[currentId].paid;
            }

            // حذف نهائي
            delete students[currentId];
            saveSystem();
            alert("تم النقل لسلة المحذوفات 🗑️");
            location.reload();
        }
    });

    const openBin = $("openBinBtn");
    if (openBin) openBin.addEventListener("click", () => {
        const list = $("binList");
        list.innerHTML = "";
        const deletedIds = Object.keys(systemData.deleted || {});
        
        if (deletedIds.length === 0) {
            list.innerHTML = "<div class='mutedCenter'>السلة فارغة</div>";
        } else {
            deletedIds.forEach(id => {
                const s = systemData.deleted[id];
                list.innerHTML += `
                    <div class="binItem">
                        <b>${s.name} (${id})</b>
                        <button class="btn success smallBtn" onclick="window.restore(${id})">استرجاع</button>
                    </div>`;
            });
        }
        $("recycleBinModal").classList.remove("hidden");
    });

    // زر إغلاق السلة
    if($("closeBinBtn")) $("closeBinBtn").addEventListener("click", () => $("recycleBinModal").classList.add("hidden"));

    // دالة الاسترجاع
    window.restore = (id) => {
        if (students[id]) return alert("لا يمكن الاسترجاع، الكود مستخدم حالياً!");
        students[id] = systemData.deleted[id];
        delete systemData.deleted[id];
        saveSystem();
        alert("تم استرجاع الطالب ✅");
        location.reload();
    };

    // ==========================================
    // 4. التشغيل المبدئي (Initialization)
    // ==========================================
    
    // التأكد من وجود 500 طالب
    for (let i = 1; i <= 500; i++) {
        if (!students[i]) students[i] = { id: i, paid: 0, attendanceDates: [] };
    }

    // التحقق من الدخول
    const isAuth = localStorage.getItem(KEYS.AUTH);
    if (isAuth === "1") {
        $("loginBox").classList.add("hidden");
        $("appBox").classList.remove("hidden");
        
        // تطبيق الصلاحيات
        const role = localStorage.getItem(KEYS.ROLE);
        if (role !== "admin") {
            document.querySelectorAll(".adminOnly").forEach(el => el.classList.add("hidden"));
        }

        loadSystem();
    } else {
        $("loginBox").classList.remove("hidden");
        $("appBox").classList.add("hidden");
    }

    // تشغيل زر الإعدادات
    if($("settingsBtn")) $("settingsBtn").addEventListener("click", () => $("settingsModal").classList.remove("hidden"));
    if($("closeSettingsBtn")) $("closeSettingsBtn").addEventListener("click", () => $("settingsModal").classList.add("hidden"));

});
