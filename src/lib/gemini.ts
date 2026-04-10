import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// 알림장용 메인 API 키
const noticeApiKey = process.env.GEMINI_API_KEY;
// 관찰일지전용 API 키 (없을 경우 메인 키로 폴백) 
const observationApiKey = process.env.GEMINI_API_KEY_OBSERVATION || noticeApiKey;

if (!noticeApiKey) {
  console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다.');
}

const noticeAI = new GoogleGenerativeAI(noticeApiKey || "");
const observationAI = new GoogleGenerativeAI(observationApiKey || "");

// 1. 알림장용 모델 (Notice/Report) -- 모델 수정할려고 하면 ex) model: "gemini-3.1-pro" 수정하면 됌. 
// 현재는 gemini-3.1-flash-lite-preview 모델이 젤 많이 쓸 수 있음
export const noticeModel = noticeAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  }
});

// 2. 관찰일지용 모델 (Observation) 
export const observationModel = observationAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  }
});
