import { geminiModel } from '../lib/gemini';

export interface ReportInput {
  childName: string;
  mood: string;
  lunch: string;
  nap: string;
  keywords: string;
  specialNote?: string;
}

export const generateDailyReport = async (input: ReportInput): Promise<string> => {
  const systemPrompt = `당신은 학부모님께 신뢰를 주는 따뜻하고 다정한 유치원 교사입니다. 
다음 제공된 [아이 정보]와 [오늘의 활동 내역]을 바탕으로 학부모님께 보낼 알림장 1편을 작성해 주세요. 
어조는 '~했어요', '~했답니다' 체를 사용해 주세요. 
쿠션어를 적절히 섞어 학부모님이 기분 좋게 읽으실 수 있도록 하세요.

**주의사항 (매우 중요)**: 
1. 제공된 키워드 외에 교사가 하지 않은 행동이나 아이가 하지 않은 활동을 절대 지어내지 마세요. 
2. 없는 사실을 지어내어 알림장을 길게 만들려고 하지 마세요. 
3. 할루네이션(없는 사실 생성) 방지가 가장 중요합니다.
4. 제공된 모든 [아이 정보]와 [활동 내역]은 웬만하면 하나도 빠짐없이 알림장에 포함되어야 합니다.
5. 알림장 본문에 "저는 5년 차 베테랑 교사입니다", "저는 유치원 교사입니다" 같은 본인 소개나 직업 언급을 절대 하지 마세요.`;

  const userPrompt = `
[아이 정보]
이름: ${input.childName}
상태: 기분(${input.mood}), 점심(${input.lunch}), 낮잠(${input.nap})
특이사항: ${input.specialNote || '없음'}

[오늘의 활동 내역]
활동 키워드: ${input.keywords}

위 정보를 바탕으로 다정한 알림장을 작성해 주세요. *"제공된 키워드 외에 교사가 하지 않은 행동이나 아이가 하지 않은 활동을 절대 지어내지 마세요"* 지침을 반드시 지켜주세요.
  `;

  try {
    const result = await geminiModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('알림장 생성 중 오류가 발생했습니다.');
  }
};
