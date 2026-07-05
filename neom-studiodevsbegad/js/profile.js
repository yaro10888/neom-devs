// ============================================================
//  صفحة الملف الشخصي (عرض فقط)
// ============================================================
import { state } from "./store.js";
import { esc, icon, fmtDate, rankBadge, verifyBadge, specIcon } from "./ui.js";

const cell = (ic, label, value, ltr) => `
  <div class="card2 bdsoft" style="border-radius:12px;padding:14px">
    <div class="lbl mono" style="font-size:10.5px">${icon(ic,12,"t-faint")}${esc(label)}</div>
    <div style="font-size:15px;font-weight:600;color:var(--text)" dir="${ltr?"ltr":"rtl"}">${esc(value)}</div>
  </div>`;

export function profileHTML(){
  const me = state.session;
  const warns = me.warnings || [];
  return `
  <div class="fade">
    <div class="card bd" style="border-radius:16px;padding:22px;margin-bottom:18px;position:relative;overflow:hidden">
      <div class="glow-abs" style="width:200px;height:200px;background:rgba(90,106,216,.25);top:-60px;inset-inline-end:-30px"></div>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;position:relative">
        <div style="width:70px;height:70px;border-radius:18px;background:linear-gradient(135deg,#5a6ad8,#33b8a0);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex-shrink:0">${esc((me.name.trim()[0]||"?"))}</div>
        <div style="flex:1;min-width:180px">
          <h2 style="margin:0;font-size:21px;font-weight:700">${esc(me.name)}</h2>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            ${rankBadge(me.rank)}${verifyBadge(me.verified)}
            <span class="badge b-acc">${icon(specIcon(me.specialization),13)}${esc(me.specialization)}</span>
          </div>
        </div>
        <div class="chip mono" style="align-self:flex-start">${icon("hash",12)}${esc(me.id.slice(0,8))}</div>
      </div>
    </div>

    ${warns.length ? `
    <div class="bd" style="border-radius:14px;padding:16px;margin-bottom:18px;background:rgba(232,187,99,.06);border-color:rgba(232,187,99,.35)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">${icon("triangle-alert",17,"t-amber")}<strong class="t-amber">لديك ${warns.length} تحذير</strong></div>
      <div style="display:grid;gap:8px">${warns.map(w => `
        <div class="card2 bdsoft" style="border-radius:10px;padding:10px 12px">
          <div style="font-size:13.5px">${esc(w.reason)}</div>
          <div class="mono t-faint" style="font-size:10.5px;margin-top:4px">${esc(fmtDate(w.created_at))}</div>
        </div>`).join("")}</div>
    </div>` : ""}

    ${me.verified ? `
    <div class="bd" style="border-radius:14px;padding:14px 16px;margin-bottom:16px;background:rgba(95,215,193,.05);border-color:rgba(95,215,193,.3);display:flex;align-items:center;gap:10px">
      ${icon("shield-check",20,"t-teal")}
      <div><div style="font-weight:600" class="t-teal">حالة الحساب: موثّق ✔</div><div class="t-faint" style="font-size:12px">حسابك مُفعّل بالكامل ويمكنك استلام المهام.</div></div>
    </div>` : ""}

    <div style="display:flex;align-items:center;gap:8px;margin:6px 0 12px">${icon("terminal",15,"t-faint")}<span class="mono t-faint" style="font-size:12px">// بيانات الحساب (للعرض فقط)</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
      ${cell("user","name", me.name)}
      ${cell(specIcon(me.specialization),"specialization", me.specialization, true)}
      ${cell("hash","age", me.age)}
      ${cell("globe","country", me.country)}
      ${cell("gamepad-2","roblox", me.roblox, true)}
      ${cell("message-square","discord", me.discord, true)}
      ${cell("phone","whatsapp", me.whatsapp, true)}
    </div>
    <p class="t-faint" style="font-size:12px;margin-top:14px;display:flex;align-items:center;gap:6px">${icon("lock",12)} لا يمكن تعديل أي بيانات — للتعديل تواصل مع الإدارة.</p>
  </div>`;
}
