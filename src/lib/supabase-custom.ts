// Custom Supabase client pointing to external Supabase project
// (NOT the Lovable Cloud-managed instance).
//
// This file is intentionally NOT in src/integrations/supabase/ because that
// directory is auto-managed by Lovable Cloud and would be regenerated.
//
// IMPORTANT: Edge functions still deploy to and run on the Lovable Cloud
// project. Any `supabase.functions.invoke(...)` calls or data writes from
// edge functions will hit the Cloud project, not this one.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://rkwcpnoqnxporjqqlxjt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jm0EgX-n_alN1Leb_WUFpg_A6tEA32M";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
