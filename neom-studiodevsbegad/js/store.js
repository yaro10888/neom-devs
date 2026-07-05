// ============================================================
//  الحالة (state) + كل الاتصالات بقاعدة البيانات
// ============================================================
import { supabase } from "./supabase.js";
import { sendTaskAssignedWebhook } from "./discord.js";

export const state = {
  screen: "auth",       // auth | pending | blocked | app
  authTab: "login",     // login | signup
  session: null,        // بيانات المستخدم الحالي
  page: "profile",      // profile | tasks | admin
  adminTab: "users",
  users: [],            // كل المستخدمين (للإدارة) أو المستخدم نفسه فقط
  tasks: [],            // مهام المستخدم أو كل المهام (للإدارة)
  blockInfo: null,      // { type, reason }
  revealPw: false,
  userQuery: "",
  sidebarOpen: false,
  expandedUser: null,
  expandedTask: null,
  // مؤقتات الرفع
  submit: { task: null, imgs: [], files: [] },
  newTask: { image: null, files: [] },
};

export const isAdmin = (u) => u && (u.rank === "اداري" || u.rank === "مالك");

// ---------------- حفظ الجلسة (تسجيل الدخول يفضل محفوظ) ----------------
const SESSION_KEY = "neom_session_id";
export function saveSession(id){ try{ localStorage.setItem(SESSION_KEY, id); }catch(e){} }
export function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }
// عند فتح الموقع من جديد: نجيب المستخدم المحفوظ ببياناته المحدّثة
export async function restoreSession(){
  let id = null;
  try{ id = localStorage.getItem(SESSION_KEY); }catch(e){ id = null; }
  if (!id) return null;
  const { data, error } = await supabase.from("profiles").select("*, warnings(*)").eq("id", id).maybeSingle();
  if (error || !data){ clearSession(); return null; }
  return data;
}

// ---------------- تسجيل / دخول ----------------
export async function signup(f){
  // تحقق من عدم التكرار (اسم / واتساب / روبلكس / ديسكورد)
  const { data: all, error: e0 } = await supabase.from("profiles").select("name,whatsapp,roblox,discord");
  if (e0) throw new Error(mapErr(e0));
  const norm = (s) => String(s||"").trim().toLowerCase();
  for (const u of (all||[])){
    if (norm(u.name) === norm(f.name))         throw new Error("الاسم مستخدم بالفعل، اختر اسمًا آخر");
    if (u.whatsapp === f.whatsapp)             throw new Error("رقم الواتساب مستخدم بالفعل");
    if (norm(u.roblox) === norm(f.roblox))     throw new Error("اسم روبلكس مستخدم بالفعل");
    if (norm(u.discord) === norm(f.discord))   throw new Error("اسم ديسكورد مستخدم بالفعل");
  }
  const row = {
    name: f.name.trim(), specialization: f.specialization, age: f.age,
    discord: f.discord.trim(),
    whatsapp: f.whatsapp.trim(), roblox: f.roblox.trim(),
    country: f.country, password: f.password,
    // الرتبة والتفعيل الافتراضي — قاعدة "Yaro" بتتظبط تلقائيًا من الـ trigger في قاعدة البيانات
    // آيدي ديسكورد بتحطه الإدارة لاحقًا من لوحة الإدارة
    rank: "مطور", verified: false,
  };
  const { data, error } = await supabase.from("profiles").insert(row).select("*, warnings(*)").single();
  if (error) throw new Error(mapErr(error));
  return data; // ممكن يرجع rank=مالك و verified=true لو الاسم Yaro
}

export async function login(whatsapp, password){
  const { data, error } = await supabase.from("profiles")
    .select("*, warnings(*)").eq("whatsapp", whatsapp.trim()).eq("password", password).maybeSingle();
  if (error) throw new Error(mapErr(error));
  return data; // null لو مفيش
}

// ---------------- تحميل البيانات حسب الصلاحية ----------------
export async function loadData(){
  const me = state.session;
  if (!me) return;

  // المهام (مع الأسعار والملفات والتسليمات)
  let q = supabase.from("tasks")
    .select("*, task_tiers(*), task_files(*), submissions(*, submission_files(*))")
    .order("created_at", { ascending: true });
  if (!isAdmin(me)) q = q.eq("assigned_to", me.id);   // المطور يشوف مهامه فقط
  const { data: tasks, error: te } = await q;
  if (te) throw new Error(mapErr(te));
  state.tasks = tasks || [];

  // المستخدمون
  if (isAdmin(me)){
    const { data: users, error: ue } = await supabase.from("profiles")
      .select("*, warnings(*)").order("created_at", { ascending: true });
    if (ue) throw new Error(mapErr(ue));
    state.users = users || [];
  } else {
    const { data: fresh } = await supabase.from("profiles").select("*, warnings(*)").eq("id", me.id).single();
    if (fresh){ state.session = fresh; state.users = [fresh]; }
  }
}

