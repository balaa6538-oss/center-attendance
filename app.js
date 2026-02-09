/* =============================================
   Center System V26 (Stable & Safe)
   - Re-ordered: Vars -> Functions -> Listeners (To prevent crashes).
   - Added Safety Checks: System won't crash if a button is missing.
   - All Features Included: Sound, Wallpaper, Search, Add, Danger Zone.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    console.log("System V26 Starting...");

    // ====== 1. CONSTANTS & VARIABLES ======
    const ADMIN_USER = "Admin";
    const ADMIN_PASS = "####1111"; 
    const ASST_USER  = "User";
    const ASST_PASS  = "11112222"; 

    const BASE_MIN_ID = 1;
    const BASE_MAX_ID = 500;
    const ITEMS_PER_PAGE = 50;
    const MAX_IMG_SIZE = 3000000; // 3MB

    // Keys
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

    // Global State
    let students = {}; let deletedStudents = {}; let extraIds = [];              
    let attByDate = {}; let revenueByDate = {}; 
    let currentId = null; let termFee = 0; let currentLang = "ar";
    let currentUserRole = "admin";
    let currentPage = 1; let currentFilteredList = []; 

    // Helpers
    const $ = (id) => document.getElementById(id);
    const on = (id, event, handler) => { 
        const el = $(id); 
        if(el) el.addEventListener(event, handler);
        else console.warn(`Element ${id} not found, skipping listener.`);
    };
    const nowDateStr = () => new Date().toISOString().split('T')[0];
    const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
    const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };

    // Sound
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext||window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if(type==="money") { 
                osc.type = "sine"; osc.frequency.setValueAtTime(1600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(); osc.stop(ctx.currentTime + 0.4);
            } else if(type==="success") {
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            } else { 
                osc.type = "sawtooth"; osc.frequency.setValueAtTime(100, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            }
        } catch(e) { console.log("Audio blocked"); }
    };

    const makeEmptyStudent = (id) => ({ id: id, name: "", className: "", phone: "", paid: 0, notes: "", joinedDate: nowDateStr(), attendanceDates: [] });

    // ====== 2. CORE FUNCTIONS ======

    const updateTopStats = () => {
        const elCount = $("totalStudentsCount");
        const elToday = $("todayCountTop");
        const elRev = $("todayRevenue");
        if(elCount) elCount.textContent = Object.values(students).filter(s => s.name || s.paid>0).length;
        if(elToday) elToday.textContent = (attByDate[nowDateStr()] || []).length;
        if(elRev) elRev.textContent = (revenueByDate[nowDateStr()] || 0) + " ج";
    };

    const saveAll = () => {
        localStorage.setItem(K_STUDENTS, JSON.stringify(students));
        localStorage.setItem(K_DELETED, JSON.stringify(deletedStudents));
        localStorage.setItem(K_EXTRA_IDS, JSON.stringify(extraIds));
        localStorage.setItem(K_ATT_BY_DATE, JSON.stringify(attByDate));
        localStorage.setItem(K_TERM_FEE, String(termFee));
        localStorage.setItem(K_REVENUE, JSON.stringify(revenueByDate));
        updateTopStats();
    };

    const addAttendance = (id, dateStr) => {
        const st = students[id]; if(!st) return {ok:false};
        if(!st.attendanceDates.includes(dateStr)) {
            st.attendanceDates.push(dateStr);
            if(!attByDate[dateStr]) attByDate[dateStr] = [];
            if(!attByDate[dateStr].includes(id)) attByDate[dateStr].push(id);
            saveAll(); playSound("success"); return {ok:true};
        }
        playSound("error"); return {ok:false};
    };

    const removeAttendance = (id, dateStr) => {
        const st = students[id]; if(!st) return;
        st.attendanceDates = st.attendanceDates.filter(d => d !== dateStr);
        if (attByDate[dateStr]) attByDate[dateStr] = attByDate[dateStr].filter(x => x !== id);
        saveAll();
    };

    // UI Updates
    const updateStudentUI = (id) => {
        currentId = id; const st = students[id]; if (!st) return;
        
        if($("studentIdPill")) $("studentIdPill").textContent = `ID: ${id}`;
        if($("stName")) $("stName").value = st.name || ""; 
        if($("stClass")) $("stClass").value = st.className || "";
        if($("stPhone")) $("stPhone").value = st.phone || ""; 
        if($("stNotes")) $("stNotes").value = st.notes || ""; 
        if($("stTotalPaid")) $("stTotalPaid").value = (st.paid||0) + " ";
        if($("newNoteInp")) $("newNoteInp").value = "";
        if($("newPaymentInput")) $("newPaymentInput").value = "";

        // Status Border
        const card = document.querySelector(".studentCard");
        if(card) {
            card.classList.remove("status-border-green", "status-border-yellow", "status-border-red");
            if(termFee > 0) {
                if((st.paid||0) >= termFee) card.classList.add("status-border-green");
                else if((st.paid||0) > 0) card.classList.add("status-border-yellow");
                else card.classList.add("status-border-red");
            }
        }

        // Attendance / Avatar
        const isPresent = (st.attendanceDates||[]).includes(nowDateStr());
        const avatar = $("stAvatar");
        if(avatar) {
            if(isPresent) { avatar.classList.add("present"); $("todayStatus").textContent="✅ حاضر"; $("todayStatus").style.color="green"; }
            else { avatar.classList.remove("present"); $("todayStatus").textContent="✖ غياب"; $("todayStatus").style.color="red"; }
        }
        
        if($("daysCount")) $("daysCount").textContent = (st.attendanceDates||[]).length;
        if($("attList")) $("attList").innerHTML = (st.attendanceDates||[]).slice().reverse().slice(0,20).map(d=>`<div>${prettyDate(d)}</div>`).join("");
        
        const badge = $("newBadge");
        if(badge) {
            if(st.attendanceDates.length === 0 && st.name) badge.classList.remove("hidden"); else badge.classList.add("hidden");
        }
    };

    // Report
    const renderReport = (d) => {
        const list = $("reportList"); if(!list) return;
        const ids = attByDate[d] || [];
        $("reportDateLabel").textContent = prettyDate(d);
        $("reportCount").textContent = ids.length;
        $("reportMoney").textContent = (revenueByDate[d]||0) + " ج";
        if(!ids.length) list.innerHTML = "<div class='mutedCenter'>—</div>";
        else list.innerHTML = ids.map(id => `<div class="item" onclick="window.extOpen(${id})">(${id}) ${students[id]?students[id].name:"?"}</div>`).join("");
    };

    // Bin
    const renderBinList = () => {
        const bl = $("binList"); if(!bl) return;
        const ids = Object.keys(deletedStudents);
        if(ids.length === 0) { bl.innerHTML = `<div class="mutedCenter">Empty</div>`; return; }
        bl.innerHTML = ids.map(id => {
            const s = deletedStudents[id];
            return `<div class="binItem"><b>${s.name} (${s.id})</b> <button class="btn success smallBtn" onclick="window.restoreSt(${s.id})">Restore</button></div>`;
        }).join("");
    };

    // List & Pages
    const renderPage = () => {
        const tb = $("allStudentsTable").querySelector("tbody"); tb.innerHTML="";
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = currentFilteredList.slice(start, end);
        const today = nowDateStr();

        pageItems.forEach(s => {
            const tr = document.createElement("tr");
            let stIcon = "🔴";
            if(termFee > 0) {
                if(s.paid >= termFee) stIcon = "🟢"; else if(s.paid > 0) stIcon = "🟡";
            }
            const attendTxt = (s.attendanceDates||[]).includes(today) ? "✅" : "➖";
            tr.innerHTML = `<td><input type="checkbox" class="stCheckbox" data-id="${s.id}"></td><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.paid}</td><td>${stIcon}</td><td>${attendTxt}</td>`;
            tr.addEventListener("click", (e) => {
                if(e.target.type !== "checkbox") { $("allStudentsModal").classList.add("hidden"); window.extOpen(s.id); }
            });
            tb.appendChild(tr);
        });
        
        $("pageIndicator").textContent = `صفحة ${currentPage}`;
        $("prevPageBtn").disabled = currentPage === 1;
        $("nextPageBtn").disabled = end >= currentFilteredList.length;
    };

    const renderList = () => {
        const filterGroup = $("filterClass").value; 
        const filterStatus = $("filterStatus").value; 
        const filterAttend = $("filterAttend").value; 
        
        const sel = $("filterClass");
        if(sel.options.length <= 1) { 
            const allClasses = new Set();
            Object.values(students).forEach(s => { if(s.className) allClasses.add(s.className); });
            allClasses.forEach(c => {
                const opt = document.createElement("option"); opt.value = c; opt.innerText = c; sel.appendChild(opt);
            });
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
        currentPage = 1; renderPage();
    };

    // Wallpaper
    const setWallpaper = (dataUrl) => {
        if(dataUrl) {
            document.body.style.backgroundImage = `url('${dataUrl}')`;
            localStorage.setItem(K_BG_IMAGE, dataUrl);
        } else {
            document.body.style.backgroundImage = "none";
            localStorage.removeItem(K_BG_IMAGE);
        }
    };

    // Load
    const loadAll = () => {
        try { students = JSON.parse(localStorage.getItem(K_STUDENTS) || "{}"); } catch { students = {}; }
        try { deletedStudents = JSON.parse(localStorage.getItem(K_DELETED) || "{}"); } catch { deletedStudents = {}; }
        try { revenueByDate = JSON.parse(localStorage.getItem(K_REVENUE) || "{}"); } catch { revenueByDate = {}; }
        try { extraIds = JSON.parse(localStorage.getItem(K_EXTRA_IDS) || "[]"); } catch { extraIds = []; }
        try { attByDate = JSON.parse(localStorage.getItem(K_ATT_BY_DATE) || "{}"); } catch { attByDate = {}; }
        termFee = toInt(localStorage.getItem(K_TERM_FEE)) || 0;
        if(!attByDate) attByDate={}; if(!revenueByDate) revenueByDate={};

        const savedTheme = localStorage.getItem(K_THEME) || "classic";
        if(savedTheme === "dark") document.body.classList.add("theme-dark");
        if(savedTheme === "glass") document.body.classList.add("theme-glass");
        if($("themeSelector")) $("themeSelector").value = savedTheme;

        const savedBg = localStorage.getItem(K_BG_IMAGE);
        if(savedBg) document.body.style.backgroundImage = `url('${savedBg}')`;

        if($("termFeeInp")) $("termFeeInp").value = termFee > 0 ? termFee : "";
        updateTopStats();
        
        // Backup Check
        const last = localStorage.getItem(K_LAST_BACKUP);
        const now = Date.now();
        if(!last || (now - parseInt(last) > 24 * 60 * 60 * 1000)) $("backupDot").classList.remove("hidden");
        else $("backupDot").classList.add("hidden");
    };

    // Apply Permissions
    const applyPermissions = () => {
        const isAdmin = (currentUserRole === "admin");
        document.querySelectorAll(".adminOnly").forEach(el => {
            if(isAdmin) el.classList.remove("hidden"); else el.classList.add("hidden");
        });
        if(!isAdmin) {
            if($("deleteStudentBtn")) $("deleteStudentBtn").classList.add("hidden");
            if($("correctPayBtn")) $("correctPayBtn").classList.add("hidden");
        }
    };

    // Global Functions (Window)
    window.extOpen = (id) => { updateStudentUI(id); document.querySelector(".studentCard").scrollIntoView({behavior:"smooth"}); };
    window.restoreSt = (id) => {
        const st = deletedStudents[id];
        if(students[id] && (students[id].name || students[id].paid>0) && !confirm("Occupied. Overwrite?")) return;
        students[id] = st; delete deletedStudents[id];
        saveAll(); renderBinList(); updateTopStats(); alert("Restored"); window.extOpen(id);
    };

    // ====== 3. EVENT LISTENERS ======

    // Auth
    on("loginBtn", "click", () => {
        const u=$("user").value.trim(), p=$("pass").value.trim();
        if(u===ADMIN_USER && p===ADMIN_PASS) { localStorage.setItem(K_AUTH,"1"); localStorage.setItem(K_ROLE,"admin"); location.reload(); }
        else if(u.toLowerCase()===ASST_USER.toLowerCase() && p===ASST_PASS) { localStorage.setItem(K_AUTH,"1"); localStorage.setItem(K_ROLE,"asst"); location.reload(); }
        else { alert("Error"); playSound("error"); }
    });
    on("logoutBtn", "click", () => { localStorage.removeItem(K_AUTH); location.reload(); });
    on("togglePass", "click", () => { const p=$("pass"); p.type=p.type==="password"?"text":"password"; });

    // Settings
    on("settingsBtn", "click", () => $("settingsModal").classList.remove("hidden"));
    on("closeSettingsBtn", "click", () => $("settingsModal").classList.add("hidden"));
    on("langToggleBtn", "click", () => {
        currentLang = currentLang==="ar"?"en":"ar"; localStorage.setItem(K_LANG, currentLang); location.reload();
    });
    on("themeSelector", "change", (e) => {
        document.body.className = "";
        if(e.target.value!=="classic") document.body.classList.add("theme-"+e.target.value);
        localStorage.setItem(K_THEME, e.target.value);
    });

    // Wallpaper
    on("bgInput", "change", (e) => {
        const file = e.target.files[0]; if(!file) return;
        if(file.size > MAX_IMG_SIZE) { alert("⚠️ Image too large (Max 3MB)"); return; }
        const reader = new FileReader();
        reader.onload = (evt) => setWallpaper(evt.target.result);
        reader.readAsDataURL(file);
    });
    on("clearBgBtn", "click", () => setWallpaper(null));

    // Admin Features
    on("saveFeeBtn", "click", () => {
        if(prompt("Password:") === ADMIN_PASS) {
            termFee = toInt($("termFeeInp").value) || 0; saveAll(); alert("Saved"); updateStudentUI(currentId);
        } else alert("Wrong Password");
    });
    
    // Danger Zone
    on("resetTermBtn", "click", () => {
        if(prompt("Password:") === ADMIN_PASS && confirm("Reset Term?")) {
            for(let k in students) { students[k].paid=0; students[k].attendanceDates=[]; }
            attByDate={}; revenueByDate={}; saveAll(); alert("Done"); location.reload();
        }
    });
    on("resetBtn", "click", () => {
        if(prompt("Password:") === ADMIN_PASS && confirm("WIPE ALL?")) { localStorage.clear(); location.reload(); }
    });

    // Bin
    on("openBinBtn", "click", () => { renderBinList(); $("recycleBinModal").classList.remove("hidden"); });
    on("closeBinBtn", "click", () => $("recycleBinModal").classList.add("hidden"));
    on("emptyBinBtn", "click", () => {
        if(confirm("Permanent Delete?")) { deletedStudents={}; saveAll(); renderBinList(); }
    });

    // Search & Add
    on("openBtn", "click", () => { const id=toInt($("openId").value); if(students[id]) window.extOpen(id); else alert("Not Found"); });
    on("addNewBtn", "click", () => {
        const id=toInt($("newId").value);
        if(!id || students[id]) { alert("Invalid or Exists"); return; }
        students[id] = makeEmptyStudent(id); if(id>BASE_MAX_ID) extraIds.push(id);
        saveAll(); window.extOpen(id); alert("Added");
    });
    
    on("searchAny", "input", (e) => {
        const q = e.target.value.toLowerCase(); const res = $("searchMsg");
        if(!q) { res.style.display="none"; return; }
        const found = Object.values(students).filter(s => (s.name && s.name.toLowerCase().includes(q)) || String(s.id).includes(q) || (s.phone && String(s.phone).includes(q))).slice(0,5);
        res.style.display="block";
        res.innerHTML = found.map(s => `<div class="item" onclick="window.extOpen(${s.id})"><b>${s.name}</b> (${s.id}) ${s.phone?`📞 ${s.phone}`:""}</div>`).join("");
    });

    // Student Actions
    on("saveStudentBtn", "click", () => {
        if(!currentId) return;
        const s = students[currentId];
        s.name=$("stName").value; s.className=$("stClass").value; s.phone=$("stPhone").value; s.notes=$("stNotes").value;
        saveAll(); alert("Saved"); updateTopStats();
    });
    on("addNoteBtn", "click", () => {
        if(!currentId) return;
        const txt = $("newNoteInp").value.trim(); if(!txt) return;
        const stamp = `[${nowDateStr()}]`;
        students[currentId].notes = `${stamp} : ${txt}\n${students[currentId].notes||""}`;
        saveAll(); updateStudentUI(currentId);
    });
    on("markTodayBtn", "click", () => { if(currentId) { addAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
    on("unmarkTodayBtn", "click", () => { if(currentId) { removeAttendance(currentId, nowDateStr()); updateStudentUI(currentId); renderReport(nowDateStr()); }});
    
    on("addPaymentBtn", "click", () => {
        if(!currentId) return; const v=parseInt($("newPaymentInput").value); if(!v) return;
        students[currentId].paid = (students[currentId].paid||0)+v;
        revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0)+v;
        saveAll(); playSound("money"); alert("Deposit Done 💰"); updateStudentUI(currentId); renderReport(nowDateStr());
    });
    on("correctPayBtn", "click", () => {
        if(!currentId) return; const v=parseInt(prompt("Deduct Amount:")); if(!v) return;
        students[currentId].paid = Math.max(0, (students[currentId].paid||0)-v);
        revenueByDate[nowDateStr()] = Math.max(0, (revenueByDate[nowDateStr()]||0)-v);
        saveAll(); alert("Corrected"); updateStudentUI(currentId); renderReport(nowDateStr());
    });
    on("deleteStudentBtn", "click", () => {
        if(currentId && confirm("Delete?")) {
            const st=students[currentId];
            if(st.paid > 0 && confirm("Deduct revenue?")) revenueByDate[nowDateStr()] = (revenueByDate[nowDateStr()]||0) - st.paid;
            deletedStudents[currentId] = JSON.parse(JSON.stringify(st));
            students[currentId] = makeEmptyStudent(currentId);
            if(currentId>BASE_MAX_ID) extraIds = extraIds.filter(x=>x!==currentId);
            saveAll(); alert("Moved to Bin"); updateStudentUI(null); renderReport(nowDateStr());
        }
    });
    on("waBtn", "click", () => {
        const ph = $("stPhone").value; if(ph) window.open(`https://wa.me/20${ph}`, '_blank'); else alert("No Phone");
    });

    // List & QR
    on("quickAttendBtn", "click", () => {
        const id = toInt($("quickAttendId").value);
        const res = addAttendance(id, nowDateStr());
        $("quickMsg").textContent = res.ok ? "Success ✅" : "Already Present ⚠️";
        $("quickMsg").style.display = "block";
        updateStudentUI(id); renderReport(nowDateStr());
        $("quickAttendId").value = ""; $("quickAttendId").focus();
    });

    // Report
    on("reportBtn", "click", () => renderReport($("reportDate").value));
    on("copyReportBtn", "click", () => {
        const d = $("reportDate").value || nowDateStr();
        const txt = `Report ${d}\nCount: ${$("reportCount").textContent}\nRev: ${$("reportMoney").textContent}`;
        navigator.clipboard.writeText(txt).then(() => alert("Copied"));
    });

    // List Modal
    on("openAllStudentsBtn", "click", () => { renderList(); $("allStudentsModal").classList.remove("hidden"); });
    on("closeModalBtn", "click", () => $("allStudentsModal").classList.add("hidden"));
    if($("filterClass")) $("filterClass").addEventListener("change", renderList);
    if($("filterStatus")) $("filterStatus").addEventListener("change", renderList);
    if($("filterAttend")) $("filterAttend").addEventListener("change", renderList);
    on("prevPageBtn", "click", () => { if(currentPage>1) { currentPage--; renderPage(); }});
    on("nextPageBtn", "click", () => { currentPage++; renderPage(); });
    
    // Bulk
    document.addEventListener("change", (e) => {
        if(e.target.classList.contains("stCheckbox")) {
            const c = document.querySelectorAll(".stCheckbox:checked").length;
            $("selectedCount").textContent = c;
            if(c>0) $("bulkActionBar").classList.remove("hidden"); else $("bulkActionBar").classList.add("hidden");
        }
        if(e.target.id === "selectAllCheckbox") {
            document.querySelectorAll(".stCheckbox").forEach(c => c.checked = e.target.checked);
            const c = document.querySelectorAll(".stCheckbox:checked").length;
            $("selectedCount").textContent = c;
            if(c>0) $("bulkActionBar").classList.remove("hidden"); else $("bulkActionBar").classList.add("hidden");
        }
    });
    on("bulkAttendBtn", "click", () => {
        document.querySelectorAll(".stCheckbox:checked").forEach(b => addAttendance(b.dataset.id, nowDateStr()));
        alert("Bulk Attend Done"); renderList();
    });
    on("bulkAbsentBtn", "click", () => {
        document.querySelectorAll(".stCheckbox:checked").forEach(b => removeAttendance(b.dataset.id, nowDateStr()));
        alert("Bulk Absent Done"); renderList();
    });

    // Privacy
    on("privacyBtn", "click", () => { $("todayRevenue").classList.toggle("blurred"); $("stTotalPaid").classList.toggle("blurred"); });

    // Excel
    on("exportExcelBtn", "click", () => {
        if (typeof XLSX === "undefined") return alert("Excel Lib Missing");
        const filled = Object.values(students).filter(st => st.name || st.paid>0).sort((a,b)=>a.id-b.id);
        const wsData = [["ID", "Name", "Class", "Phone", "Paid", "Notes", "History"]];
        filled.forEach(st => wsData.push([st.id, st.name, st.className, st.phone, st.paid, st.notes, (st.attendanceDates||[]).join(", ")]));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Students");
        XLSX.writeFile(wb, `Center_${nowDateStr()}.xlsx`);
        localStorage.setItem(K_LAST_BACKUP, Date.now()); checkBackupStatus();
    });

    on("importExcelInput", "change", async () => {
        const f = $("importExcelInput").files[0]; if(!f) return;
        const wb = XLSX.read(await f.arrayBuffer(), {type:"array"});
        if(!confirm("Overwrite?")) return;
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        students = {}; attByDate = {}; revenueByDate = {}; extraIds = [];
        for (let i = BASE_MIN_ID; i <= BASE_MAX_ID; i++) students[String(i)] = makeEmptyStudent(i);
        rows.forEach(row => {
            const id = parseInt(row["ID"] || row["كود"]);
            if(id) {
                let st = makeEmptyStudent(id);
                st.name = row["Name"] || row["الاسم"] || "";
                st.className = row["Class"] || row["المجموعة"] || "";
                st.phone = row["Phone"] || row["رقم الموبايل"] || "";
                st.paid = parseInt(row["Paid"] || row["المدفوع"] || 0);
                st.notes = row["Notes"] || row["ملاحظات"] || "";
                let hist = row["History"] || row["سجل الحضور"];
                if(hist && typeof hist==='string') {
                    const dates = hist.split(",").map(s=>s.trim()).filter(s=>s);
                    st.attendanceDates = dates;
                    dates.forEach(d => { if(!attByDate[d]) attByDate[d]=[]; if(!attByDate[d].includes(id)) attByDate[d].push(id); });
                }
                students[String(id)] = st; if(id>BASE_MAX_ID) extraIds.push(id);
            }
        });
        saveAll(); alert("Imported"); location.reload();
    });

    // Check QR & Init
    const checkQR = () => {
        const p = new URLSearchParams(window.location.search);
        const id = toInt(p.get("id"));
        if(id && students[id]) { addAttendance(id, nowDateStr()); window.extOpen(id); window.history.replaceState(null,null,window.location.pathname); }
    };

    // Load
    loadAll(); ensureBase500();
    if(localStorage.getItem(K_AUTH)!=="1") $("loginBox").classList.remove("hidden");
    else { $("appBox").classList.remove("hidden"); currentUserRole=localStorage.getItem(K_ROLE); applyPermissions(); setTimeout(checkQR, 500); }
});
