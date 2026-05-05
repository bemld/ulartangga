import { GoogleGenAI, Schema } from "@google/genai";

/**
 * Robust Gemini AI Service with API Key Rotation
 * Supports a comma-separated list of keys in VITE_API_KEY
 */

const getApiKeys = (): string[] => {
  const rawKeys = import.meta.env.VITE_API_KEY || "";
  return rawKeys.split(",").map((k: string) => k.trim()).filter((k: string) => k.length > 0);
};

let currentKeyIndex = 0;

export interface AIServiceRequest {
  model?: string;
  prompt: string;
  responseSchema?: Schema;
  responseMimeType?: string;
}

export const generateAIContent = async (request: AIServiceRequest): Promise<string> => {
  const keys = getApiKeys();
  
  if (keys.length === 0) {
    throw new Error("API Key tidak ditemukan. Harap atur VITE_API_KEY di environment variables.");
  }

  // Try each key starting from the current index
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const apiKey = keys[keyIndex];
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const config: any = {
        responseMimeType: request.responseMimeType || "application/json",
      };
      
      if (request.responseSchema) {
        config.responseSchema = request.responseSchema;
      }

      const response = await ai.models.generateContent({
        model: request.model || "gemini-3-flash-preview",
        contents: request.prompt,
        config,
      });

      const text = response.text;
      
      if (!text) {
        throw new Error("Model returned empty text.");
      }

      // If successful, update the global index to this working key for future calls
      currentKeyIndex = keyIndex;
      return text;
      
    } catch (error: any) {
      console.warn(`API Key ke-${keyIndex + 1} gagal:`, error.message || error);
      
      // If it's a rate limit error (429) or quota error, try the next key
      const errorMessage = (error.message || "").toLowerCase();
      const isRateLimit = errorMessage.includes("429") || 
                          errorMessage.includes("too many requests") || 
                          errorMessage.includes("quota exceeded") ||
                          errorMessage.includes("exhausted");
                          
      if (isRateLimit && attempt < keys.length - 1) {
        console.log("Mencoba API Key berikutnya...");
        continue; // Try next key
      }
      
      // If it's the last key or not a rate limit error, throw
      throw error;
    }
  }

  throw new Error("Semua API Key telah mencapai batas limit. Harap coba beberapa saat lagi.");
};
