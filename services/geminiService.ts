
import { GoogleGenAI } from "@google/genai";
import { DashboardStats } from "../types";

export const generateDashboardReport = async (stats: DashboardStats): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Thiếu API Key. Vui lòng cấu hình process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Hãy phân tích các số liệu thống kê dưới đây và cung cấp một bản tóm tắt điều hành ngắn gọn, chuyên nghiệp (2-3 câu)
      cùng với 3 đề xuất hành động cụ thể để cải thiện tỷ lệ lấp đầy hoặc tăng doanh thu.
      
      **YÊU CẦU QUAN TRỌNG: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT.**
      
      Số liệu thống kê:
      ${JSON.stringify(stats, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là trợ lý AI thông minh cho Hệ thống Quản lý Nhà trọ / Ký túc xá.",
      },
    });

    return response.text || "Không thể tạo báo cáo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối đến dịch vụ AI.";
  }
};
