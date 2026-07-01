// ============================================================
//  شاشات: تسجيل الدخول / إنشاء حساب / الانتظار / الحظر
// ============================================================
import { state, signup, login, loadData, refreshMe, isAdmin } from "./store.js";
import { rerender } from "./bus.js";
import { esc, icon, drawIcons, toast, neomMark, SPECS, COUNTRIES } from "./ui.js";

const showPw = { on:false };

// حقل عنوان صغير
const F = (ic, label, inner) =>
  `<div><div class="lbl">${ic?icon(ic,13,"t-faint"):""}${label}</div>${inner}</div>`;

// ---------------- شاشة الدخول / التسجيل ----------------
export function authHTML(){
  const tab = state.authTab;
  const inner = tab === "login" ? loginForm() : signupForm();
  return `
  <div class="center-screen" dir="rtl">
    <div class="gridbg"></div>
    <div class="glow floaty" style="width:340px;height:340px;background:rgba(90,106,216,.35);top:-60px;right:-40px"></div>
    <div class="glow floaty" style="width:300px;height:300px;background:rgba(51,184,160,.22);bottom:-80px;left:-40px;animation-delay:2s"></div>

    <div class="fade" style="width:100%;max-width:520px;position:relative;z-index:2">
      <div style="text-align:center;margin-bottom:22px">
        <div class="floaty" style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:18px;background:rgba(142,156,248,.08);border:1px solid var(--border);margin-bottom:12px">${neomMark(36)}</div>
        <h1 style="margin:0;font-size:25px;font-weight:700;letter-spacing:-.5px">Neom <span class="t-acc">Studio</span></h1>
        <p class="t-faint mono" style="margin:6px 0 0;font-size:12.5px">// منصة إدارة المطوّرين</p>
      </div>

      <div class="win">
        <div class="wbar">
          <span class="dot" style="background:#e8636f"></span><span class="dot" style="background:#e8bb63"></span><span class="dot" style="background:#5fd7c1"></span>
          <span class="mono t-faint" style="font-size:12px;margin-inline-start:8px">neom://${tab==="login"?"sign-in":"sign-up"}</span>
          <span style="margin-inline-start:auto">${icon("terminal",14,"t-faint")}</span>
        </div>
        <div style="display:flex;border-bottom:1px solid var(--border)">
          <div class="tab ${tab==="login"?"on":""}" data-tab="login">تسجيل الدخول</div>
          <div class="tab ${tab==="signup"?"on":""}" data-tab="signup">إنشاء حساب</div>
        </div>
        <div style="padding:22px">${inner}</div>
      </div>
      <p class="t-faint mono" style="text-align:center;font-size:11px;margin-top:16px">🔒 جميع البيانات محفوظة في قاعدة البيانات</p>
    </div>
  </div>`;
}

function loginForm(){
  const pw = showPw.on ? "text" : "password";
  return `<div style="display:grid;gap:14px">
    ${F("user","الاسم", `<input id="li-name" class="field" placeholder="اسمك بالكامل"/>`)}
    <div class="grid2">
      ${F("phone","رقم الواتساب", `<input id="li-whatsapp" class="field num" dir="ltr" placeholder="01xxxxxxxxx"/>`)}
      ${F("gamepad-2","اسم روبلكس", `<input id="li-roblox" class="field" dir="ltr" placeholder="Roblox name"/>`)}
    </div>
    ${F("message-square","اسم ديسكورد", `<input id="li-discord" class="field" dir="ltr" placeholder="discord#0000"/>`)}
    ${F("lock","كلمة السر", `<div style="position:relative">
        <input id="li-password" class="field" style="padding-inline-end:40px" type="${pw}" placeholder="••••••••"/>
        <button data-toggle-pw style="position:absolute;inset-inline-end:10px;top:9px;background:none;border:none;cursor:pointer;color:var(--faint)">${icon(showPw.on?"eye-off":"eye",17)}</button>
      </div>`)}
    <button class="btn btn-pri" data-login style="margin-top:4px">تسجيل الدخول ${icon("send",15)}</button>
  </div>`;
}

function signupForm(){
  const specs = SPECS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  const countries = COUNTRIES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  const chev = `<span style="position:absolute;inset-inline-end:11px;top:13px;pointer-events:none">${icon("chevron-down",15,"t-faint")}</span>`;
  return `<div style="display:grid;gap:14px">
    ${F("user","الاسم", `<input id="su-name" class="field" placeholder="اسمك بالكامل"/>`)}
    <div class="grid2">
      ${F("code","التخصص", `<div style="position:relative"><select id="su-spec" class="field">${specs}</select>${chev}</div>`)}
      ${F("hash","العمر", `<input id="su-age" class="field num" type="number" placeholder="مثال: 18"/>`)}
    </div>
    <div class="grid2">
      ${F("phone","رقم الواتساب", `<input id="su-whatsapp" class="field num" dir="ltr" placeholder="01xxxxxxxxx"/>`)}
      ${F("gamepad-2","اسم روبلكس", `<input id="su-roblox" class="field" dir="ltr" placeholder="Roblox name"/>`)}
    </div>
    <div class="grid2">
      ${F("message-square","اسم ديسكورد", `<input id="su-discord" class="field" dir="ltr" placeholder="discord#0000"/>`)}
      ${F("globe","الدولة", `<div style="position:relative"><select id="su-country" class="field">${countries}</select>${chev}</div>`)}
    </div>
    <div class="grid2">
      ${F("lock","كلمة السر", `<input id="su-password" class="field" type="password" placeholder="••••••••"/>`)}
      ${F("lock","تأكيد كلمة السر", `<input id="su-confirm" class="field" type="password" placeholder="••••••••"/>`)}
    </div>
    <button class="btn btn-pri" data-signup style="margin-top:4px">إنشاء الحساب ${icon("plus",16)}</button>
  </div>`;
}

