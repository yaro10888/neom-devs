// ============================================================
//  إشعارات Discord عبر الويب هوك
//  بيتبعت أول ما مهمة تتسند لمطوّر
// ============================================================
import { DISCORD_WEBHOOK_URL } from "./config.js";

// ترتيب المدد (مؤنّث) والأسعار (مذكّر) بالعربي
const ORD_F = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة","التاسعة","العاشرة"];
const ORD_M = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"];

// نص المدة من الأيام والساعات
export function tierDuration(days, hours){
  const d = Number(days) || 0, h = Number(hours) || 0;
  if (d && h) return `${d} يوم و ${h} ساعة`;
  if (d)      return `${d} يوم`;
  if (h)      return `${h} ساعة`;
  return "فوري";
}

// هل ده آيدي رقمي صالح؟
function isDiscordId(v){ return /^\d{5,25}$/.test(String(v || "").trim()); }

// نص المنشن: آيدي رقمي = منشن حقيقي، غير كده = اسم كنص
function mentionText({ discord, discordId }){
  if (isDiscordId(discordId)) return `<@${String(discordId).trim()}>`;
  return `@${discord || "—"}`;
}

// بناء نص الرسالة بالشكل المطلوب
function buildMessage(p){
  const lines = [];
  lines.push("📌 **تم إعطاء مهمة للمطوّر:**");
  lines.push(mentionText(p));
  lines.push(`**عنوان المهمة:** ${p.title}`);
  lines.push("");
  lines.push("**المدد والسعر:**");
  (p.tiers || []).forEach((t, i) => {
    const f = ORD_F[i] || `رقم ${i + 1}`;
    const m = ORD_M[i] || `رقم ${i + 1}`;
    const dur = t.durationText || t.label || "-";
    const price = Number(t.price || 0).toLocaleString("en-US");
    lines.push(`• المدة ${f}: ${dur}`);
    lines.push(`  السعر ${m}: ${price} روبكس`);
  });
  return lines.join("\n");
}

// إرسال الإشعار (fire-and-forget — أي خطأ ما بيوقفش إنشاء المهمة)
export async function sendTaskAssignedWebhook(payload){
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("YOUR")) return;
  const body = {
    content: buildMessage(payload),
    // لو فيه آيدي حقيقي: نعمله منشن فعلي (وبس هو). غير كده: مفيش أي منشن (أمان من @everyone)
    allowed_mentions: isDiscordId(payload.discordId)
      ? { users: [String(payload.discordId).trim()] }
      : { parse: [] },
  };
  try{
    // FormData (multipart) عشان نتجنّب مشاكل CORS preflight في المتصفح
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify(body));
    await fetch(DISCORD_WEBHOOK_URL, { method: "POST", body: fd });
  }catch(e){
    console.warn("Discord webhook failed:", e);
  }
}
