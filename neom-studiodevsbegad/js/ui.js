// ============================================================
//  أدوات مشتركة: أيقونات، تنسيق، إشعارات، نوافذ، شارات، ثوابت
// ============================================================

/* global lucide */

export const SPECS = ["UI Designer","3D Modeler","Scripter","Vehicle Designer","Builder","Animator","VFX Artist","Logo Designer","Thumbnail Designer","SFX Designer"];
export const RANKS = ["مطور","اداري","مالك"];
export const COUNTRIES = ["مصر","السعودية","الإمارات","الكويت","قطر","البحرين","عُمان","الأردن","العراق","سوريا","لبنان","فلسطين","اليمن","المغرب","الجزائر","تونس","ليبيا","السودان","تركيا","أخرى"];

const SPEC_ICON = {
  "UI Designer":"pen-tool","3D Modeler":"boxes","Scripter":"code","Vehicle Designer":"car",
  "Builder":"hammer","Animator":"film","VFX Artist":"wand-2","Logo Designer":"sparkles",
  "Thumbnail Designer":"image","SFX Designer":"volume-2",
};
export const specIcon = (s) => SPEC_ICON[s] || "code";

export const DAY = 86400000, HOUR = 3600000;

// هروب آمن للنصوص قبل وضعها في innerHTML
export function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
}

// أيقونة Lucide داخل span بحجم محدد
export function icon(name, size = 16, cls = ""){
  return `<span class="ic ${cls}" style="width:${size}px;height:${size}px"><i data-lucide="${name}"></i></span>`;
}
export function drawIcons(){ if (window.lucide) window.lucide.createIcons(); }

