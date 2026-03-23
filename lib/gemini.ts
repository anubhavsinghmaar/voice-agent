import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
const history: Array<{ role: string; text: string }> = [];

export function initGemini(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
  history.length = 0;
}

export async function generateResponse(userText: string): Promise<string> {
  if (!ai) throw new Error("Gemini not initialized. Call initGemini first.");

  history.push({ role: "user", text: userText });

  // Build contents: for single turn just use string, for multi-turn build array
  let contents: string | Array<{ role: string; parts: Array<{ text: string }> }>;
  if (history.length === 1) {
    contents = userText;
  } else {
    contents = history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
  }

  console.log("[Gemini] Sending request, history length:", history.length);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction:
        "You are a helpful, friendly voice assistant. Keep responses concise and conversational, under 2 to 3 sentences. Be natural and warm.",
      maxOutputTokens: 150,
      temperature: 0.7,
    },
  });

  console.log("[Gemini] Raw response:", JSON.stringify(response).slice(0, 500));

  // Extract text from response - handle different SDK response shapes
  let agentText = "";
  if (typeof response.text === "string") {
    agentText = response.text;
  } else if (typeof response.text === "function") {
    agentText = (response as unknown as { text: () => string }).text();
  } else if (
    response.candidates &&
    response.candidates[0]?.content?.parts?.[0]?.text
  ) {
    agentText = response.candidates[0].content.parts[0].text;
  }

  if (!agentText) {
    agentText = "I'm sorry, I could not process that. Please try again.";
  }

  console.log("[Gemini] Response text:", agentText);

  history.push({ role: "model", text: agentText });

  return agentText;
}

export function clearHistory() {
  history.length = 0;
}
