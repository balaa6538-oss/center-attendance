// ===== دخول =====
const ADMIN_USER = "Admin";
const ADMIN_PASS = "####1111";

const DB_KEY = "center_db_v2";
const AUTH_KEY = "center_auth_v2";
const PENDING_ID_KEY = "center_pending_id_v2";

// ===== أدوات =====
function el(id){ return document.getElementById(id); }

function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function readQueryId(){
  const sp = new URLSearchParams(location.search);
  const v = sp.get("id");
  if(!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function setMsg(node, text, ok=true){
  node.textContent = text;
  node.className = "msg " + (ok ? "ok" : "bad");
}

function clearMsg(node){
  node.textContent = "";
  node.className = "msg";
  node.style.display = "none";
}

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveDB(db){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ensureDB(){
  let db = loadDB();
  if(db && db.students) return db;

  // إنشاء 500 طالب فاضيين (1..500)
  db = { students: {} };
  for(let i=1;i<=500;i++){
    db.students[String(i)] = {
      id: i,
      name: "",
      grade: "",
      phone: "",
      paid: "",
      attendance: [] // ISO dates
    };
  }
  saveDB(db);
  return db;
}

function getStudent(db, id){
  const k = String(id);
  if(!db.students[k]){
    // لو ID جديد خارج الـ 500
    db.students[k] = {
      id: id,
      name: "",
      grade: "",
      phone: "",
      paid: "",
      attendance: []
    };
    saveDB(db);
  }
  return db.students[k];
}

function isAuthed(){
  return localStorage.getItem(AUTH_KEY) === "1";
}

function setAuthed(v){
  if(v) localStorage.setItem(AUTH_KEY, "1");
  else localStorage.removeItem(AUTH_KEY);
}

// ===== عناصر الصفحة =====
const loginBox = el("loginBox");
const appBox = el("appBox");

const userInp = el("user");
const passInp = el("pass");
const loginBtn = el("loginBtn");
const loginMsg = el("loginMsg");
const logoutBtn = el("logoutBtn");

const togglePassBtn = el("togglePass");

const quickId = el("quickId");
const quickAttendBtn = el("quickAttendBtn");

const searchId = el("searchId");
const openOnlyBtn = el("openOnlyBtn");

const addStudentBtn = el("addStudentBtn");

const datePick = el("datePick");
const showByDateBtn = el("showByDateBtn");
const shownDate = el("shownDate");
const shownCount = el("shownCount");
const shownList = el("shownList");

const resetDeviceBtn = el("resetDeviceBtn");

// Student UI
const studentEmpty = el("studentEmpty");
const studentBox = el("studentBox");

const s_id = el("s_id");
const s_today = el("s_today");
const s_days = el("s_days");

const s_name = el("s_name");
const s_grade = el("s_grade");
const s_phone = el("s_phone");
const s_paid = el("s_paid");

const saveBtn = el("saveBtn");
const toggleTodayBtn = el("toggleTodayBtn");
const studentMsg = el("studentMsg");
const datesBox = el("datesBox");

let currentId = null;

// ===== عرض/إخفاء =====
function showLogin(){
  appBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
}

function showApp(){
  loginBox.classList.add("hidden");
  appBox.classList.remove("hidden");
  // default date = today
  if(datePick) datePick.value = todayISO();
  renderAttendanceByDate(datePick?.value || todayISO());
}

// ===== تسجيل دخول =====
loginBtn.addEventListener("click", ()=>{
  const u = userInp.value.trim();
  const p = passInp.value;

  if(u === ADMIN_USER && p === ADMIN_PASS){
    setAuthed(true);
    showApp();
    setMsg(loginMsg, "✅ تم الدخول", true);

    // لو فيه ID كان جاي من QR قبل الدخول
    const pending = sessionStorage.getItem(PENDING_ID_KEY);
    if(pending){
      sessionStorage.removeItem(PENDING_ID_KEY);
      const pid = Number(pending);
      if(Number.isInteger(pid)){
        openStudent(pid, true); // تسجيل حضور تلقائي
      }
    }
  }else{
    setMsg(loginMsg, "❌ اسم المستخدم أو كلمة المرور غلط", false);
  }
});

logoutBtn.addEventListener("click", ()=>{
  setAuthed(false);
  currentId = null;
  hideStudent();
  showLogin();
});

togglePassBtn?.addEventListener("click", ()=>{
  passInp.type = (passInp.type === "password") ? "text" : "password";
});

// ===== الطالب =====
function hideStudent(){
  studentBox.classList.add("hidden");
  studentEmpty.classList.remove("hidden");
  clearMsg(studentMsg);
  datesBox.innerHTML = "";
}

function fillStudentUI(st){
  currentId = st.id;

  s_id.textContent = st.id;
  s_name.value = st.name || "";
  s_grade.value = st.grade || "";
  s_phone.value = st.phone || "";
  s_paid.value = (st.paid === "" || st.paid === null || st.paid === undefined) ? "" : st.paid;

  const t = todayISO();
  const dates = (st.attendance || []).slice().sort();
  const hasToday = dates.includes(t);

  s_today.textContent = hasToday ? "حاضر ✅" : "غير حاضر ❌";
  s_days.textContent = String(dates.length);

  toggleTodayBtn.textContent = hasToday ? "❌ إلغاء حضور اليوم" : "✅ تسجيل حضور اليوم";

  // عرض آخر 25 تاريخ
  datesBox.innerHTML = "";
  dates.slice().reverse().slice(0,25).forEach(d=>{
    const chip = document.createElement("div");
    chip.className = "datechip";
    chip.textContent = d;
    datesBox.appendChild(chip);
  });

  studentEmpty.classList.add("hidden");
  studentBox.classList.remove("hidden");
}

function readStudentUIInto(st){
  st.name = s_name.value.trim();
  st.grade = s_grade.value.trim();
  st.phone = s_phone.value.trim();
  st.paid = (s_paid.value === "") ? "" : Number(s_paid.value);
  return st;
}

function openStudent(id, autoAttend=false){
  const n = Number(id);
  if(!Number.isInteger(n) || n < 1){
    alert("ID لازم يكون رقم صحيح");
    return;
  }

  const db = ensureDB();
  const st = getStudent(db, n);

  // اعرض بياناته
  fillStudentUI(st);
  clearMsg(studentMsg);

  // لو autoAttend = true يسجل حضور اليوم تلقائي (مرة واحدة فقط)
  if(autoAttend){
    markTodayForCurrent(true);
  }
}

function markTodayForCurrent(silent=false){
  if(!currentId){
    if(!silent) alert("افتح طالب الأول");
    return;
  }
  const db = ensureDB();
  const st = getStudent(db, currentId);

  // احفظ أي تعديلات قبل تسجيل/إلغاء
  readStudentUIInto(st);

  const t = todayISO();
  st.attendance = st.attendance || [];

  const idx = st.attendance.indexOf(t);
  if(idx === -1){
    st.attendance.push(t);
    db.students[String(currentId)] = st;
    saveDB(db);
    fillStudentUI(st);
    if(!silent) setMsg(studentMsg, `✅ تم تسجيل حضور اليوم (${t})`, true);
  }else{
    // موجود بالفعل
    fillStudentUI(st);
    if(!silent) setMsg(studentMsg, `ℹ️ حضور اليوم مسجل بالفعل (${t})`, true);
  }

  // تحديث قائمة الحضور
  renderAttendanceByDate(datePick?.value || todayISO());
}

function toggleTodayForCurrent(){
  if(!currentId){
    alert("افتح طالب الأول");
    return;
  }
  const db = ensureDB();
  const st = getStudent(db, currentId);

  readStudentUIInto(st);

  const t = todayISO();
  st.attendance = st.attendance || [];

  const idx = st.attendance.indexOf(t);
  if(idx !== -1){
    st.attendance.splice(idx, 1);
    db.students[String(currentId)] = st;
    saveDB(db);
    fillStudentUI(st);
    setMsg(studentMsg, `✅ تم إلغاء حضور اليوم (${t})`, true);
  }else{
    st.attendance.push(t);
    db.students[String(currentId)] = st;
    saveDB(db);
    fillStudentUI(st);
    setMsg(studentMsg, `✅ تم تسجيل حضور اليوم (${t})`, true);
  }

  renderAttendanceByDate(datePick?.value || todayISO());
}

// ===== أزرار =====
quickAttendBtn.addEventListener("click", ()=>{
  openStudent(quickId.value, true); // حضور تلقائي
});

quickId.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") openStudent(quickId.value, true);
});

openOnlyBtn.addEventListener("click", ()=>{
  openStudent(searchId.value, false);
});

searchId.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") openStudent(searchId.value, false);
});