// إعادة تحميل بيانات المستخدم الحالي فقط (لشاشة الانتظار)
export async function refreshMe(){
  if (!state.session) return null;
  const { data } = await supabase.from("profiles").select("*, warnings(*)").eq("id", state.session.id).single();
  if (data) state.session = data;
  return data;
}

// ---------------- إجراءات الإدارة على المستخدمين ----------------
export async function updateUser(id, patch){
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw new Error(mapErr(error));
  await loadData();
}
export async function addWarning(userId, reason){
  const { error } = await supabase.from("warnings").insert({ user_id: userId, reason });
  if (error) throw new Error(mapErr(error));
  await loadData();
}
export async function clearWarnings(userId){
  const { error } = await supabase.from("warnings").delete().eq("user_id", userId);
  if (error) throw new Error(mapErr(error));
  await loadData();
}

// ---------------- رفع الملفات إلى التخزين ----------------
async function uploadFile(file, folder){
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safe}`;
  const { error } = await supabase.storage.from("uploads").upload(path, file);
  if (error) throw new Error("فشل رفع الملف: " + error.message);
  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------- إنشاء مهمة (إدارة) ----------------
export async function createTask({ title, description, assignedTo, image, files, tiers }){
  const imageUrl = image ? await uploadFile(image, "tasks/images") : null;

  const { data: task, error } = await supabase.from("tasks")
    .insert({ title, description, assigned_to: assignedTo, image_url: imageUrl }).select().single();
  if (error) throw new Error(mapErr(error));

  // الأسعار والمدد
  const tierRows = tiers.map((t, i) => ({
    task_id: task.id, label: t.label, price: t.price, deadline: t.deadline, sort_order: i,
  }));
  if (tierRows.length){
    const { error: e2 } = await supabase.from("task_tiers").insert(tierRows);
    if (e2) throw new Error(mapErr(e2));
  }
  // ملفات المهمة
  for (const f of (files||[])){
    const url = await uploadFile(f, "tasks/files");
    await supabase.from("task_files").insert({ task_id: task.id, name: f.name, url });
  }

  // إشعار Discord (المطوّر اللي اتسندت له المهمة) — بيعمل منشن حقيقي لو فيه آيدي
  const dev = (state.users || []).find(u => u.id === assignedTo);
  sendTaskAssignedWebhook({
    discord: dev ? dev.discord : "",
    discordId: dev ? dev.discord_id : "",
    title, tiers,
  });

  await loadData();
}

// ---------------- تسليم مهمة (مطور) ----------------
export async function submitTask(taskId, userId, imgs, files){
  const { data: sub, error } = await supabase.from("submissions")
    .insert({ task_id: taskId, user_id: userId }).select().single();
  if (error) throw new Error(mapErr(error));

  const rows = [];
  for (const f of imgs){
    const url = await uploadFile(f, "submissions/images");
    rows.push({ submission_id: sub.id, name: f.name, url, is_image: true });
  }
  for (const f of files){
    const url = await uploadFile(f, "submissions/files");
    rows.push({ submission_id: sub.id, name: f.name, url, is_image: false });
  }
  if (rows.length){
    const { error: e2 } = await supabase.from("submission_files").insert(rows);
    if (e2) throw new Error(mapErr(e2));
  }
  await loadData();
}

// ---------------- ترجمة رسائل الخطأ ----------------
function mapErr(error){
  const msg = (error && (error.message || error.hint || "")) + "";
  if (/duplicate key|unique/i.test(msg))       return "القيمة مستخدمة بالفعل (اسم/رقم مكرر)";
  if (/relation .* does not exist|schema/i.test(msg)) return "الجداول مش موجودة — شغّل ملف database.sql في Supabase أول";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "تعذّر الاتصال — راجع رابط المشروع والمفتاح في config.js";
  if (/JWT|apikey|Invalid API key/i.test(msg)) return "المفتاح غير صحيح — راجع SUPABASE_ANON_KEY في config.js";
  return msg || "حدث خطأ غير متوقع";
}
