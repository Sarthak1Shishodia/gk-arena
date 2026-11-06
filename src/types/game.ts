import { z } from "zod";

export type Subject = "history" | "geography" | "science" | "gk";
export type GameMode = "timeline" | "map_pin" | "blitz_mcq";

export const TimelinePayloadSchema = z.object({
  prompt: z.string(),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      year: z.number(),
      detail: z.string(),
    })
  ).length(4),
});

export const MapPinPayloadSchema = z.object({
  prompt: z.string(),
  targetName: z.string(),
  lat: z.number(),
  lng: z.number(),
  region: z.enum(["india", "world"]),
  fact: z.string(),
});

export const BlitzMcqPayloadSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
});

export type TimelinePayload = z.infer<typeof TimelinePayloadSchema>;
export type MapPinPayload = z.infer<typeof MapPinPayloadSchema>;
export type BlitzMcqPayload = z.infer<typeof BlitzMcqPayloadSchema>;
