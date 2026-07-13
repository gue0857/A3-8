// services/aiService.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzePatientFeedback(patientText) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // 或 gemini-pro
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      你是一位專業的醫療個案管理師。
      請分析以下病人的主訴內容，並回傳嚴格的 JSON 格式。
      
      需分析欄位：
      1. "emotion": 核心情緒 (字串)。
      2. "urgency_score": 急迫性分數 (1-10，數字)。
      3. "symptoms": 生理症狀 (字串陣列)。
      4. "needs_human_intervention": 是否需人工介入 (布林值)。
      5. "summary": 給醫師的簡短摘要 (字串)。

      病人自述： "${patientText}"
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());

    } catch (error) {
        console.error("AI 分析失敗:", error);
        // 回傳預設安全值，避免系統崩潰
        return { urgency_score: 0, summary: "AI 分析失敗，請人工檢視", symptoms: [], needs_human_intervention: true };
    }
}

module.exports = { analyzePatientFeedback };