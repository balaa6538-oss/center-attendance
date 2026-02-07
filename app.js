/* =============================================
   Center System V11 (Joker Edition - Auto Fix)
   Features: DOMContentLoaded, Error Handling, Auto-Repair
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // وضعنا الكود كله جوه مستمع الأحداث عشان نضمن إن الصفحة حملت
  console.log("System V11 Started...");

  // ====== 1. SETTINGS & CONSTANTS ======
  const ADMIN_USER = "Admin";
  const ADMIN_PASS = "####1111"; 
  const BASE_MIN_ID = 1;
  const BASE_MAX_ID = 500;

  const KEYS = {
    AUTH: "ca_auth_v11",
    STUDENTS: "ca_students_v6", // Keep v6 to save data
    DATA: "ca_data_v11", // New consolidated data
    LANG: "ca_lang"
  };

  // ====== 2. HELPER FUNCTIONS ======
  const $ = (id) => document.getElementById(id);
  const nowStr = () => new Date().toISOString().split('T')[0];
  const prettyDate = (d) => d ? d.split("-").reverse().join("-") : "—";
  
  // Safe Show Message
  const showMsg = (el, txt, type) => {
    if(el) { el.textContent = txt; el.className = "msg "+type; el.style.display="block"; }
    else alert(txt); // Fallback if element missing
  };

  // ====== 3. STATE MANAGEMENT ======
  let appState = {
    students: {},
    attendance: {},
    revenue: {},
    bin: {},
    termFee: 0,
    lang: localStorage.getItem(KEYS.LANG) || "ar"
  };

  // ====== 4. TRANSLATIONS ======
  const STRINGS = {
    ar: { title: "لوحة السنتر", login_err: "بيانات خاطئة", save: "تم الحفظ", attend: "تم الحضور" },
    en: { title: "Center Panel", login_err: "Wrong Info", save: "Saved", attend: "Checked In" }
  };

  // ====== 5. CORE LOGIC (Load & Save) ======
  function loadData() {
    try {
      // 1. Try Load Students (Old & New)
      const rawSt = localStorage.getItem(KEYS.STUDENTS);
      if(rawSt) appState.students = JSON.parse(rawSt);
      else initBaseStudents();

      // 2. Load Attendance & Revenue
      const rawData = localStorage.getItem(KEYS.DATA);
      if(rawData) {
        const d = JSON.parse(rawData);
        appState.attendance = d.att || {};
        appState.revenue = d.rev || {};
        appState.bin = d.bin || {};
        appState.termFee = d.fee || 0;
      }
      
      console.log("Data Loaded Successfully");
    } catch (e) {
      console.error("Data Corrupted, Fixing...", e);
      initBaseStudents(); // Reset if crash
    }
    applyLang(appState.lang);
    updateUI();
  }

  function saveData() {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(appState.students));
    const metaData = {
      att: appState.attendance,
      rev: appState.revenue,
      bin: appState.bin,
      fee: appState.termFee
    };
    localStorage.setItem(KEYS.DATA, JSON.stringify(metaData));
    updateUI();
  }

  function initBaseStudents() {
    for(let i=1; i<=500; i++) {
      if(!appState.students[i]) appState.students[i] = {id:i, name:"", paid:0, dates:[]};
    }
    saveData();
  }

  function applyLang(lang) {
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
    const btn = $("langBtn");
    if(btn) btn.textContent = lang === "ar" ? "EN" : "ع";
    // Basic Text Updates
    const title = document.querySelector(".brand");
    if(title && STRINGS[lang]) title.childNodes[0].nodeValue = STRINGS[lang].title;
  }

  // ====== 6. MAIN FUNCTIONS ======
  function login() {
    const userInp = $("user");
    const passInp = $("pass");
    if(!userInp || !passInp) return;

    // TRIM FIX FOR MOBILE
    const u = userInp.value.trim();
    const p = passInp.value.trim();

    if(u === ADMIN_USER && p === ADMIN_PASS) {
      localStorage.setItem(KEYS.AUTH, "1");
      showAppScreen();
    } else {
      showMsg($("loginMsg"), STRINGS[appState.lang].login_err, "err");
    }
  }

  function checkAuth() {
    if(localStorage.getItem(KEYS.AUTH) === "1") showAppScreen();
    else showLoginScreen();
  }

  function showLoginScreen() {
    const lb = $("loginBox"); const ab = $("appBox");
    if(lb) lb.classList.remove("hidden");
    if(ab) ab.classList.add("hidden");
  }

  function showAppScreen() {
    const lb = $("loginBox"); const ab = $("appBox");
    if(lb) lb.classList.add("hidden");
    if(ab) ab.classList.remove("hidden");
    updateUI();
  }

  // ====== 7. UI UPDATES ======
  function updateUI() {
    // Stats
    const countEl = $("totalStudentsCount");
    if(countEl) {
      const count = Object.values(appState.students).filter(s => s.name || s.paid > 0).length;
      countEl.textContent = count;
    }
    
    // Revenue
    const revEl = $("todayRevenue");
    if(revEl) {
      const today = nowStr();
      revEl.textContent = (appState.revenue[today] || 0) + " ج";
    }

    // Report List (Basic)
    const repList = $("reportList");
    if(repList) {
        const today = $("reportDate") ? $("reportDate").value : nowStr();
        const ids = appState.attendance[today] || [];
        if(ids.length === 0) repList.innerHTML = "<div class='mutedCenter'>—</div>";
        else {
            repList.innerHTML = ids.map(id => {
                const s = appState.students[id];
                return `<div class="item">(${id}) ${s ? s.name : '?'}</div>`;
            }).join("");
        }
    }
  }

  // ====== 8. EVENT LISTENERS (CRASH PROOF) ======
  function bind(id, event, func) {
    const el = $(id);
    if(el) el.addEventListener(event, func);
    else console.warn("Missing Element:", id);
  }

  // Auth Events
  bind("loginBtn", "click", login);
  bind("logoutBtn", "click", () => {
    localStorage.removeItem(KEYS.AUTH);
    showLoginScreen();
  });
  bind("togglePass", "click", () => {
    const p = $("pass");
    if(p) p.type = p.type==="password"?"text":"password";
  });

  // Actions
  bind("langBtn", "click", () => {
    appState.lang = appState.lang === "ar" ? "en" : "ar";
    localStorage.setItem(KEYS.LANG, appState.lang);
    applyLang(appState.lang);
  });

  bind("darkModeBtn", "click", () => {
    document.body.classList.toggle("dark-mode");
  });

  bind("openBtn", "click", () => {
    const id = parseInt($("openId").value);
    if(appState.students[id]) {
      alert("Opening Student: " + id); // Simple Alert for test
      // Full Open Logic Here (Simplified for safety first)
    } else {
      alert("ID Not Found");
    }
  });

  // Quick Attend (Test)
  bind("quickAttendBtn", "click", () => {
    const id = parseInt($("quickAttendId").value);
    if(appState.students[id]) {
      const today = nowStr();
      if(!appState.attendance[today]) appState.attendance[today] = [];
      if(!appState.attendance[today].includes(id)) {
        appState.attendance[today].push(id);
        alert(STRINGS[appState.lang].attend);
        saveData();
      } else {
        alert("Already here");
      }
    } else {
      alert("ID Error");
    }
  });

  // ====== 9. INITIALIZE ======
  loadData();
  checkAuth();

}); // End of DOMContentLoaded
