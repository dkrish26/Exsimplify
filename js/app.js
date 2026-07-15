/* ============================================================
   ExSimplify — app logic
   ------------------------------------------------------------
   Firebase config lives in js/config.js
   Categories / tabs / reminder leads live in js/categories.js
   ============================================================ */

import { firebaseConfig, FIREBASE_READY } from "./config.js";
import { CATEGORIES, TABS, FREQ_MONTHS, FREQ_LABEL } from "./categories.js";

/* ---------- State ---------- */
let items = [];
let user = null;
let editingId = null;
let activeTab = "home";
let db = null, auth = null, unsubscribe = null, fs = null;

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const modalBackdrop = $("modalBackdrop");

/* ---------- Init ---------- */
init();

async function init() {
  buildCategorySelect();
  buildRunwayMonths();
  wireEvents();
  registerSW();

  if (FIREBASE_READY) {
    try {
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      fs = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

      const app = appMod.initializeApp(firebaseConfig);
      auth = authMod.getAuth(app);
      db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() });

      $("signInBtn").hidden = false;
      $("signInBtn").onclick = () => authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
      $("userBtn").onclick = () => { if (confirm("Sign out?")) authMod.signOut(auth); };

      authMod.onAuthStateChanged(auth, (u) => {
        user = u;
        $("signInBtn").hidden = !!u;
        $("userBtn").hidden = !u;
        if (u) { $("userAvatar").src = u.photoURL || ""; subscribeItems(); }
        else { if (unsubscribe) unsubscribe(); items = []; renderAll(); }
      });
    } catch (e) {
      console.error("Firebase init failed, falling back to local mode:", e);
      enterLocalMode();
    }
  } else {
    enterLocalMode();
  }
}

function enterLocalMode() {
  $("setupBanner").hidden = false;
  items = JSON.parse(localStorage.getItem("exsimplify_items") || "[]");
  renderAll();
}

function subscribeItems() {
  const col = fs.collection(db, "users", user.uid, "items");
  unsubscribe = fs.onSnapshot(col, (snap) => {
    items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAll();
  });
}

/* ---------- Persistence ---------- */
async function saveItem(item) {
  if (user && db) {
    const ref = item.id
      ? fs.doc(db, "users", user.uid, "items", item.id)
      : fs.doc(fs.collection(db, "users", user.uid, "items"));
    await fs.setDoc(ref, { ...item, id: ref.id });
  } else {
    if (!item.id) item.id = "loc_" + Date.now();
    const i = items.findIndex((x) => x.id === item.id);
    if (i >= 0) items[i] = item; else items.push(item);
    localStorage.setItem("exsimplify_items", JSON.stringify(items));
    renderAll();
  }
}

async function removeItem(id) {
  if (user && db) {
    await fs.deleteDoc(fs.doc(db, "users", user.uid, "items", id));
  } else {
    items = items.filter((x) => x.id !== id);
    localStorage.setItem("exsimplify_items", JSON.stringify(items));
    renderAll();
  }
}

