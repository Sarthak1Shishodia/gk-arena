"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize secure server-side clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];

export async function generateAndInjectQuestions(material: string, mode: string) {
  try {
    let prompt = "";
    let gameModeTag = "";

    // 1. Construct the strict JSON prompt based on the selected game mode
    if (mode === "Blitz" || mode === "blitz") {
      gameModeTag = "blitz_mcq";
      prompt = `Extract facts from the following study material and generate 5 high-yield multiple-choice questions.
      Return a JSON array of objects with this EXACT structure:
      [{"subject": "history"|"geography"|"science"|"gk", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "Deep concept explanation"}]
      Material: ${material}`;
    } else if (mode === "Timeline" || mode === "timeline") {
      gameModeTag = "timeline";
      prompt = `Extract historical events from the following material and generate 2 timeline sorting rounds.
      Return a JSON array of objects with this EXACT structure:
      [{"prompt": "Arrange these events chronologically:", "events": [{"id": "1", "title": "...", "year": 1947, "detail": "..."}]}]
      (Ensure each round has exactly 4 events. Year can be negative for BCE).
      Material: ${material}`;
    } else if (mode === "Map" || mode === "map") {
      gameModeTag = "map_pin";
      prompt = `Extract geographical/historical locations from the following material and generate 3 map pin-drop targets.
      Return a JSON array of objects with this EXACT structure:
      [{"prompt": "Drop a pin on...", "targetName": "...", "lat": 22.5, "lng": 78.0, "region": "india", "fact": "..."}]
      (Lat must be between 7.0 and 37.0, Lng must be between 68.0 and 97.0).
      Material: ${material}`;
    } else {
      throw new Error("Invalid game mode selected.");
    }

    // 2. Beam to Gemini and parse the structured output
    let jsonText = "";
    let generated = false;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await model.generateContent(prompt);
        jsonText = result.response.text();
        generated = true;
        break;
      } catch (modelError) {
        console.warn(`Gemini model ${modelName} failed, trying the next model.`, modelError);
      }
    }

    if (!generated) {
      throw new Error("All Gemini models are currently busy. Please try again in a minute.");
    }
    const items = JSON.parse(jsonText);

    if (!Array.isArray(items)) throw new Error("AI did not return a valid array.");

    // 3. Map to Supabase schema and inject
    const rows = items.map((payload: any) => ({
      subject: payload.subject || "gk",
      game_mode: gameModeTag,
      exam_tags: ["Admin Generated"],
      difficulty_elo: 1250,
      payload: payload,
    }));

    const { error } = await supabase.from("questions").insert(rows);
    if (error) throw error;

    return { success: true, count: rows.length };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, error: error.message };
  }
}