// ============================================================
//  صفحة المهام (الخاصة بالمطور الحالي فقط)
// ============================================================
import { state, submitTask } from "./store.js";
import { rerender } from "./bus.js";
import { esc, icon, drawIcons, toast, fmtDate, fmtRemain, statusOf, openModal, closeModal, submissionHTML } from "./ui.js";

// صف سعر/مدة مع عداد حي
function tierRow(tier, active){
  const rem = fmtRemain(tier.deadline);
  return `<div class="bdsoft" style="border-radius:10px;padding:11px 13px;background:${active?"rgba(142,156,248,.07)":"#0e1119"};border-color:${active?"rgba(142,156,248,.4)":"var(--border-soft)"};display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <div style="flex:1;min-width:140px">
      <div style="font-size:13px;font-weight:600">${esc(tier.label||"مدة")}${active?` <span class="badge b-acc" style="margin-inline-start:8px">السعر الحالي</span>`:""}</div>
      <div class="mono" style="font-size:11px;margin-top:4px;color:${rem?"var(--dim)":"var(--danger)"}">
        ${rem ? `متبقٍ: <span data-deadline="${esc(tier.deadline)}">${esc(rem)}</span>` : "انتهت هذه المدة"}
      </div>
    </div>
    <div class="badge b-amber" style="font-size:13px">${icon("coins",14)}<span class="num">${Number(tier.price).toLocaleString("ar-EG")}</span> R$</div>
  </div>`;
}

export function tasksHTML(){
  const me = state.session;
  const mine = state.tasks.filter(t => t.assigned_to === me.id);
  return `
  <div class="fade">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      ${icon("list-todo",22,"t-acc")}<h2 style="margin:0;font-size:20px;font-weight:700">المهام الخاصة بك</h2>
      <span class="chip mono" style="margin-inline-start:auto">${mine.length} مهمة</span>
    </div>
    ${mine.length === 0 ? `
      <div class="card bd" style="border-radius:14px;padding:50px 20px;text-align:center">
        ${icon("cpu",40,"t-faint")}
        <p class="t-dim" style="margin:12px 0 0;font-size:15px">لا توجد مهام مُسنَدة إليك حاليًا.</p>
        <p class="t-faint" style="font-size:12.5px;margin-top:6px">ستظهر هنا فور إسناد مهمة لك من الإدارة.</p>
      </div>` :
      `<div style="display:grid;gap:16px">${mine.map((t,i) => taskCard(t, i)).join("")}</div>`}
  </div>`;
}

function taskCard(t, i){
  const st = statusOf(t);
  const tiers = t.task_tiers || [];
  const future = tiers.filter(x => new Date(x.deadline).getTime() > Date.now()).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  const activeDeadline = future.length ? future[0].deadline : null;
  const files = t.task_files || [];
  const sub = (t.submissions && t.submissions[0]) || null;

  return `<div class="card bd fade d${Math.min(i+1,5)}" style="border-radius:15px;overflow:hidden">
    ${t.image_url ? `<div style="height:150px;background:#0e1119 url('${esc(t.image_url)}') center/cover"></div>` : ""}
    <div style="padding:18px">
      <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <h3 style="margin:0;font-size:17px;font-weight:700;flex:1;min-width:160px">${esc(t.title)}</h3>
        <span class="badge ${st.cls}">${icon(st.icon,13)}${st.label}</span>
      </div>
      <div class="mono t-faint" style="font-size:11px;margin-top:8px;display:flex;align-items:center;gap:6px">${icon("calendar",12)} أُرسلت: ${esc(fmtDate(t.created_at))}</div>
      <p class="t-dim" style="font-size:14px;line-height:1.9;margin-top:12px">${esc(t.description)}</p>

      ${files.length ? `
      <div style="margin-top:12px">
        <div class="mono t-faint" style="font-size:11px;margin-bottom:7px">// ملفات المهمة</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${files.map(f => `<a href="${esc(f.url)}" download="${esc(f.name)}" target="_blank" class="chip" style="text-decoration:none">${icon("paperclip",12)}${esc(f.name)}${icon("download",12,"t-acc")}</a>`).join("")}
        </div>
      </div>` : ""}

      <div style="margin-top:14px">
        <div class="mono t-faint" style="font-size:11px;margin-bottom:8px;display:flex;align-items:center;gap:6px">${icon("coins",12)} الأسعار والمدد</div>
        <div style="display:grid;gap:8px">${tiers.map(tier => tierRow(tier, activeDeadline && tier.deadline === activeDeadline)).join("")}</div>
      </div>

      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        ${sub ? `
          <span class="badge b-teal" style="padding:8px 14px">${icon("circle-check",14)} تم التسليم — ${esc(fmtDate(sub.submitted_at))}</span>
          <button class="btn btn-ghost btn-sm" data-viewsub="${esc(t.id)}">${icon("eye",14)} عرض تسليمي</button>
        ` : st.key === "ended" ? `
          <button class="btn btn-ghost" disabled>${icon("circle-x",15)} انتهى الوقت</button>
        ` : `
          <button class="btn btn-pri" data-submit="${esc(t.id)}">${icon("upload",15)} تسليم المهمة</button>
        `}
      </div>
    </div>
  </div>`;
}

export function bindTasks(root){
  root.querySelectorAll("[data-submit]").forEach(b =>
    b.addEventListener("click", () => openSubmit(b.dataset.submit)));
  root.querySelectorAll("[data-viewsub]").forEach(b =>
    b.addEventListener("click", () => {
      const t = state.tasks.find(x => x.id === b.dataset.viewsub);
      const sub = t.submissions[0];
      openModal({ title:"تسليمي", sub:t.title, iconName:"eye",
        content: submissionHTML(sub) + `<button class="btn btn-ghost" style="margin-top:16px;width:100%" data-close2>إغلاق</button>`,
        onBind:(body)=> body.querySelector("[data-close2]").addEventListener("click", closeModal) });
    }));
}