export function bindAuth(root){
  root.querySelectorAll("[data-tab]").forEach(el =>
    el.addEventListener("click", () => { state.authTab = el.dataset.tab; rerender(); }));

  const tgl = root.querySelector("[data-toggle-pw]");
  if (tgl) tgl.addEventListener("click", () => { showPw.on = !showPw.on; rerender(); });

  const loginBtn = root.querySelector("[data-login]");
  if (loginBtn) loginBtn.addEventListener("click", () => doLogin(loginBtn));

  const signupBtn = root.querySelector("[data-signup]");
  if (signupBtn) signupBtn.addEventListener("click", () => doSignup(signupBtn));
}

const val = (id) => (document.getElementById(id)?.value || "").trim();
function busy(btn, on, label){ btn.disabled = on; if (on){ btn.dataset.html = btn.innerHTML; btn.innerHTML = `${icon("loader-circle",15,"spin")} ${label}`; drawIcons(); } else if (btn.dataset.html){ btn.innerHTML = btn.dataset.html; drawIcons(); } }

async function doLogin(btn){
  const whatsapp = val("li-whatsapp"), password = document.getElementById("li-password").value;
  if (!whatsapp || !password) return toast("اكتب رقم الواتساب وكلمة السر", "err");
  busy(btn, true, "جارٍ الدخول…");
  try{
    const u = await login(whatsapp, password);
    if (!u){ busy(btn,false); return toast("بيانات الدخول غير صحيحة", "err"); }
    state.session = u;
    if (u.banned){ state.blockInfo = { type:"ban", reason:u.ban_reason }; state.screen = "blocked"; return rerender(); }
    if (u.kicked){ state.blockInfo = { type:"kick", reason:u.kick_reason }; state.screen = "blocked"; return rerender(); }
    if (!u.verified){ state.screen = "pending"; return rerender(); }
    await loadData();
    state.page = "profile"; state.screen = "app";
    toast(`أهلاً ${u.name.split(" ")[0]} 👋`, "ok");
    rerender();
  }catch(e){ busy(btn,false); toast(e.message, "err"); }
}

async function doSignup(btn){
  const f = {
    name: val("su-name"), specialization: val("su-spec"), age: val("su-age"),
    discord: val("su-discord"), whatsapp: val("su-whatsapp"), roblox: val("su-roblox"),
    country: val("su-country"),
    password: document.getElementById("su-password").value,
    confirm: document.getElementById("su-confirm").value,
  };
  if (!f.name||!f.age||!f.discord||!f.whatsapp||!f.roblox||!f.password||!f.confirm) return toast("من فضلك املأ كل الحقول", "err");
  if (f.password.length < 6) return toast("كلمة السر 6 أحرف على الأقل", "err");
  if (f.password !== f.confirm) return toast("كلمتا السر غير متطابقتين", "err");
  busy(btn, true, "جارٍ الإنشاء…");
  try{
    const u = await signup(f);
    state.session = u;
    if (u.verified){            // حالة Yaro (مالك موثّق تلقائيًا)
      await loadData();
      state.page = "profile"; state.screen = "app";
      toast("تم إنشاء حسابك كمالك ✔", "ok");
    } else {
      state.screen = "pending";
      toast("تم إنشاء الحساب بنجاح", "ok");
    }
    rerender();
  }catch(e){ busy(btn,false); toast(e.message, "err"); }
}

