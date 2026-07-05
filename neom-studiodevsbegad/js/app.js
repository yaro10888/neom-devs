// ============================================================
//  نقطة البداية: التوجيه + الهيكل العام + العداد الحي
// ============================================================
import { state, isAdmin, loadData, restoreSession } from "./store.js";
import { isConfigured } from "./supabase.js";
import { icon, drawIcons, neomMark, fmtRemain } from "./ui.js";
import { authHTML, bindAuth, pendingHTML, bindPending, blockedHTML, bindBlocked, logout } from "./auth.js";
import { profileHTML } from "./profile.js";
import { tasksHTML, bindTasks } from "./tasks.js";
import { adminHTML, bindAdmin } from "./admin.js";

const app = document.getElementById("app");

// -------- شاشة تنبيه لو الإعدادات لسه مش متحطوطة --------
function configNoticeHTML(){
  return `
  <div class="center-screen" dir="rtl">
    <div class="gridbg"></div>
    <div class="fade win" style="width:100%;max-width:600px;position:relative;z-index:2">
      <div class="wbar"><span class="dot" style="background:#e8636f"></span><span class="dot" style="background:#e8bb63"></span><span class="dot" style="background:#5fd7c1"></span><span class="mono t-faint" style="font-size:12px;margin-inline-start:8px">neom://setup</span></div>
      <div style="padding:30px 26px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">${neomMark(34)}<h2 style="margin:0;font-size:20px">مطلوب خطوة إعداد بسيطة</h2></div>
        <p class="t-dim" style="font-size:14px;line-height:2">الموقع شغّال، بس لسه محتاج تربطه بقاعدة البيانات. اعمل الآتي بالترتيب:</p>
        <ol class="t-dim" style="font-size:14px;line-height:2.1;padding-inline-start:20px">
          <li>افتح ملف <span class="mono t-acc">database.sql</span> وانسخه، والصقه في Supabase ← <span class="mono">SQL Editor</span> ← <span class="mono">New query</span> ← <span class="mono">Run</span>.</li>
          <li>هات <span class="mono t-acc">Project URL</span> و<span class="mono t-acc">anon public key</span> من <span class="mono">Project Settings ← API</span>.</li>
          <li>حطّهم في ملف <span class="mono t-acc">js/config.js</span> ثم أعد تحميل الصفحة.</li>
        </ol>
        <div class="bdsoft" style="border-radius:10px;background:#0e1119;padding:13px;margin-top:8px">
          <div class="mono t-faint" style="font-size:11px;margin-bottom:6px">// الملف: js/config.js</div>
          <div class="mono" style="font-size:12.5px;line-height:1.9" dir="ltr"><span class="t-violet">export const</span> SUPABASE_URL = <span class="t-teal">"https://xxx.supabase.co"</span>;<br/><span class="t-violet">export const</span> SUPABASE_ANON_KEY = <span class="t-teal">"eyJhbGci..."</span>;</div>
        </div>
        <p class="t-faint" style="font-size:12px;margin-top:16px">${icon("terminal",12)} التفاصيل الكاملة موجودة في ملف <span class="mono">README.md</span>.</p>
      </div>
    </div>
  </div>`;
}

// -------- الهيكل العام للتطبيق (بعد الدخول) --------
function appShellHTML(){
  const me = state.session;
  const admin = isAdmin(me);
  const nav = (page, label, ic) =>
    `<div class="snav ${state.page===page?"on":""}" data-nav="${page}">${icon(ic,18)}<span>${label}</span></div>`;

  const sidebar = `
    <div class="sidebar surf bd ${state.sidebarOpen?"open":""}" style="border-radius:0">
      <div style="display:flex;align-items:center;gap:11px;padding:6px 8px 16px;border-bottom:1px solid var(--border);margin-bottom:14px">
        ${neomMark(34)}
        <div><div style="font-weight:700;font-size:16px;line-height:1">Neom</div><div class="mono t-faint" style="font-size:10px">studio</div></div>
        <button class="hamburger" data-closebar style="margin-inline-start:auto;background:none;border:none;color:var(--faint);cursor:pointer">${icon("x",20)}</button>
      </div>
      <nav style="display:grid;gap:5px">
        ${nav("profile","الملف الشخصي","user")}
        ${nav("tasks","المهام","list-todo")}
        ${admin ? nav("admin","الإدارة","shield") : ""}
      </nav>
      <div style="margin-top:auto;padding-top:14px;border-top:1px solid var(--border)">
        <div class="card2 bd" style="border-radius:11px;padding:10px 12px;display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#5a6ad8,#33b8a0);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${(me.name.trim()[0]||"?")}</div>
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${me.name}</div><div class="mono t-faint" style="font-size:10px">${me.rank}</div></div>
        </div>
        <button class="btn btn-ghost btn-sm" data-logout style="width:100%">${icon("log-out",15)} تسجيل الخروج</button>
      </div>
    </div>`;

  const page = state.page === "profile" ? profileHTML()
             : state.page === "tasks"   ? tasksHTML()
             : admin                    ? adminHTML()
             : profileHTML();

  return `
  <div class="app-wrap" dir="rtl">
    <div class="gridbg"></div>
    ${state.sidebarOpen ? `<div class="overlay" data-closebar></div>` : ""}
    ${sidebar}
    <div class="main">
      <div class="topbar surf bdb">
        <button class="hamburger btn btn-ghost btn-sm" data-openbar>${icon("terminal",16)}</button>
        <span class="mono t-faint" style="font-size:13px">~/neom/<span class="t-acc">${state.page}</span></span>
        <span class="chip" style="margin-inline-start:auto;gap:7px"><span class="dot blink" style="width:8px;height:8px;background:var(--teal)"></span><span style="font-size:12px">متصل</span></span>
      </div>
      <div class="page-pad">${page}</div>
    </div>
  </div>`;
}