/* ---------- Helpers ---------- */
const DAY = 86400000;
function catOf(it) { return CATEGORIES.find((c) => c.id === it.category) || CATEGORIES.at(-1); }
function leadOf(it) { return Number.isFinite(it.lead) ? it.lead : catOf(it).lead; }
function daysLeft(iso) { return Math.floor((new Date(iso + "T00:00") - startOfToday()) / DAY); }
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
/* Smart urgency: relative to each item's own reminder lead */
function urgency(it) {
  const d = daysLeft(it.dueDate), lead = leadOf(it);
  if (d < 0) return "overdue";
  if (d <= lead) return "critical";           // inside its reminder window → act now
  if (d <= lead + 30) return "soon";           // approaching the window
  return "ok";
}
function fmtDate(iso) { return new Date(iso + "T00:00").toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }); }
function fmtAED(n) { return "AED " + Number(n || 0).toLocaleString("en-AE", { maximumFractionDigits: 0 }); }
function monthlyEq(it) { const m = FREQ_MONTHS[it.frequency]; return m ? Number(it.amount || 0) / m : 0; }
function advance(iso, freq) {
  const m = FREQ_MONTHS[freq];
  if (!m) return iso;
  const d = new Date(iso + "T00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + m);
  if (d.getDate() !== day) d.setDate(0); // clamp month-end (Jan 31 → Feb 28/29)
  return d.toISOString().slice(0, 10);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* ---------- Rendering ---------- */
function renderAll() {
  renderHome();
  renderTab();
  renderInsuranceWarning();
  maybeNotify();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tabbar .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("homeView").hidden = tab !== "home";
  $("tabView").hidden = tab === "home";
  renderAll();
  window.scrollTo({ top: 0 });
}

/* ----- Home ----- */
function renderHome() {
  if (activeTab !== "home") return;
  renderRunway();

  // Stats
  let monthly = 0, dueThisMonth = 0;
  const now = new Date();
  items.forEach((it) => {
    monthly += monthlyEq(it);
    const due = new Date(it.dueDate + "T00:00");
    if (due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()) dueThisMonth += Number(it.amount || 0);
  });
  $("monthlyBurn").textContent = fmtAED(monthly);
  $("annualBurn").textContent = fmtAED(monthly * 12);
  $("dueMonth").textContent = fmtAED(dueThisMonth);

  // Urgent list: overdue + inside reminder window, most urgent first
  const urgent = items
    .filter((it) => ["overdue", "critical"].includes(urgency(it)))
    .sort((a, b) => daysLeft(a.dueDate) - daysLeft(b.dueDate));
  const ul = $("urgentList");
  ul.innerHTML = "";
  urgent.forEach((it) => ul.appendChild(itemRow(it)));
  $("allClear").hidden = urgent.length > 0;

  // Cancel candidates: subscriptions by monthly cost, most expensive first
  const subs = items
    .filter((it) => catOf(it).tab === "subs" && FREQ_MONTHS[it.frequency])
    .sort((a, b) => monthlyEq(b) - monthlyEq(a))
    .slice(0, 5);
  $("cancelSection").hidden = subs.length === 0;
  const cl = $("cancelList");
  cl.innerHTML = "";
  subs.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <span class="item-emoji">${catOf(it).emoji}</span>
      <div class="item-main">
        <div class="item-name"></div>
        <div class="item-sub">${fmtAED(monthlyEq(it))}/month</div>
      </div>
      <div class="item-right">
        <div class="item-amount">${fmtAED(monthlyEq(it) * 12)}</div>
        <div class="item-sub">per year</div>
      </div>`;
    row.querySelector(".item-name").textContent = it.name;
    row.onclick = () => openModal(it);
    cl.appendChild(row);
  });
}

/* ----- Category tabs ----- */
function renderTab() {
  if (activeTab === "home") return;
  const tabItems = items
    .filter((it) => catOf(it).tab === activeTab)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const monthly = tabItems.reduce((s, it) => s + monthlyEq(it), 0);
  $("tabTotal").textContent = fmtAED(monthly);
  $("tabTotalLabel").textContent = `${TABS[activeTab].title} · monthly`;
  $("tabCount").textContent = tabItems.length;

  const list = $("itemsList");
  list.innerHTML = "";
  $("emptyState").hidden = tabItems.length > 0;
  $("emptyTitle").textContent = `No ${TABS[activeTab].title.toLowerCase()} yet.`;
  $("emptyHint").textContent = TABS[activeTab].hint;

  const groups = { overdue: "Overdue", critical: "Act now", soon: "Coming up", ok: "Later" };
  for (const [key, label] of Object.entries(groups)) {
    const inGroup = tabItems.filter((it) => urgency(it) === key);
    if (!inGroup.length) continue;
    const gl = document.createElement("div");
    gl.className = "group-label";
    gl.textContent = label;
    list.appendChild(gl);
    inGroup.forEach((it) => list.appendChild(itemRow(it)));
  }
}

function itemRow(it) {
  const cat = catOf(it);
  const d = daysLeft(it.dueDate);
  const urg = urgency(it);
  const badgeText = d < 0 ? `${-d}d overdue` : d === 0 ? "today" : `${d}d left`;

  const row = document.createElement("div");
  row.className = "item";
  row.innerHTML = `
    <span class="item-emoji">${cat.emoji}</span>
    <div class="item-main">
      <div class="item-name"></div>
      <div class="item-sub">${fmtDate(it.dueDate)} · ${FREQ_LABEL[it.frequency]}${it.vehicle ? " · " + escapeHtml(it.vehicle) : ""}</div>
    </div>
    <div class="item-right">
      <div class="item-amount">${fmtAED(it.amount)}</div>
      <span class="badge ${urg}">${badgeText}</span>
    </div>`;
  row.querySelector(".item-name").textContent = it.name;
  row.onclick = () => openModal(it);

  if ((urg === "overdue" || urg === "critical") && it.frequency !== "onetime") {
    const btn = document.createElement("button");
    btn.className = "renew-btn";
    btn.textContent = it.frequency === "monthly" ? "Paid ✓" : "Renewed ✓";
    btn.onclick = (e) => {
      e.stopPropagation();
      saveItem({ ...it, dueDate: advance(it.dueDate, it.frequency) });
    };
    row.querySelector(".item-right").appendChild(btn);
  }
  return row;
}

/* ----- Runway ----- */
function buildRunwayMonths() {
  const now = new Date();
  const el = $("runwayMonths");
  el.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const s = document.createElement("span");
    s.textContent = m.toLocaleDateString("en-AE", { month: "short" });
    el.appendChild(s);
  }
}

function renderRunway() {
  const el = $("runway");
  el.innerHTML = "";
  for (let i = 1; i < 12; i++) {
    const t = document.createElement("i");
    t.className = "tick";
    t.style.left = (i / 12) * 100 + "%";
    el.appendChild(t);
  }
  const horizon = 365;
  items.forEach((it) => {
    const d = daysLeft(it.dueDate);
    if (d > horizon) return;
    const m = document.createElement("button");
    m.className = "marker " + urgency(it);
    m.style.left = Math.max(0.5, Math.min(99.5, (Math.max(d, 0) / horizon) * 100)) + "%";
    m.title = `${it.name} — ${fmtDate(it.dueDate)}`;
    m.onclick = () => openModal(it);
    el.appendChild(m);
  });
}

/* ----- UAE gotcha: insurance must be valid before you can pass the car ----- */
function renderInsuranceWarning() {
  const regs = items.filter((i) => i.category === "car_registration");
  const inss = items.filter((i) => i.category === "car_insurance");
  const warnings = [];
  regs.forEach((reg) => {
    const match = inss.find((ins) =>
      (ins.vehicle || "").trim().toLowerCase() === (reg.vehicle || "").trim().toLowerCase()
    ) || (inss.length === 1 && regs.length === 1 ? inss[0] : null);
    if (match && match.dueDate <= reg.dueDate) {
      warnings.push(`⚠️ ${reg.vehicle || reg.name}: insurance expires ${fmtDate(match.dueDate)}, before registration on ${fmtDate(reg.dueDate)}. Renew insurance first — you can't pass the car without it.`);
    }
  });
  const el = $("insuranceWarning");
  el.hidden = warnings.length === 0;
  el.textContent = warnings.join(" ");
}

