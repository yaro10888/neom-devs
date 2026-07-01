// إنشاء عميل Supabase — بيتحمّل من CDN مباشرة (من غير build).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تحقق بسيط: لو المفاتيح لسه مش متحطوطة
export const isConfigured =
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON");
