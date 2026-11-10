import { supabase, isSupabaseConfigured } from "./client";
import {
  TimelinePayload,
  TimelinePayloadSchema,
  MapPinPayload,
  MapPinPayloadSchema,
  BlitzMcqPayload,
  BlitzMcqPayloadSchema,
} from "@/types/game";

export async function fetchTimelineRounds(): Promise<TimelinePayload[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("questions").select("payload").eq("game_mode", "timeline").limit(20);
  return (data || []).map((row) => TimelinePayloadSchema.safeParse(row.payload)).filter((res) => res.success).map((res) => res.data);
}

export async function fetchBlitzQuestions(): Promise<BlitzMcqPayload[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("questions").select("payload").eq("game_mode", "blitz_mcq").limit(30);
  return (data || []).map((row) => BlitzMcqPayloadSchema.safeParse(row.payload)).filter((res) => res.success).map((res) => res.data);
}

export async function fetchMapTargets(): Promise<MapPinPayload[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("questions").select("payload").eq("game_mode", "map_pin").limit(20);
  return (data || []).map((row) => MapPinPayloadSchema.safeParse(row.payload)).filter((res) => res.success).map((res) => res.data);
}

export async function getTopPlayers(metric: "contest_elo" | "practice_xp") {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("username, contest_elo, practice_xp, current_streak")
    .order(metric, { ascending: false })
    .limit(10);
  return data || [];
}

export async function addPracticeXp(points: number) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { data: profile } = await supabase.from("profiles").select("practice_xp").eq("id", session.user.id).single();
  if (profile) {
    await supabase.from("profiles").update({ practice_xp: profile.practice_xp + points }).eq("id", session.user.id);
  }
}

export async function updateContestElo(points: number): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase.from("profiles").select("contest_elo").eq("id", session.user.id).single();
  if (!profile || typeof profile.contest_elo !== "number") return null;

  const nextElo = Math.max(100, profile.contest_elo + points);
  const { error } = await supabase.from("profiles").update({ contest_elo: nextElo }).eq("id", session.user.id);
  if (error) return null;

  return nextElo - profile.contest_elo;
}

export async function logMistake(payload: any) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase.from("mistakes").insert({
    user_id: session.user.id,
    payload,
  });
}

export async function fetchMistakes(): Promise<{ id: string; payload: BlitzMcqPayload }[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data } = await supabase
    .from("mistakes")
    .select("id, payload")
    .eq("user_id", session.user.id);

  return (data || [])
    .map((row) => {
      const parsed = BlitzMcqPayloadSchema.safeParse(row.payload);
      if (!parsed.success || typeof row.id !== "string") return null;
      return { id: row.id, payload: parsed.data };
    })
    .filter((row): row is { id: string; payload: BlitzMcqPayload } => row !== null);
}

export async function removeMistake(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase.from("mistakes").delete().eq("id", id).eq("user_id", session.user.id);
}