// ============================================================
//  لوحة الإدارة (للإداري والمالك فقط)
//  تبويبان: المستخدمون + المهام
// ============================================================
import { state, updateUser, addWarning, clearWarnings, createTask } from "./store.js";
import { rerender } from "./bus.js";
import {
  esc, icon, drawIcons, toast, fmtDate, fmtRemain, statusOf, specIcon,
  rankBadge, verifyBadge, openModal, closeModal, submissionHTML,
  SPECS, RANKS, DAY, HOUR,
} from "./ui.js";

export function adminHTML(){
  return `
  <div class="fade">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      ${icon("shield",22,"t-violet")}<h2 style="margin:0;font-size:20px;font-weight:700">لوحة الإدارة</h2>
      <div style="display:flex;gap:6px;margin-inline-start:auto;background:#0e1119;padding:4px;border-radius:11px;border:1px solid var(--border)">
        <button class="btn btn-sm ${state.adminTab==="users"?"btn-pri":"btn-ghost"}" data-atab="users" style="${state.adminTab==="users"?"":"background:transparent;border-color:transparent"}">${icon("users",14)} المستخدمون</button>
        <button class="btn btn-sm ${state.adminTab==="tasks"?"btn-pri":"btn-ghost"}" data-atab="tasks" style="${state.adminTab==="tasks"?"":"background:transparent;border-color:transparent"}">${icon("list-todo",14)} المهام</button>
      </div>
    </div>
    ${state.adminTab === "users" ? usersTab() : tasksTab()}
  </div>`;
}

/* ==================== تبويب المستخدمين ==================== */
function usersTab(){
  const rows = state.users.map(userCard).join("");
  return `
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div style="position:relative;flex:1;min-width:200px">
        <span style="position:absolute;inset-inline-start:12px;top:12px">${icon("search",16,"t-faint")}</span>
        <input id="user-search" class="field" style="padding-inline-start:38px" placeholder="ابحث بالاسم / روبلكس / الواتساب…" value="${esc(state.userQuery)}"/>
      </div>
      <button class="btn ${state.revealPw?"btn-warn":"btn-ghost"}" data-revealpw>${icon(state.revealPw?"eye-off":"eye",15)} ${state.revealPw?"إخفاء كلمات السر":"إظهار كلمات السر"}</button>
    </div>
    <div id="user-list" style="display:grid;gap:12px">${rows}</div>`;
}

