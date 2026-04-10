import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다.');
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// gemini-2.5-flash 모델 사용
// "gemini-3-flash-preview"
// "gemini-3.1-flash-lite-preview"
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  }
});
