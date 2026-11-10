import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 20;

export const supabase: SupabaseClient | null = !isSupabaseConfigured
  ? null
  : typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createBrowserClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== "undefined" && supabase) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) return;
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
      if (!parsed.access_token || !parsed.refresh_token) return;
      void supabase.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      });
    } catch {
      // Ignore a malformed saved session.
    }
  });
}