function userCard(u){
  const open = state.expandedUser === u.id;
  const warns = u.warnings || [];
  const search = `${u.name} ${u.roblox} ${u.whatsapp} ${u.discord}`.toLowerCase();
  const info = [
    ["specialization", u.specialization, specIcon(u.specialization), true],
    ["age", u.age, "hash", false],
    ["country", u.country, "globe", false],
    ["discord", u.discord, "message-square", true],
    ["whatsapp", u.whatsapp, "phone", true],
    ["roblox", u.roblox, "gamepad-2", true],
  ].map(([l,v,ic,ltr]) => `
    <div class="card2 bdsoft" style="border-radius:9px;padding:9px 11px">
      <div class="lbl mono" style="font-size:10px">${icon(ic,11)}${l}</div>
      <div style="font-size:13.5px;font-weight:600" dir="${ltr?"ltr":"rtl"}">${esc(v)}</div>
    </div>`).join("");

  return `<div class="card bd" data-search="${esc(search)}" style="border-radius:14px;overflow:hidden">
    <div data-expand-user="${esc(u.id)}" style="padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;flex-wrap:wrap">
      <div style="width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#5a6ad8,#33b8a0);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${esc(u.name.trim()[0]||"?")}</div>
      <div style="flex:1;min-width:130px">
        <div style="font-weight:600;font-size:15px">${esc(u.name)}</div>
        <div class="mono t-faint" style="font-size:11px" dir="ltr">${esc(u.roblox)} · ${esc(u.whatsapp)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${rankBadge(u.rank)}${verifyBadge(u.verified)}
        ${u.banned?`<span class="badge b-danger">${icon("ban",12)}محظور</span>`:""}
        ${u.kicked?`<span class="badge b-danger">${icon("user-x",12)}مطرود</span>`:""}
        ${warns.length?`<span class="badge b-amber">${icon("triangle-alert",12)}${warns.length}</span>`:""}
      </div>
      <span style="transform:rotate(${open?180:0}deg);transition:transform .2s">${icon("chevron-down",18,"t-faint")}</span>
    </div>

    ${open ? `
    <div class="bdt" style="padding:16px;background:#0e1119">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px">
        ${info}
        <div class="card2 bdsoft" style="border-radius:9px;padding:9px 11px;border-color:rgba(232,127,135,.3)">
          <div class="lbl mono" style="font-size:10px">${icon("lock",11)}password</div>
          <div class="mono" style="font-size:13.5px;font-weight:600;color:${state.revealPw?"var(--danger)":"var(--dim)"}" dir="ltr">${state.revealPw?esc(u.password):"••••••••"}</div>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px">
        <div><div class="lbl mono" style="font-size:10px">الرتبة</div>
          <select class="field" data-setrank="${esc(u.id)}">${RANKS.map(r=>`<option value="${esc(r)}" ${u.rank===r?"selected":""}>${esc(r)}</option>`).join("")}</select></div>
        <div><div class="lbl mono" style="font-size:10px">التخصص</div>
          <select class="field" data-setspec="${esc(u.id)}">${SPECS.map(s=>`<option value="${esc(s)}" ${u.specialization===s?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      </div>

      ${(u.banned||u.kicked)?`
      <div class="bdsoft" style="border-radius:9px;padding:9px 11px;margin-bottom:12px;border-color:rgba(232,127,135,.3);background:rgba(232,127,135,.06)">
        <div class="mono t-danger" style="font-size:11px">${u.banned?"سبب الحظر":"سبب الطرد"}: <span style="color:var(--text)">${esc(u.banned?u.ban_reason:u.kick_reason)}</span></div>
      </div>`:""}

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm b-acc" data-usertasks="${esc(u.id)}" style="background:rgba(142,156,248,.12);color:var(--accent);border:1px solid rgba(142,156,248,.35)">${icon("list-todo",13)} عرض كل مهامه</button>
        <button class="btn btn-sm ${u.verified?"btn-warn":"btn-teal"}" data-verify="${esc(u.id)}" data-cur="${u.verified?1:0}">${u.verified?`${icon("clock",13)} إلغاء التفعيل`:`${icon("badge-check",13)} تفعيل الحساب`}</button>
        <button class="btn btn-warn btn-sm" data-action="warn" data-uid="${esc(u.id)}">${icon("triangle-alert",13)} تحذير</button>
        ${u.kicked
          ? `<button class="btn btn-ghost btn-sm" data-undo="kick" data-uid="${esc(u.id)}">${icon("check",13)} إلغاء الطرد</button>`
          : `<button class="btn btn-danger btn-sm" data-action="kick" data-uid="${esc(u.id)}">${icon("user-x",13)} طرد</button>`}
        ${u.banned
          ? `<button class="btn btn-ghost btn-sm" data-undo="ban" data-uid="${esc(u.id)}">${icon("check",13)} إلغاء الحظر</button>`
          : `<button class="btn btn-danger btn-sm" data-action="ban" data-uid="${esc(u.id)}">${icon("ban",13)} حظر</button>`}
        ${warns.length?`<button class="btn btn-ghost btn-sm" data-clearwarn="${esc(u.id)}">${icon("trash-2",13)} مسح التحذيرات</button>`:""}
      </div>
    </div>` : ""}
  </div>`;
}

/* ==================== تبويب المهام ==================== */
function tasksTab(){
  const opts = state.users.map(u => `<option value="${esc(u.id)}">${esc(u.name)} (${esc(u.specialization)})</option>`).join("");
  const nt = state.newTask;
  return `
    <div class="card bd" style="border-radius:14px;padding:18px;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">${icon("plus",18,"t-acc")}<strong style="font-size:15.5px">إنشاء مهمة جديدة</strong></div>
      <div style="display:grid;gap:12px">
        <div><div class="lbl">${icon("file-text",12)} عنوان المهمة *</div><input id="nt-title" class="field" placeholder="مثال: تصميم واجهة الإعدادات"/></div>
        <div><div class="lbl">${icon("terminal",12)} وصف المهمة *</div><textarea id="nt-desc" class="field" rows="3" placeholder="اكتب تفاصيل المهمة المطلوبة…"></textarea></div>
        <div><div class="lbl">${icon("user",12)} تُسند إلى *</div>
          <select id="nt-assign" class="field"><option value="">— اختر المطوّر —</option>${opts}</select></div>

        <div class="grid2">
          <div><div class="lbl">${icon("image",12)} صورة تخيلية (اختياري)</div>
            <label class="drop" style="padding:14px">
              <input type="file" accept="image/*" hidden id="nt-image"/>
              <div id="nt-image-label">${nt.image?`<img src="${URL.createObjectURL(nt.image)}" style="max-height:60px;border-radius:7px;margin:0 auto"/>`:`${icon("image",20,"t-faint")}<div style="font-size:12px;color:var(--dim);margin-top:5px">اختر صورة</div>`}</div>
            </label></div>
          <div><div class="lbl">${icon("paperclip",12)} ملفات (اختياري)</div>
            <label class="drop" style="padding:14px">
              <input type="file" multiple hidden id="nt-files"/>
              ${icon("paperclip",20,"t-faint")}<div id="nt-files-label" style="font-size:12px;color:var(--dim);margin-top:5px">${nt.files.length?`${nt.files.length} ملف`:"اختر ملفات"}</div>
            </label></div>
        </div>

        <div>
          <div class="lbl">${icon("coins",12)} الأسعار والمدد *</div>
          <div id="nt-tiers" style="display:grid;gap:8px"></div>
          <button class="btn btn-ghost btn-sm" id="nt-addtier" style="margin-top:8px">${icon("plus",13)} إضافة سعر/مدة</button>
        </div>

        <button class="btn btn-pri" id="nt-create">${icon("send",15)} إنشاء المهمة وإسنادها</button>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin:4px 0 12px">${icon("terminal",15,"t-faint")}<span class="mono t-faint" style="font-size:12px">// كل المهام (${state.tasks.length})</span></div>
    <div style="display:grid;gap:12px">${state.tasks.map(adminTaskCard).join("")}</div>`;
}

function tierRowTemplate(){
  return `<div class="bdsoft nt-tier" style="border-radius:10px;padding:10px;background:#0e1119;display:grid;grid-template-columns:1.4fr .9fr .7fr .7fr auto;gap:8px;align-items:end">
    <div><div class="lbl mono" style="font-size:9.5px">الوصف</div><input class="field nt-t-label" style="padding:8px 10px;font-size:12.5px" placeholder="المدة الأولى"/></div>
    <div><div class="lbl mono" style="font-size:9.5px">السعر R$</div><input class="field num nt-t-price" type="number" style="padding:8px 10px;font-size:12.5px" placeholder="1100"/></div>
    <div><div class="lbl mono" style="font-size:9.5px">أيام</div><input class="field num nt-t-days" type="number" value="2" style="padding:8px 10px;font-size:12.5px"/></div>
    <div><div class="lbl mono" style="font-size:9.5px">ساعات</div><input class="field num nt-t-hours" type="number" value="0" style="padding:8px 10px;font-size:12.5px"/></div>
    <button class="btn btn-danger btn-sm nt-t-del" style="padding:8px">${icon("trash-2",14)}</button>
  </div>`;
}

function adminTaskCard(t){
  const u = state.users.find(x => x.id === t.assigned_to);
  const st = statusOf(t);
  const open = state.expandedTask === t.id;
  const tiers = t.task_tiers || [];
  const files = t.task_files || [];
  const sub = (t.submissions && t.submissions[0]) || null;

  return `<div class="card bd" style="border-radius:14px;overflow:hidden">
    <div data-expand-task="${esc(t.id)}" style="padding:14px 16px;display:flex;align-items:center;gap:11px;cursor:pointer;flex-wrap:wrap">
      <div style="flex:1;min-width:160px">
        <div style="font-weight:600;font-size:15px">${esc(t.title)}</div>
        <div class="mono t-faint" style="font-size:11px;margin-top:3px;display:flex;align-items:center;gap:5px">${icon("user",11)} ${esc(u?u.name:"—")}</div>
      </div>
      <span class="badge ${st.cls}">${icon(st.icon,12)}${st.label}</span>
      ${sub?`<span class="badge b-acc">${icon("folder-input",12)} منفّذة</span>`:""}
      <span style="transform:rotate(${open?180:0}deg);transition:transform .2s">${icon("chevron-down",18,"t-faint")}</span>
    </div>
    ${open ? `
    <div class="bdt" style="padding:16px;background:#0e1119">
      ${t.image_url?`<div style="height:130px;border-radius:10px;background:#11141f url('${esc(t.image_url)}') center/cover;margin-bottom:12px"></div>`:""}
      <p class="t-dim" style="font-size:13.5px;line-height:1.9;margin-top:0">${esc(t.description)}</p>
      <div class="mono t-faint" style="font-size:11px;margin-bottom:10px">أُرسلت: ${esc(fmtDate(t.created_at))}</div>
      ${files.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${files.map(f=>`<a href="${esc(f.url)}" download="${esc(f.name)}" target="_blank" class="chip" style="text-decoration:none">${icon("paperclip",12)}${esc(f.name)}${icon("download",12,"t-acc")}</a>`).join("")}</div>`:""}
      <div style="display:grid;gap:7px;margin-bottom:12px">${tiers.map(tier=>{ const rem=fmtRemain(tier.deadline); return `
        <div class="bdsoft" style="border-radius:9px;padding:8px 11px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:12.5px;font-weight:600;flex:1;min-width:120px">${esc(tier.label||"مدة")}</span>
          <span class="mono" style="font-size:10.5px;color:${rem?"var(--dim)":"var(--danger)"}">${rem?`متبقٍ: <span data-deadline="${esc(tier.deadline)}">${esc(rem)}</span>`:"انتهت"}</span>
          <span class="badge b-amber">${icon("coins",12)}<span class="num">${Number(tier.price).toLocaleString("ar-EG")}</span> R$</span>
        </div>`; }).join("")}</div>
      ${sub?`
        <div class="bdsoft" style="border-radius:11px;padding:14px;background:rgba(95,215,193,.05);border-color:rgba(95,215,193,.3)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">${icon("folder-input",17,"t-teal")}<strong class="t-teal" style="font-size:14px">استلام الملفات المرفقة</strong><span class="mono t-faint" style="font-size:10.5px;margin-inline-start:auto">${esc(fmtDate(sub.submitted_at))}</span></div>
          ${submissionHTML(sub, { download:true })}
        </div>` : `<div class="chip" style="color:var(--faint)">${icon("clock",13)} لم يتم التنفيذ بعد</div>`}
    </div>` : ""}
  </div>`;
}

/* ==================== الربط ==================== */
export function bindAdmin(root){
  // تبديل التبويب
  root.querySelectorAll("[data-atab]").forEach(b => b.addEventListener("click", () => { state.adminTab = b.dataset.atab; rerender(); }));

  if (state.adminTab === "users") bindUsers(root);
  else bindTasksTab(root);
}

function bindUsers(root){
  // بحث فوري (بدون إعادة رسم)
  const search = root.querySelector("#user-search");
  const applyFilter = () => {
    const q = (search.value||"").toLowerCase().trim();
    state.userQuery = search.value;
    root.querySelectorAll("#user-list [data-search]").forEach(card => {
      card.style.display = card.dataset.search.includes(q) ? "" : "none";
    });
  };
  if (search){ search.addEventListener("input", applyFilter); applyFilter(); }

  root.querySelector("[data-revealpw]")?.addEventListener("click", () => { state.revealPw = !state.revealPw; rerender(); });

  root.querySelectorAll("[data-expand-user]").forEach(el => el.addEventListener("click", () => {
    const id = el.dataset.expandUser; state.expandedUser = state.expandedUser === id ? null : id; rerender();
  }));

  root.querySelectorAll("[data-setrank]").forEach(sel => sel.addEventListener("change", async () => {
    try{ await updateUser(sel.dataset.setrank, { rank: sel.value }); toast("تم تحديث الرتبة","ok"); rerender(); }catch(e){ toast(e.message,"err"); }
  }));
  root.querySelectorAll("[data-setspec]").forEach(sel => sel.addEventListener("change", async () => {
    try{ await updateUser(sel.dataset.setspec, { specialization: sel.value }); toast("تم تحديث التخصص","ok"); rerender(); }catch(e){ toast(e.message,"err"); }
  }));

  root.querySelectorAll("[data-verify]").forEach(b => b.addEventListener("click", async () => {
    const cur = b.dataset.cur === "1";
    try{ await updateUser(b.dataset.verify, { verified: !cur }); toast(cur?"تم إلغاء التفعيل":"تم تفعيل الحساب ✔","ok"); rerender(); }catch(e){ toast(e.message,"err"); }
  }));

  root.querySelectorAll("[data-clearwarn]").forEach(b => b.addEventListener("click", async () => {
    try{ await clearWarnings(b.dataset.clearwarn); toast("تم مسح التحذيرات","ok"); rerender(); }catch(e){ toast(e.message,"err"); }
  }));

  root.querySelectorAll("[data-undo]").forEach(b => b.addEventListener("click", async () => {
    const uid = b.dataset.uid, kind = b.dataset.undo;
    const patch = kind==="ban" ? { banned:false, ban_reason:"" } : { kicked:false, kick_reason:"" };
    try{ await updateUser(uid, patch); toast(kind==="ban"?"تم إلغاء الحظر":"تم إلغاء الطرد","ok"); rerender(); }catch(e){ toast(e.message,"err"); }
  }));

  // تحذير / طرد / حظر (بسبب)
  root.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => openReason(b.dataset.uid, b.dataset.action)));

  // عرض كل مهام مطوّر معيّن
  root.querySelectorAll("[data-usertasks]").forEach(b => b.addEventListener("click", () => openUserTasks(b.dataset.usertasks)));
}

