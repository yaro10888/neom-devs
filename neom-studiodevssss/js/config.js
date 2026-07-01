// ============================================================
//  إعدادات الاتصال بقاعدة البيانات (Supabase)
//  ⬅️ ده الملف الوحيد اللي محتاج تعدّله بإيدك.
//  (اتحطّت قيمك بالفعل — لو غيّرت المشروع بدّلها من هنا)
// ============================================================
//
//  مهم: "Project URL" هو الرابط اللي بينتهي بـ .supabase.co فقط
//  (من غير /rest/v1/ في الآخر). الرابط بتاع workers.dev ده مكان
//  استضافة الموقع نفسه، مش رابط Supabase.
//
//  مكان القيمتين: Supabase ← Project Settings (الترس) ← API
//     • Project URL         →  SUPABASE_URL
//     • anon / public key    →  SUPABASE_ANON_KEY
//  ⚠️ استخدم مفتاح "anon public" فقط — متحطّش "service_role" هنا أبدًا.
// ============================================================

export const SUPABASE_URL = "https://yuunstuyiberoqoupbjv.supabase.co";

export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dW5zdHV5aWJlcm9xb3VwYmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjA2OTIsImV4cCI6MjA5ODQzNjY5Mn0.lY6iA75zfzDh5Z7O9wYpgQQL6sBOnb4qh86qDWy8PvU";
