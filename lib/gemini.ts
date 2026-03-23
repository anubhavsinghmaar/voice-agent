import { GoogleGenAI } from "@google/genai";

interface ConversationMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

let ai: GoogleGenAI | null = null;
const history: ConversationMessage[] = [];

export function initGemini(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
  history.length = 0;
}

export async function generateResponse(userText: string): Promise<string> {
  if (!ai) throw new Error("Gemini not initialized. Call initGemini first.");

  history.push({ role: "user", parts: [{ text: userText }] });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history.map((m) => ({ role: m.role, parts: m.parts })),
    config: {
      systemInstruction:
        "You are a helpful, friendly voice assistant. Keep responses concise and conversational, under 2 to 3 sentences. Be natural and warm.",
      maxOutputTokens: 150,
      temperature: 0.7,
    },
  });

  const agentText = response.text ?? "I'm sorry, I could not process that. Please try again.";

  history.push({ role: "model", parts: [{ text: agentText }] });

  return agentText;
}

export function clearHistory() {
  history.length = 0;
}
