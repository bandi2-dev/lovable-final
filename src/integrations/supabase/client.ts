import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

console.log('Supabase Configuration:', {
  url: url ? '***SET***' : undefined,
  key: key ? '***SET***' : undefined,
  supabaseEnabled: Boolean(url && key)
});

export const supabaseEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "resumate.sb" },
    })
  : null;

export interface AnalysisRow {
  id?: string;
  user_email: string;
  file_name: string;
  ats_score: number;
  jd_overlap: number | null;
  summary: string | null;
  created_at?: string;
}

export async function saveAnalysis(row: AnalysisRow): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const { error } = await supabase.from("analyses").insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listAnalyses(email: string): Promise<AnalysisRow[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as AnalysisRow[]) ?? [];
}