function openReason(userId, type){
  const map = {
    warn: { t:"إرسال تحذير", ic:"triangle-alert", cls:"btn-warn" },
    kick: { t:"طرد المستخدم", ic:"user-x", cls:"btn-danger" },
    ban:  { t:"حظر المستخدم", ic:"ban", cls:"btn-danger" },
  }[type];
  const u = state.users.find(x => x.id === userId);
  openModal({
    title: map.t, sub: u?.name, iconName: map.ic,
    content: `
      <div class="lbl">${icon("terminal",12)} السبب (سيظهر للمستخدم) *</div>
      <textarea id="reason-box" class="field" rows="3" placeholder="اكتب سبب الإجراء…"></textarea>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn ${map.cls}" id="reason-ok" style="flex:1">${icon(map.ic,15)} تأكيد</button>
        <button class="btn btn-ghost" data-close-r>إلغاء</button>
      </div>`,
    onBind: (body) => {
      body.querySelector("[data-close-r]").addEventListener("click", closeModal);
      body.querySelector("#reason-ok").addEventListener("click", async () => {
        const reason = body.querySelector("#reason-box").value.trim();
        if (!reason) return toast("اكتب السبب أولاً","err");
        const btn = body.querySelector("#reason-ok"); btn.disabled = true;
        try{
          if (type==="warn") await addWarning(userId, reason);
          if (type==="kick") await updateUser(userId, { kicked:true, kick_reason:reason });
          if (type==="ban")  await updateUser(userId, { banned:true, ban_reason:reason });
          closeModal();
          toast(type==="warn"?"تم إرسال تحذير":type==="kick"?"تم طرد المستخدم":"تم حظر المستخدم","ok");
          rerender();
        }catch(e){ btn.disabled=false; toast(e.message,"err"); }
      });
    },
  });
}