saveBtn.addEventListener("click", ()=>{
  if(!currentId){
    alert("افتح طالب الأول");
    return;
  }
  const db = ensureDB();
  const st = getStudent(db, currentId);
  readStudentUIInto(st);
  db.students[String(currentId)] = st;
  saveDB(db);
  fillStudentUI(st);
  setMsg(studentMsg, "✅ تم حفظ البيانات", true);
});

toggleTodayBtn.addEventListener("click", ()=>{
  toggleTodayForCurrent();
});

addStudentBtn.addEventListener("click", ()=>{
  const db = ensureDB();
  const ids = Object.keys(db.students).map(Number).filter(n=>Number.isInteger(n));
  const maxId = ids.length ? Math.max(...ids) : 500;
  const newId = maxId + 1;
  openStudent(newId, false);
  setMsg(studentMsg, `✅ تم إنشاء طالب جديد ID = ${newId}`, true);
});

resetDeviceBtn.addEventListener("click", ()=>{
  if(!confirm("تحذير: سيتم مسح كل بيانات الطلاب والحضور من هذا الجهاز. متأكد؟")) return;
  localStorage.removeItem(DB_KEY);
  alert("تم المسح. أعد تحميل الصفحة.");
  location.reload();
});

// ===== حضور بتاريخ =====
function renderAttendanceByDate(dateStr){
  const d = dateStr || todayISO();
  shownDate.textContent = d;

  const db = ensureDB();
  const list = Object.values(db.students)
    .filter(s => (s.attendance || []).includes(d))
    .sort((a,b)=>a.id-b.id);

  shownCount.textContent = String(list.length);
  shownList.innerHTML = "";

  if(list.length === 0){
    const div = document.createElement("div");
    div.className = "muted";
    div.textContent = "لا يوجد حضور في هذا التاريخ.";
    shownList.appendChild(div);
    return;
  }

  list.forEach(s=>{
    const item = document.createElement("div");
    item.className = "item";
    const nm = s.name ? s.name : "— بدون اسم —";
    item.innerHTML = `<b>${escapeHTML(nm)}</b><div class="muted">ID: ${s.id} • موبايل: ${escapeHTML(s.phone || "—")} • الصف: ${escapeHTML(s.grade || "—")}</div>`;
    item.addEventListener("click", ()=>openStudent(s.id, false));
    shownList.appendChild(item);
  });
}

showByDateBtn.addEventListener("click", ()=>{
  renderAttendanceByDate(datePick.value || todayISO());
});

function escapeHTML(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ===== تشغيل =====
(function boot(){
  ensureDB();

  if(isAuthed()){
    showApp();

    const qid = readQueryId();
    if(qid){
      // لو داخل بالفعل: افتح الطالب وسجل حضور تلقائي
      openStudent(qid, true);
      // نضيف تنظيف اختياري للرابط (علشان ما يعيدش تسجيل عند الريفريش)
      // التاريخ لن يتكرر أصلاً، بس ده أنضف
      history.replaceState({}, "", location.pathname);
    }
  }else{
    showLogin();

    const qid = readQueryId();
    if(qid){
      // جاي من QR ولسه مش داخل -> نخزن ID مؤقت
      sessionStorage.setItem(PENDING_ID_KEY, String(qid));
    }
  }

  // ضبط التاريخ على اليوم
  if(datePick) datePick.value = todayISO();
})();
