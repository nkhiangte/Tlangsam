import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getDailyInspiration() {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'settings', 'daily_inspiration');

  try {
    // 1. Try to get cached version from Firestore
    const cachedDoc = await getDoc(docRef);
    if (cachedDoc.exists()) {
      const data = cachedDoc.data();
      if (data.date === today) {
        return data;
      }
    }

    // 2. If no cache or cache is old, try to fetch from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a short, uplifting Bible verse and a brief 1-sentence reflection for a Presbyterian church website. Return it as JSON with fields 'verse', 'reference', and 'reflection'.",
      config: {
        responseMimeType: "application/json",
      },
    });

    const inspiration = JSON.parse(response.text || '{}');
    const newData = { ...inspiration, date: today };

    // 3. Try to update cache in Firestore (will only succeed if user is admin)
    try {
      await setDoc(docRef, newData, { merge: true });
    } catch (e) {
      console.warn("Could not update inspiration cache (likely not an admin):", e);
    }

    return newData;
  } catch (error) {
    console.error("Error fetching inspiration:", error);
    
    // 4. Fallback: try to return the old cached version even if it's not from today
    try {
      const cachedDoc = await getDoc(docRef);
      if (cachedDoc.exists()) {
        return cachedDoc.data();
      }
    } catch (e) {
      // Ignore
    }

    // 5. Ultimate fallback
    return {
      verse: "The Lord is my shepherd; I shall not want.",
      reference: "Psalm 23:1",
      reflection: "Trust in God's guidance and provision for your life today.",
      date: today
    };
  }
}
