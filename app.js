// ===== إعدادات الدخول (زي ما قلت) =====
const ADMIN_USER = "Admin";
const ADMIN_PASS = "####1111";

// ===== التخزين المحلي =====
const STORAGE_KEY = "center_students_v1";
const AUTH_KEY = "center_admin_authed_v1";

// ===== Helpers =====
function el(id){ return document.getElementById(id); }

function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadDB(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return { students: {} };
  try { return JSON.parse(raw); } catch { return { students: {} }; }
}
function saveDB(db){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getStudent(db, id){
  const sid = String(id);
  if(!db.students[sid]){
    db.students[sid] = {
      id: Number(id),
      name: "",
      phone: "",
      total: "",   // مطلوب
      paid: "",    // مدفوع
      note: "",
      attendance: [] // تواريخ ISO
    };
    saveDB(db);
  }
  return db.students[sid];
}

function normalize(s){
  return (s || "").toString().trim().toLowerCase();
}

function showMsg(targetEl, text, ok=true){
  targetEl.textContent = text;
  targetEl.className = "msg " + (ok ? "ok" : "bad");
}

function clearMsg(targetEl){
  targetEl.textContent = "";
  targetEl.className = "msg";
  targetEl.style.display = "none";
}

// ===== عناصر الصفحة =====
const loginBox = el("loginBox");
const appBox = el("appBox");

const userInp = el("user");
const passInp = el("pass");
const loginBtn = el("loginBtn");
const loginMsg = el("loginMsg");

const logoutBtn = el("logoutBtn");

const openIdInp = el("openId");
const openBtn = el("openBtn");

const searchInp = el("search");
const searchResults = el("searchResults");

const studentBox = el("studentBox");
const s_id = el("s_id");
const s_name = el("s_name");
const s_phone = el("s_phone");
const s_total = el("s_total");
const s_paid = el("s_paid");
const s_note = el("s_note");
const s_days = el("s_days");
const s_last = el("s_last");
const s_dates = el("s_dates");
const s_msg = el("s_msg");

const saveBtn = el("saveBtn");
const markTodayBtn = el("markTodayBtn");

const todayDate = el("todayDate");
const todayCount = el("todayCount");
const todayList = el("todayList");
const refreshTodayBtn = el("refreshTodayBtn");

const init500Btn = el("init500Btn");
const wipeBtn = el("wipeBtn");

// ===== حالة حالية =====
let currentStudentId = null;

// ===== Auth =====
function isAuthed(){
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function setAuthed(on){
  if(on) sessionStorage.setItem(AUTH_KEY, "1");
  else sessionStorage.removeItem(AUTH_KEY);
}

function showApp(){
  loginBox.classList.add("hidden");
  appBox.classList.remove("hidden");
  todayDate.textContent = todayISO();
  renderToday();
  renderSearch(searchInp.value);
}

function showLogin(){
  appBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
}

loginBtn.addEventListener("click", ()=>{
  const u = userInp.value.trim();
  const p = passInp.value;
  if(u === ADMIN_USER && p === ADMIN_PASS){
    setAuthed(true);
    showApp();
    showMsg(loginMsg, "✅ تم الدخول", true);
  }else{
    showMsg(loginMsg, "❌ اسم المستخدم أو كلمة السر غلط", false);
  }
});

logoutBtn.addEventListener("click", ()=>{
  setAuthed(false);
  showLogin();
});

// ===== فتح طالب بالـ ID =====
function openStudent(id){
  const n = Number(id);
  if(!Number.isInteger(n) || n < 1 || n > 500){
    alert("ID لازم يكون رقم من 1 إلى 500");
    return;
  }
  const db = loadDB();
  const st = getStudent(db, n);
  currentStudentId = n;
  fillStudentUI(st);
  studentBox.classList.remove("hidden");
  clearMsg(s_msg);
}

openBtn.addEventListener("click", ()=>{
  openStudent(openIdInp.value);
});

openIdInp.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") openStudent(openIdInp.value);
});

// ===== عرض بيانات الطالب =====
function fillStudentUI(st){
  s_id.textContent = st.id;
  s_name.value = st.name || "";
  s_phone.value = st.phone || "";
  s_total.value = (st.total === "" || st.total === null || st.total === undefined) ? "" : st.total;
  s_paid.value  = (st.paid === ""  || st.paid === null  || st.paid === undefined)  ? "" : st.paid;
  s_note.value  = st.note || "";

  const dates = (st.attendance || []).slice().sort();
  s_days.textContent = dates.length;
  s_last.textContent = dates.length ? dates[dates.length-1] : "—";

  s_dates.innerHTML = "";
  dates.slice().reverse().slice(0, 40).forEach(d=>{
    const chip = document.createElement("div");
    chip.className = "datechip";
    chip.textContent = d;
    s_dates.appendChild(chip);
  });
}

function readStudentUIInto(st){
  st.name = s_name.value.trim();
  st.phone = s_phone.value.trim();
  st.note = s_note.value.trim();
  st.total = (s_total.value === "") ? "" : Number(s_total.value);
  st.paid  = (s_paid.value === "")  ? "" : Number(s_paid.value);
  return st;
}