function openUserTasks(userId){
  const u = state.users.find(x => x.id === userId);
  const list = state.tasks
    .filter(t => t.assigned_to === userId)
    .sort((a,b) => new Date(a.created_at) - new Date(b.created_at)); // من أول مهمة للأخيرة

  const body = list.length === 0
    ? `<div style="text-align:center;padding:24px 8px" class="t-dim">لا توجد مهام لهذا المطوّر بعد.</div>`
    : `<div style="display:grid;gap:10px">${list.map((t,i) => {
        const st = statusOf(t);
        const sub = (t.submissions && t.submissions[0]) || null;
        const total = (t.task_tiers||[]).length;
        return `<div class="card2 bdsoft" style="border-radius:11px;padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="mono t-faint" style="font-size:11px">#${i+1}</span>
            <strong style="font-size:14px;flex:1;min-width:140px">${esc(t.title)}</strong>
            <span class="badge ${st.cls}">${icon(st.icon,12)}${st.label}</span>
          </div>
          <div class="mono t-faint" style="font-size:10.5px;margin-top:6px">${icon("calendar",11)} ${esc(fmtDate(t.created_at))} · ${total} سعر/مدة${sub?` · سُلِّمت ${esc(fmtDate(sub.submitted_at))}`:""}</div>
        </div>`;
      }).join("")}</div>`;

  openModal({
    title: `كل مهام ${u?.name||""}`, sub: `${list.length} مهمة`, iconName: "list-todo",
    content: body + `<button class="btn btn-ghost" style="margin-top:16px;width:100%" data-close-ut>إغلاق</button>`,
    onBind: (b) => b.querySelector("[data-close-ut]").addEventListener("click", closeModal),
  });
}