// تنسيق التاريخ بالعربي
export function fmtDate(ts){
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleString("ar-EG",{ year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit" });
}

// المتبقي حتى موعد (نص) — يرجع null لو انتهى
export function fmtRemain(deadline, now = Date.now()){
  let ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms/DAY); ms -= d*DAY;
  const h = Math.floor(ms/HOUR); ms -= h*HOUR;
  const m = Math.floor(ms/60000); ms -= m*60000;
  const s = Math.floor(ms/1000);
  const p = [];
  if (d) p.push(`${d} يوم`);
  if (h||d) p.push(`${h} ساعة`);
  p.push(`${m} دقيقة`); p.push(`${s} ثانية`);
  return p.join(" و ");
}

// شارة الرتبة
export function rankBadge(rank){
  if (rank === "مالك")  return `<span class="badge b-violet">${icon("crown",13)}مالك</span>`;
  if (rank === "اداري") return `<span class="badge b-acc">${icon("shield",13)}إداري</span>`;
  return `<span class="badge b-grey">${icon("code",13)}مطوّر</span>`;
}
// شارة التوثيق
export function verifyBadge(ok){
  return ok
    ? `<span class="badge b-teal">${icon("badge-check",13)}موثّق</span>`
    : `<span class="badge b-amber">${icon("clock",13)}قيد المراجعة</span>`;
}

// شعار Neom (SVG)
export function neomMark(size = 34){
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none">
    <path d="M20 2 L35 11 V29 L20 38 L5 29 V11 Z" stroke="url(#ng)" stroke-width="1.6" fill="rgba(142,156,248,.06)"/>
    <path d="M14 27 V14 L26 27 V14" stroke="url(#ng)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <defs><linearGradient id="ng" x1="4" y1="4" x2="36" y2="36"><stop stop-color="#8e9cf8"/><stop offset="1" stop-color="#5fd7c1"/></linearGradient></defs>
  </svg>`;
}

// ---------------- إشعارات (Toast) ----------------
let toastTimer = null;
export function toast(msg, type = "info"){
  let host = document.getElementById("toast-host");
  if (!host){
    host = document.createElement("div");
    host.id = "toast-host";
    host.style.cssText = "position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:100";
    document.body.appendChild(host);
  }
  const color = type==="err" ? "rgba(232,127,135,.5)" : type==="ok" ? "rgba(95,215,193,.5)" : "var(--border)";
  const ic = type==="ok" ? icon("circle-check",18,"t-teal") : type==="err" ? icon("triangle-alert",18,"t-danger") : icon("terminal",18,"t-acc");
  host.innerHTML = `<div class="card bd popin" style="display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:12px;box-shadow:0 18px 50px -16px rgba(0,0,0,.7);border-color:${color}">
    ${ic}<span style="font-size:13.5px;font-weight:500">${esc(msg)}</span></div>`;
  drawIcons();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { host.innerHTML = ""; }, 2900);
}

// ---------------- نافذة منبثقة (Modal) ----------------
// content = HTML string. onBind(rootEl) لربط الأحداث بعد العرض.
export function openModal({ title, sub, iconName, content, onBind }){
  closeModal();
  const wrap = document.createElement("div");
  wrap.id = "modal-host";
  wrap.style.cssText = "position:fixed;inset:0;z-index:90;background:rgba(6,8,13,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px";
  wrap.innerHTML = `
    <div dir="rtl" class="popin win" style="width:100%;max-width:520px;max-height:90vh;overflow-y:auto;background:var(--surface)">
      <div class="wbar" style="position:sticky;top:0">
        ${iconName ? icon(iconName,16,"t-acc") : ""}
        <div><div style="font-weight:600;font-size:14px">${esc(title||"")}</div>${sub?`<div class="mono t-faint" style="font-size:10.5px">${esc(sub)}</div>`:""}</div>
        <button data-close style="margin-inline-start:auto;background:none;border:none;cursor:pointer;color:var(--faint)">${icon("x",18)}</button>
      </div>
      <div style="padding:20px" id="modal-body">${content}</div>
    </div>`;
  // إغلاق عند الضغط على الخلفية
  wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  wrap.querySelector("[data-close]").addEventListener("click", closeModal);
  drawIcons();
  if (onBind) onBind(wrap.querySelector("#modal-body"));
}
export function closeModal(){
  const h = document.getElementById("modal-host");
  if (h) h.remove();
}

// عرض تسليم (صور + ملفات) — تستخدم في صفحة المطور والإدارة
export function submissionHTML(sub, { download = false } = {}){
  const imgs = (sub.submission_files||sub.files||[]).filter(f => f.is_image);
  const files = (sub.submission_files||sub.files||[]).filter(f => !f.is_image);
  const imgCells = imgs.map(im => download
    ? `<a href="${esc(im.url)}" download="${esc(im.name)}" target="_blank" style="display:block;aspect-ratio:1;border-radius:9px;overflow:hidden;position:relative">
         <img src="${esc(im.url)}" alt="" style="width:100%;height:100%;object-fit:cover"/>
         <span style="position:absolute;bottom:4px;inset-inline-end:4px;background:rgba(12,14,21,.85);border-radius:6px;padding:4px;display:flex">${icon("download",12,"t-teal")}</span>
       </a>`
    : `<div style="aspect-ratio:1;border-radius:9px;overflow:hidden"><img src="${esc(im.url)}" alt="" style="width:100%;height:100%;object-fit:cover"/></div>`
  ).join("");
  const fileRows = files.map(f => `
    <a href="${esc(f.url)}" download="${esc(f.name)}" target="_blank" class="card2 bdsoft" style="border-radius:9px;padding:9px 11px;display:flex;align-items:center;gap:9px;text-decoration:none;color:inherit">
      ${icon("file-text",15,"t-acc")}<span style="font-size:12.5px;flex:1;word-break:break-all" dir="ltr">${esc(f.name)}</span>${icon("download",15,"t-teal")}
    </a>`).join("");
  return `
    <div class="mono t-faint" style="font-size:11px;margin-bottom:8px">// الصور (${imgs.length})</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-bottom:14px">${imgCells||'<span class="t-faint" style="font-size:12px">—</span>'}</div>
    <div class="mono t-faint" style="font-size:11px;margin-bottom:8px">// الملفات (${files.length})</div>
    <div style="display:grid;gap:7px">${fileRows||'<span class="t-faint" style="font-size:12px">—</span>'}</div>`;
}

// حالة المهمة (مكتملة / انتهى الوقت / غير مكتملة)
export function statusOf(task, now = Date.now()){
  if ((task.submissions && task.submissions.length) || task.submission)
    return { key:"done", label:"مكتملة", cls:"b-teal", icon:"circle-check" };
  const tiers = task.task_tiers || task.tiers || [];
  const last = Math.max(...tiers.map(x => new Date(x.deadline).getTime()));
  if (now > last) return { key:"ended", label:"تم انتهاء الوقت", cls:"b-danger", icon:"circle-x" };
  return { key:"prog", label:"غير مكتملة", cls:"b-amber", icon:"clock" };
}