// ---------------- نافذة تسليم المهمة ----------------
function openSubmit(taskId){
  const task = state.tasks.find(t => t.id === taskId);
  state.submit = { task, imgs: [], files: [] };
  openModal({
    title:"تسليم المهمة", sub:task.title, iconName:"upload",
    content: submitBody(),
    onBind: bindSubmit,
  });
}

function submitBody(){
  const s = state.submit;
  return `
    <p class="t-dim" style="font-size:13px;margin-top:0">أرفق <strong class="t-acc">صورتين على الأقل</strong> (حتى 9 صور) و<strong class="t-acc">ملف واحد على الأقل</strong> (حتى 9 ملفات). أي صيغة وأي حجم مقبول.</p>

    <div class="lbl" style="margin-top:8px">${icon("image",13)} الصور <span class="mono t-faint" id="sub-img-count" style="margin-inline-start:auto"></span></div>
    <label class="drop">
      <input type="file" accept="image/*" multiple hidden id="sub-img-input"/>
      ${icon("image",26,"t-faint")}
      <div style="font-size:13px;color:var(--dim);margin-top:6px">اضغط لاختيار صور من جهازك</div>
    </label>
    <div id="sub-img-previews" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;margin-top:10px"></div>

    <div class="lbl" style="margin-top:16px">${icon("paperclip",13)} الملفات <span class="mono t-faint" id="sub-file-count" style="margin-inline-start:auto"></span></div>
    <label class="drop">
      <input type="file" multiple hidden id="sub-file-input"/>
      ${icon("file-text",26,"t-faint")}
      <div style="font-size:13px;color:var(--dim);margin-top:6px">اضغط لاختيار ملفات من جهازك</div>
    </label>
    <div id="sub-file-list" style="display:grid;gap:7px;margin-top:10px"></div>

    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-pri" id="sub-confirm" style="flex:1">${icon("send",15)} تأكيد التسليم</button>
      <button class="btn btn-ghost" data-close3>إلغاء</button>
    </div>`;
}

function bindSubmit(body){
  const s = state.submit;
  body.querySelector("[data-close3]").addEventListener("click", closeModal);
  body.querySelector("#sub-img-input").addEventListener("change", (e) => {
    s.imgs = [...s.imgs, ...Array.from(e.target.files)].slice(0, 9); e.target.value = ""; refreshSubmit(body);
  });
  body.querySelector("#sub-file-input").addEventListener("change", (e) => {
    s.files = [...s.files, ...Array.from(e.target.files)].slice(0, 9); e.target.value = ""; refreshSubmit(body);
  });
  body.querySelector("#sub-confirm").addEventListener("click", () => doSubmit(body));
  refreshSubmit(body);
}

function refreshSubmit(body){
  const s = state.submit;
  body.querySelector("#sub-img-count").textContent  = `${s.imgs.length}/9 ${s.imgs.length<2?"• الحد الأدنى 2":""}`;
  body.querySelector("#sub-file-count").textContent = `${s.files.length}/9 ${s.files.length<1?"• الحد الأدنى 1":""}`;

  body.querySelector("#sub-img-previews").innerHTML = s.imgs.map((f,i) => `
    <div style="position:relative;aspect-ratio:1;border-radius:9px;overflow:hidden">
      <img src="${URL.createObjectURL(f)}" alt="" style="width:100%;height:100%;object-fit:cover"/>
      <button data-rmimg="${i}" style="position:absolute;top:3px;inset-inline-end:3px;background:rgba(12,14,21,.85);border:none;border-radius:6px;width:22px;height:22px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center">${icon("x",13)}</button>
    </div>`).join("");

  body.querySelector("#sub-file-list").innerHTML = s.files.map((f,i) => `
    <div class="card2 bdsoft" style="border-radius:9px;padding:9px 11px;display:flex;align-items:center;gap:9px">
      ${icon("file-text",15,"t-acc")}<span style="font-size:12.5px;flex:1;word-break:break-all" dir="ltr">${esc(f.name)}</span>
      <button data-rmfile="${i}" style="background:none;border:none;cursor:pointer;color:var(--faint)">${icon("trash-2",15)}</button>
    </div>`).join("");

  drawIcons();
  body.querySelectorAll("[data-rmimg]").forEach(b => b.addEventListener("click", () => { s.imgs.splice(+b.dataset.rmimg,1); refreshSubmit(body); }));
  body.querySelectorAll("[data-rmfile]").forEach(b => b.addEventListener("click", () => { s.files.splice(+b.dataset.rmfile,1); refreshSubmit(body); }));
}

async function doSubmit(body){
  const s = state.submit;
  if (s.imgs.length < 2) return toast("لازم ترفع صورتين على الأقل", "err");
  if (s.imgs.length > 9) return toast("الحد الأقصى 9 صور", "err");
  if (s.files.length < 1) return toast("لازم ترفع ملف واحد على الأقل", "err");
  if (s.files.length > 9) return toast("الحد الأقصى 9 ملفات", "err");
  const btn = body.querySelector("#sub-confirm");
  btn.disabled = true; btn.innerHTML = `${icon("loader-circle",15,"spin")} جارٍ الرفع…`; drawIcons();
  try{
    await submitTask(s.task.id, state.session.id, s.imgs, s.files);
    closeModal(); toast("تم تسليم المهمة بنجاح ✓", "ok"); rerender();
  }catch(e){
    btn.disabled = false; btn.innerHTML = `${icon("send",15)} تأكيد التسليم`; drawIcons();
    toast(e.message, "err");
  }
}