function bindTasksTab(root){
  root.querySelectorAll("[data-expand-task]").forEach(el => el.addEventListener("click", () => {
    const id = el.dataset.expandTask; state.expandedTask = state.expandedTask === id ? null : id; rerender();
  }));

  // الصورة والملفات للمهمة الجديدة
  const imgInput = root.querySelector("#nt-image");
  if (imgInput) imgInput.addEventListener("change", (e) => {
    state.newTask.image = e.target.files[0] || null;
    const lbl = root.querySelector("#nt-image-label");
    lbl.innerHTML = state.newTask.image ? `<img src="${URL.createObjectURL(state.newTask.image)}" style="max-height:60px;border-radius:7px;margin:0 auto"/>` : `${icon("image",20,"t-faint")}<div style="font-size:12px;color:var(--dim);margin-top:5px">اختر صورة</div>`;
    drawIcons();
  });
  const filesInput = root.querySelector("#nt-files");
  if (filesInput) filesInput.addEventListener("change", (e) => {
    state.newTask.files = [...state.newTask.files, ...Array.from(e.target.files)];
    root.querySelector("#nt-files-label").textContent = `${state.newTask.files.length} ملف`;
  });

  // صفوف الأسعار
  const tiersBox = root.querySelector("#nt-tiers");
  const addTier = () => {
    const div = document.createElement("div");
    div.innerHTML = tierRowTemplate();
    const row = div.firstElementChild;
    tiersBox.appendChild(row);
    drawIcons();
    row.querySelector(".nt-t-del").addEventListener("click", () => {
      if (tiersBox.children.length > 1) row.remove();
      else toast("لازم سعر واحد على الأقل","err");
    });
  };
  if (tiersBox){ addTier(); root.querySelector("#nt-addtier").addEventListener("click", addTier); }

  const createBtn = root.querySelector("#nt-create");
  if (createBtn) createBtn.addEventListener("click", () => doCreateTask(root, createBtn));
}