// ===== حفظ بيانات =====
saveBtn.addEventListener("click", ()=>{
  if(!currentStudentId){
    alert("افتح طالب الأول");
    return;
  }
  const db = loadDB();
  const st = getStudent(db, currentStudentId);
  readStudentUIInto(st);
  db.students[String(currentStudentId)] = st;
  saveDB(db);
  showMsg(s_msg, "✅ تم حفظ البيانات", true);
  renderSearch(searchInp.value);
  renderToday();
});

// ===== تسجيل حضور اليوم =====
markTodayBtn.addEventListener("click", ()=>{
  if(!currentStudentId){
    alert("افتح طالب الأول");
    return;
  }
  const db = loadDB();
  const st = getStudent(db, currentStudentId);

  // احفظ أي تعديلات قبل تسجيل الحضور
  readStudentUIInto(st);

  const t = todayISO();
  if(!st.attendance.includes(t)){
    st.attendance.push(t);
    db.students[String(currentStudentId)] = st;
    saveDB(db);
    fillStudentUI(st);
    showMsg(s_msg, `✅ اتسجل حضور اليوم (${t})`, true);
  }else{
    showMsg(s_msg, `ℹ️ حضور اليوم متسجل بالفعل (${t})`, true);
  }
  renderToday();
});

// ===== بحث =====
function renderSearch(q){
  const db = loadDB();
  const query = normalize(q);

  searchResults.innerHTML = "";

  const all = Object.values(db.students);
  const filtered = all.filter(s=>{
    if(!query) return true;
    const idMatch = String(s.id) === query;
    const nameMatch = normalize(s.name).includes(query);
    const phoneMatch = normalize(s.phone).includes(query);
    return idMatch || nameMatch || phoneMatch;
  }).sort((a,b)=>a.id-b.id).slice(0, 80);

  if(!filtered.length){
    const d = document.createElement("div");
    d.className = "muted";
    d.textContent = "مفيش نتائج.";
    searchResults.appendChild(d);
    return;
  }

  filtered.forEach(s=>{
    const item = document.createElement("div");
    item.className = "item";
    const nm = s.name ? s.name : "— (فاضي) —";
    const ph = s.phone ? s.phone : "—";
    const tot = (s.total === "" ? "—" : String(s.total));
    const paid = (s.paid === "" ? "—" : String(s.paid));
    item.innerHTML = `<b>${escapeHTML(nm)}</b><div class="muted">ID: ${s.id} • موبايل: ${escapeHTML(ph)} • مطلوب: ${escapeHTML(tot)} • مدفوع: ${escapeHTML(paid)}</div>`;
    item.addEventListener("click", ()=>openStudent(s.id));
    searchResults.appendChild(item);
  });
}

searchInp.addEventListener("input", ()=>{
  renderSearch(searchInp.value);
});

function escapeHTML(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ===== حضور اليوم =====
function renderToday(){
  todayDate.textContent = todayISO();
  const db = loadDB();
  const t = todayISO();

  const list = Object.values(db.students)
    .filter(s => (s.attendance || []).includes(t))
    .sort((a,b)=>a.id-b.id);

  todayCount.textContent = String(list.length);
  todayList.innerHTML = "";

  if(!list.length){
    const d = document.createElement("div");
    d.className = "muted";
    d.textContent = "محدّش اتسجل حضوره النهارده لسه.";
    todayList.appendChild(d);
    return;
  }

  list.forEach(s=>{
    const item = document.createElement("div");
    item.className = "item";
    const nm = s.name ? s.name : "— (فاضي) —";
    const ph = s.phone ? s.phone : "—";
    item.innerHTML = `<b>${escapeHTML(nm)}</b><div class="muted">ID: ${s.id} • موبايل: ${escapeHTML(ph)} • Note: ${escapeHTML(s.note || "—")}</div>`;
    item.addEventListener("click", ()=>openStudent(s.id));
    todayList.appendChild(item);
  });
}

refreshTodayBtn.addEventListener("click", renderToday);

// ===== تجهيز 500 طالب =====
init500Btn.addEventListener("click", ()=>{
  const db = loadDB();
  for(let i=1;i<=500;i++){
    if(!db.students[String(i)]){
      db.students[String(i)] = {
        id: i, name:"", phone:"", total:"", paid:"", note:"",
        attendance: []
      };
    }
  }
  saveDB(db);
  alert("✅ تم تجهيز IDs من 1 إلى 500 (فاضيين).");
  renderSearch(searchInp.value);
});

// ===== مسح كل البيانات =====
wipeBtn.addEventListener("click", ()=>{
  if(!confirm("تحذير: هيمسح كل بيانات الطلاب والحضور من الجهاز. متأكد؟")) return;
  localStorage.removeItem(STORAGE_KEY);
  alert("تم المسح.");
  location.reload();
});

// ===== تشغيل مبدئي =====
if(isAuthed()) showApp();
else showLogin();
