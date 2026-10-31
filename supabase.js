// Supabase browser client. Publishable keys are designed for public clients; all access is protected by RLS.
(() => {
  const SUPABASE_URL = "https://hhczwzdsciwlaieeutjl.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7UJalT1W5bd90zE5e9Bm4g_m1uJDkhc";
  if (!window.supabase?.createClient) {
    console.error("Supabase JS library gagal dimuat.");
    return;
  }
  window.dashboardSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();