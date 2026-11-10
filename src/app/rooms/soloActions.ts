"use server";

import fs from "fs/promises";
import os from "os";
import path from "path";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

export type LecturetteAssessment = {
  ai_score: number;
  fluency_feedback: string;
  structure_feedback: string;
  actionable_cures: string;
};

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];

const PROMPT =
  'You are a strict SSB Group Testing Officer (GTO). Analyze this 3-minute lecturette on the topic. Evaluate body language, speaking fluency, and content structure. Return STRICT JSON matching this schema: {"ai_score": int (1-10), "fluency_feedback": "string", "structure_feedback": "string", "actionable_cures": "string"}';

async function getAuthedSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The session can still be read when the response cannot set cookies.
        }
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Sign in to receive your GTO assessment.");
  }
  return { supabase, userId: data.user.id };
}

function parseAssessment(text: string): LecturetteAssessment {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<LecturetteAssessment>;
  const score = Number(parsed.ai_score);
  if (!Number.isFinite(score)) throw new Error("The assessor did not return a score.");
  return {
    ai_score: Math.min(10, Math.max(1, Math.round(score))),
    fluency_feedback: String(parsed.fluency_feedback ?? ""),
    structure_feedback: String(parsed.structure_feedback ?? ""),
    actionable_cures: String(parsed.actionable_cures ?? ""),
  };
}

export async function evaluateLecturette(topic: string, videoUrl: string): Promise<LecturetteAssessment> {
  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!apiKey) throw new Error("Gemini is not configured.");
  if (!videoUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/videos/`)) {
    throw new Error("The lecturette video URL is not in the videos bucket.");
  }

  const { supabase, userId } = await getAuthedSupabase();
  const tempPath = path.join(os.tmpdir(), `temp-lecturette-${userId}.webm`);

  try {
    const download = await fetch(videoUrl);
    if (!download.ok) throw new Error("Could not download the lecturette video.");
    await fs.writeFile(tempPath, Buffer.from(await download.arrayBuffer()));

    const fileManager = new GoogleAIFileManager(apiKey);
    const uploaded = await fileManager.uploadFile(tempPath, {
      mimeType: "video/webm",
      displayName: "lecturette",
    });

    let file = uploaded.file;
    for (let attempt = 0; attempt < 15 && file.state === FileState.PROCESSING; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }
    if (file.state !== FileState.ACTIVE) {
      throw new Error("The lecturette video was not ready for review.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let assessment: LecturetteAssessment | null = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await model.generateContent([
          { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
          { text: `${PROMPT}\n\nTopic: ${topic}` },
        ]);
        assessment = parseAssessment(result.response.text());
        break;
      } catch (modelError) {
        console.warn(`Gemini model ${modelName} failed, trying the next model.`, modelError);
      }
    }
    if (!assessment) {
      throw new Error("All Gemini models are currently busy. Please try again in a minute.");
    }

    const { error } = await supabase.from("lecturettes").insert({
      user_id: userId,
      topic,
      video_url: videoUrl,
      ai_score: assessment.ai_score,
      fluency_feedback: assessment.fluency_feedback,
      structure_feedback: assessment.structure_feedback,
      actionable_cures: assessment.actionable_cures,
    });
    if (error) throw new Error(error.message);

    return assessment;
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}
