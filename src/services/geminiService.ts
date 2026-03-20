import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getDailyInspiration() {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'settings', 'daily_inspiration_mizo');

  try {
    // 1. Try to get cached version from Firestore
    let cachedDoc;
    try {
      cachedDoc = await getDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/daily_inspiration');
    }

    if (cachedDoc && cachedDoc.exists()) {
      const data = cachedDoc.data();
      if (data.date === today) {
        return data;
      }
    }

    // 2. If no cache or cache is old, try to fetch from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a short, uplifting Bible verse in Mizo (Mizo Bible) and a brief 1-sentence reflection in Mizo for a Presbyterian church website. Return it as JSON with fields 'verse', 'reference', and 'reflection'.",
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
      verse: "LALPA chu mi vêngtu a ni a, ka tlachham lo vang.",
      reference: "Sâm 23:1",
      reflection: "Vawiinah hian Pathian kaihhruaina leh min chawmnaah rinna nghat tlat rawh.",
      date: today
    };
  }
}