/* ---------- Notifications (fire when app opens) ---------- */
function maybeNotify() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const stamp = localStorage.getItem("exsimplify_notified");
  const today = new Date().toISOString().slice(0, 10);
  if (stamp === today) return;
  const due = items.filter((it) => ["overdue", "critical"].includes(urgency(it)));
  if (due.length) {
    new Notification("ExSimplify — action needed", {
      body: due.slice(0, 5).map((d) => `${d.name}: ${daysLeft(d.dueDate)}d left`).join("\n"),
      icon: "icons/icon-192.png",
    });
    localStorage.setItem("exsimplify_notified", today);
  }
}

/* ---------- Modal ---------- */
function buildCategorySelect() {
  const sel = $("fCategory");
  for (const [tabId, tab] of Object.entries(TABS)) {
    if (tabId === "home") continue;
    const og = document.createElement("optgroup");
    og.label = tab.title;
    CATEGORIES.filter((c) => c.tab === tabId).forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = `${c.emoji} ${c.label}`;
      og.appendChild(o);
    });
    sel.appendChild(og);
  }
  sel.onchange = () => {
    const cat = CATEGORIES.find((c) => c.id === sel.value);
    $("vehicleField").hidden = !cat.vehicle;
    if (!editingId) {
      $("fFrequency").value = cat.freq;
      $("fLead").value = cat.lead;
    }
  };
}

function openModal(item = null) {
  editingId = item ? item.id : null;
  $("modalTitle").textContent = item ? "Edit expense" : "Add expense";
  $("deleteBtn").hidden = !item;
  const defaultCat = activeTab !== "home" ? CATEGORIES.find((c) => c.tab === activeTab).id : "streaming";
  $("fCategory").value = item?.category || defaultCat;
  const cat = CATEGORIES.find((c) => c.id === $("fCategory").value);
  $("vehicleField").hidden = !cat.vehicle;
  $("fName").value = item?.name || "";
  $("fVehicle").value = item?.vehicle || "";
  $("fAmount").value = item?.amount ?? "";
  $("fFrequency").value = item?.frequency || cat.freq;
  $("fDueDate").value = item?.dueDate || "";
  $("fLead").value = item ? leadOf(item) : cat.lead;
  $("fNotes").value = item?.notes || "";
  modalBackdrop.hidden = false;
  $("fName").focus();
}

function closeModal() { modalBackdrop.hidden = true; editingId = null; }

function wireEvents() {
  document.querySelectorAll(".tabbar .tab").forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));

  $("addBtn").onclick = () => openModal();
  $("cancelBtn").onclick = closeModal;
  modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });

  $("saveBtn").onclick = () => {
    const name = $("fName").value.trim();
    const dueDate = $("fDueDate").value;
    if (!name) return alert("Give it a name.");
    if (!dueDate) return alert("Pick the next due date.");
    saveItem({
      id: editingId,
      name,
      category: $("fCategory").value,
      vehicle: $("fVehicle").value.trim(),
      amount: Number($("fAmount").value || 0),
      frequency: $("fFrequency").value,
      dueDate,
      lead: Math.max(0, Number($("fLead").value || 0)),
      notes: $("fNotes").value.trim(),
    });
    closeModal();
  };

  $("deleteBtn").onclick = () => {
    if (editingId && confirm("Delete this expense?")) { removeItem(editingId); closeModal(); }
  };

  $("notifyBtn").onclick = async () => {
    if (!("Notification" in window)) return alert("Notifications aren't supported in this browser. On iPhone, add ExSimplify to your Home Screen first (Share → Add to Home Screen).");
    const perm = await Notification.requestPermission();
    if (perm === "granted") { alert("Reminders on. You'll get a heads-up when anything enters its reminder window."); maybeNotify(); }
  };

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modalBackdrop.hidden) closeModal(); });
}

/* ---------- Service worker ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.error);
}