// ---------------- شاشة الانتظار (غير موثّق) ----------------
export function pendingHTML(){
  return `
  <div class="center-screen" dir="rtl">
    <div class="gridbg"></div>
    <div class="glow floaty" style="width:380px;height:380px;background:rgba(232,187,99,.18);top:-80px;left:50%;transform:translateX(-50%)"></div>
    <div class="fade win" style="width:100%;max-width:560px;position:relative;z-index:2">
      <div class="wbar">
        <span class="dot" style="background:#e8636f"></span><span class="dot" style="background:#e8bb63"></span><span class="dot" style="background:#5fd7c1"></span>
        <span class="mono t-faint" style="font-size:12px;margin-inline-start:8px">neom://account/status</span>
      </div>
      <div style="padding:34px 28px;text-align:center">
        <div class="pulse" style="width:78px;height:78px;border-radius:50%;background:rgba(232,187,99,.12);border:1px solid rgba(232,187,99,.4);display:inline-flex;align-items:center;justify-content:center;margin-bottom:18px">${icon("clock",36,"t-amber blink")}</div>
        <h2 style="margin:0;font-size:23px;font-weight:700">⚠️ تنبيه</h2>
        <div class="badge b-amber" style="margin:14px 0">${icon("triangle-alert",13)} حسابك غير مُفعّل (غير موثّق)</div>
        <p class="t-dim" style="font-size:14.5px;line-height:2;max-width:430px;margin:0 auto">
          حاليًا حسابك <span class="t-amber" style="font-weight:600">غير مُفعّل</span>، وسيتم التأكد منه وتفعيله من خلال
          <span style="color:var(--text);font-weight:600"> الإدارة </span> في أقرب وقت ممكن.
          <br/>هذا الإجراء للحفاظ والتأكد على سلامة مطوّري
          <span class="t-acc" style="font-weight:600"> Neom Studio</span>.
        </p>
        <div class="bdsoft" style="border-radius:11px;background:#0e1119;padding:14px;margin:22px auto 0;max-width:430px;text-align:start">
          <div class="mono t-faint" style="font-size:11px;margin-bottom:8px">// حالة الطلب</div>
          <div style="display:flex;align-items:center;gap:10px">
            ${icon("loader-circle",16,"t-amber spin")}
            <span class="mono" style="font-size:12.5px;color:var(--dim)">awaiting_admin_approval</span>
            <span class="badge b-amber" style="margin-inline-start:auto">معلّق</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <button class="btn btn-ghost" data-refresh>${icon("refresh-cw",15)} تحديث الحالة</button>
          <button class="btn btn-danger" data-logout>${icon("log-out",15)} تسجيل الخروج</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function bindPending(root){
  root.querySelector("[data-logout]").addEventListener("click", () => logout());
  root.querySelector("[data-refresh]").addEventListener("click", async (e) => {
    const btn = e.currentTarget; busy(btn, true, "جارٍ التحديث…");
    try{
      const u = await refreshMe();
      if (u && u.banned){ state.blockInfo={type:"ban",reason:u.ban_reason}; state.screen="blocked"; return rerender(); }
      if (u && u.kicked){ state.blockInfo={type:"kick",reason:u.kick_reason}; state.screen="blocked"; return rerender(); }
      if (u && u.verified){ await loadData(); state.page="profile"; state.screen="app"; toast("تم تفعيل حسابك ✔","ok"); rerender(); }
      else { busy(btn,false); toast("ما زال حسابك قيد المراجعة","err"); }
    }catch(err){ busy(btn,false); toast(err.message,"err"); }
  });
}

// ---------------- شاشة الحظر / الطرد ----------------
export function blockedHTML(){
  const b = state.blockInfo || {};
  const isBan = b.type === "ban";
  return `
  <div class="center-screen" dir="rtl">
    <div class="gridbg"></div>
    <div class="glow" style="width:360px;height:360px;background:rgba(232,127,135,.2);top:-80px;left:50%;transform:translateX(-50%)"></div>
    <div class="fade win" style="width:100%;max-width:520px;position:relative;z-index:2">
      <div class="wbar"><span class="dot" style="background:#e8636f"></span><span class="dot" style="background:#e8bb63"></span><span class="dot" style="background:#5fd7c1"></span><span class="mono t-faint" style="font-size:12px;margin-inline-start:8px">neom://access/denied</span></div>
      <div style="padding:34px 28px;text-align:center">
        <div style="width:74px;height:74px;border-radius:50%;background:rgba(232,127,135,.12);border:1px solid rgba(232,127,135,.4);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">${icon(isBan?"ban":"user-x",34,"t-danger")}</div>
        <h2 style="margin:0;font-size:22px;font-weight:700">${isBan?"🚫 تم حظر حسابك":"⛔ تم طردك"}</h2>
        <p class="t-dim" style="font-size:14px;margin-top:10px">${isBan?"لا يمكنك الدخول إلى المنصة.":"تمت إزالتك من المنصة بواسطة الإدارة."}</p>
        <div class="bdsoft" style="border-radius:11px;background:#0e1119;padding:14px;margin:18px 0;text-align:start">
          <div class="mono t-faint" style="font-size:11px;margin-bottom:6px">// السبب</div>
          <p style="margin:0;font-size:14px;color:var(--text);line-height:1.8">${esc(b.reason || "غير محدد")}</p>
        </div>
        <button class="btn btn-ghost" data-logout>${icon("log-out",15)} رجوع لتسجيل الدخول</button>
      </div>
    </div>
  </div>`;
}
export function bindBlocked(root){
  root.querySelector("[data-logout]").addEventListener("click", () => logout());
}

export function logout(){
  state.session = null; state.screen = "auth"; state.authTab = "login";
  state.blockInfo = null; state.users = []; state.tasks = [];
  rerender();
}
