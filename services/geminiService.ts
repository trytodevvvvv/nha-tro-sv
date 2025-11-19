import { GoogleGenAI } from "@google/genai";
import { DashboardStats } from "../types";

export const generateDashboardReport = async (stats: DashboardStats): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "Gemini API Key is missing. Please define process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    const prompt = `
      You are an AI assistant for a Dormitory Management System.
      Analyze the following dashboard statistics and provide a brief, professional executive summary 
      (2-3 sentences) and 3 actionable recommendations to improve occupancy or revenue.
      
      Stats:
      ${JSON.stringify(stats, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to Gemini AI service.";
  }
};
