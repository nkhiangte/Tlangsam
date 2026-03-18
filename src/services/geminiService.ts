import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getDailyInspiration() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a short, uplifting Bible verse and a brief 1-sentence reflection for a Presbyterian church website. Return it as JSON with fields 'verse', 'reference', and 'reflection'.",
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching inspiration:", error);
    return {
      verse: "The Lord is my shepherd; I shall not want.",
      reference: "Psalm 23:1",
      reflection: "Trust in God's guidance and provision for your life today."
    };
  }
}
