"use server";

import fs from "fs/promises";
import os from "os";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

export type ReadingScorecard = {
  wpm_score: number;
  pronunciation_score: number;
  stutter_count: number;
  feedback: string;
};

const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];

function buildPrompt(sourceText: string) {
  return `You are a strict Services Selection Board (SSB) Psychologist and Group Testing Officer.
The candidate was asked to read the following text aloud on camera:
"${sourceText}"

Analyze their video and audio. Grade them strictly on:
1. Words Per Minute (Pacing): Is it too fast (nervous) or too slow (hesitant)?
2. Pronunciation & Clarity: Did they mumble, mispronounce words, or lack vocal projection?
3. Stutters & Pauses: Count the filler words (um, uh) and awkward pauses.

Return STRICT JSON matching this schema:
{
  "wpm_score": number,
  "pronunciation_score": integer from 1 to 10,
  "stutter_count": integer,
  "feedback": "2 sentences of strict, direct feedback on their vocal command and body language"
}`;
}

function parseScorecard(text: string): ReadingScorecard {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<ReadingScorecard>;
  const words = Number(parsed.wpm_score);
  const pronunciation = Number(parsed.pronunciation_score);
  const stutters = Number(parsed.stutter_count);
  if (!Number.isFinite(words) || !Number.isFinite(pronunciation) || !Number.isFinite(stutters)) {
    throw new Error("The assessor did not return a complete scorecard.");
  }
  return {
    wpm_score: Math.max(0, Math.round(words)),
    pronunciation_score: Math.min(10, Math.max(1, Math.round(pronunciation))),
    stutter_count: Math.max(0, Math.round(stutters)),
    feedback: String(parsed.feedback ?? ""),
  };
}

export async function evaluateReading(videoUrl: string, sourceText: string): Promise<ReadingScorecard> {
  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!apiKey) throw new Error("Gemini is not configured.");
  if (!sourceText.trim()) throw new Error("The reading passage is missing.");
  if (!videoUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/videos/`)) {
    throw new Error("The reading video URL is not in the videos bucket.");
  }

  const tempPath = path.join(os.tmpdir(), `temp-reading-${Date.now()}.webm`);

  try {
    const download = await fetch(videoUrl);
    if (!download.ok) throw new Error("Could not download the reading video.");
    await fs.writeFile(tempPath, Buffer.from(await download.arrayBuffer()));

    const fileManager = new GoogleAIFileManager(apiKey);
    const uploaded = await fileManager.uploadFile(tempPath, {
      mimeType: "video/webm",
      displayName: "reading",
    });

    let file = uploaded.file;
    for (let attempt = 0; attempt < 15 && file.state === FileState.PROCESSING; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }
    if (file.state !== FileState.ACTIVE) {
      throw new Error("The reading video was not ready for review.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let scorecard: ReadingScorecard | null = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await model.generateContent([
          { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
          { text: buildPrompt(sourceText) },
        ]);
        scorecard = parseScorecard(result.response.text());
        break;
      } catch (modelError) {
        console.warn(`Gemini model ${modelName} failed, trying the next model.`, modelError);
      }
    }
    if (!scorecard) {
      throw new Error("All Gemini models are currently busy. Please try again in a minute.");
    }
    return scorecard;
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}