async function doCreateTask(root, btn){
  const title = root.querySelector("#nt-title").value.trim();
  const description = root.querySelector("#nt-desc").value.trim();
  const assignedTo = root.querySelector("#nt-assign").value;
  if (!title || !description) return toast("العنوان والوصف مطلوبان","err");
  if (!assignedTo) return toast("اختر المطوّر المسؤول","err");

  const tiers = [];
  root.querySelectorAll(".nt-tier").forEach(row => {
    const price = row.querySelector(".nt-t-price").value;
    if (!price) return;
    const days = Number(row.querySelector(".nt-t-days").value || 0);
    const hours = Number(row.querySelector(".nt-t-hours").value || 0);
    const label = row.querySelector(".nt-t-label").value.trim() || `مدة ${days} يوم ${hours} ساعة`;
    tiers.push({ label, price: Number(price), deadline: new Date(Date.now() + days*DAY + hours*HOUR).toISOString() });
  });
  if (!tiers.length) return toast("أضف سعرًا واحدًا على الأقل","err");

  btn.disabled = true; btn.innerHTML = `${icon("loader-circle",15,"spin")} جارٍ الإنشاء…`; drawIcons();
  try{
    await createTask({ title, description, assignedTo, image: state.newTask.image, files: state.newTask.files, tiers });
    state.newTask = { image:null, files:[] };
    toast("تم إنشاء المهمة وإسنادها ✔","ok");
    rerender();
  }catch(e){
    btn.disabled = false; btn.innerHTML = `${icon("send",15)} إنشاء المهمة وإسنادها`; drawIcons();
    toast(e.message,"err");
  }
}