// -------- التوجيه الرئيسي --------
function render(){
  if (!isConfigured){ app.innerHTML = configNoticeHTML(); drawIcons(); return; }

  if (state.screen === "auth"){ app.innerHTML = authHTML(); drawIcons(); bindAuth(app); return; }
  if (state.screen === "pending"){ app.innerHTML = pendingHTML(); drawIcons(); bindPending(app); return; }
  if (state.screen === "blocked"){ app.innerHTML = blockedHTML(); drawIcons(); bindBlocked(app); return; }

  // شاشة التطبيق
  app.innerHTML = appShellHTML();
  drawIcons();

  app.querySelectorAll("[data-nav]").forEach(el => el.addEventListener("click", async () => {
    state.page = el.dataset.nav; state.sidebarOpen = false;
    if (state.page === "admin" && isAdmin(state.session)){ try{ await loadData(); }catch(e){} }
    render();
  }));
  app.querySelector("[data-openbar]")?.addEventListener("click", () => { state.sidebarOpen = true; render(); });
  app.querySelectorAll("[data-closebar]").forEach(el => el.addEventListener("click", () => { state.sidebarOpen = false; render(); }));
  app.querySelector("[data-logout]")?.addEventListener("click", () => logout());

  if (state.page === "tasks") bindTasks(app);
  if (state.page === "admin" && isAdmin(state.session)) bindAdmin(app);
}

// إعادة الرسم عند أي تغيير من أي ملف
document.addEventListener("app:render", render);

// -------- العداد الحي: يحدّث المتبقي كل ثانية بدون إعادة رسم --------
setInterval(() => {
  document.querySelectorAll("[data-deadline]").forEach(span => {
    const rem = fmtRemain(span.dataset.deadline);
    span.textContent = rem || "انتهت";
  });
}, 1000);

// -------- تحديث تلقائي لما ترجع لتبويب الموقع (وإنت في قائمة المستخدمين) --------
window.addEventListener("focus", async () => {
  if (state.screen === "app" && state.page === "admin" && state.adminTab === "users"
      && isAdmin(state.session) && !document.getElementById("modal-host")){
    try{ await loadData(); render(); }catch(e){}
  }
});

// شاشة تحميل بسيطة أثناء استرجاع الجلسة
function loadingHTML(){
  return `<div class="center-screen" dir="rtl"><div class="gridbg"></div>
    <div style="text-align:center;position:relative;z-index:2">
      ${neomMark(46)}
      <div style="margin-top:16px;display:flex;align-items:center;gap:9px;justify-content:center">
        ${icon("loader-circle",18,"t-acc spin")}<span class="mono t-dim" style="font-size:13px">جارٍ التحميل…</span>
      </div>
    </div></div>`;
}

// -------- الإقلاع: استرجاع تسجيل الدخول المحفوظ --------
async function boot(){
  if (!isConfigured){ render(); return; }
  app.innerHTML = loadingHTML(); drawIcons();
  try{
    const u = await restoreSession();
    if (u){
      state.session = u;
      if (u.banned){ state.blockInfo = { type:"ban", reason:u.ban_reason }; state.screen = "blocked"; }
      else if (u.kicked){ state.blockInfo = { type:"kick", reason:u.kick_reason }; state.screen = "blocked"; }
      else if (!u.verified){ state.screen = "pending"; }   // يفضل تحت التوثيق مهما فتح وقفل
      else { await loadData(); state.page = "profile"; state.screen = "app"; }
    }
  }catch(e){ /* أي خطأ: نرجع لشاشة الدخول */ }
  render();
}

// انطلاق
boot();
