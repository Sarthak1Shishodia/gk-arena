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
  const { data, error } = await supabase
    .from("questions")
    .select("payload")
    .eq("game_mode", "timeline")
    .limit(20);

  if (error || !data) return [];
  return data
    .map((row) => TimelinePayloadSchema.safeParse(row.payload))
    .filter((res) => res.success)
    .map((res) => res.data);
}

export async function fetchBlitzQuestions(): Promise<BlitzMcqPayload[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("payload")
    .eq("game_mode", "blitz_mcq")
    .limit(30);

  if (error || !data) return [];
  return data
    .map((row) => BlitzMcqPayloadSchema.safeParse(row.payload))
    .filter((res) => res.success)
    .map((res) => res.data);
}

export async function fetchMapTargets(): Promise<MapPinPayload[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("payload")
    .eq("game_mode", "map_pin")
    .limit(20);

  if (error || !data) return [];
  return data
    .map((row) => MapPinPayloadSchema.safeParse(row.payload))
    .filter((res) => res.success)
    .map((res) => res.data);
}
