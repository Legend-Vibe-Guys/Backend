import { noticeModel } from '../lib/gemini';
import { db } from '../lib/firebase';

export interface ReportInput {
  childName: string;
  commonActivities: string;
  specialNote?: string;
  length: 'short' | 'long';
}

export const generateDailyReport = async (input: ReportInput): Promise<string> => {
  const lengthInstruction = input.length === 'short' 
    ? '알림장 길이는 2~3문장 정도로 짧고 간결하게 작성해주세요.' 
    : '알림장 길이는 5~7문장 정도로 부모님이 상황을 생생하게 느낄 수 있도록 자세하게 작성해주세요.';

  const systemPrompt = `당신은 학부모님께 신뢰를 주는 따뜻하고 다정한 유치원 교사입니다. 
다음 제공된 [아이 정보]와 [오늘의 활동 내역]을 바탕으로 학부모님께 보낼 알림장 1편을 작성해 주세요. 
어조는 '~했어요', '~했답니다' 체를 사용해 주세요. 
쿠션어를 적절히 섞어 학부모님이 기분 좋게 읽으실 수 있도록 하세요.
${lengthInstruction}

**주의사항 (매우 중요)**: 
1. 제공된 키워드 외에 교사가 하지 않은 행동이나 아이가 하지 않은 활동을 절대 지어내지 마세요. 
2. 없는 사실을 지어내어 알림장을 길게 만들려고 하지 마세요. 
3. 할루네이션(없는 사실 생성) 방지가 가장 중요합니다.
4. 제공된 모든 [아이 정보]와 [활동 내역]은 웬만하면 하나도 빠짐없이 알림장에 포함되어야 합니다.
5. 알림장 본문에 "저는 5년 차 베테랑 교사입니다", "저는 유치원 교사입니다" 같은 본인 소개나 직업 언급을 절대 하지 마세요.`;

  const userPrompt = `
[아이 정보]
이름: ${input.childName}
특이사항(간단 메모): ${input.specialNote || '특이사항 없음'}

[오늘의 활동 내역]
오늘 반 공통 활동: ${input.commonActivities}

위 정보를 바탕으로 다정한 알림장을 작성해 주세요. *"제공된 키워드 외에 교사가 하지 않은 행동이나 아이가 하지 않은 활동을 절대 지어내지 마세요"* 지침을 반드시 지켜주세요.
  `;

  try {
    const result = await noticeModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('개별 알림장 생성 중 오류가 발생했습니다.');
  }
};

export interface CommonReportInput {
  content: string;
}

export const generateCommonReport = async (input: CommonReportInput): Promise<string> => {
  const systemPrompt = `당신은 학부모님께 신뢰를 주는 따뜻하고 다정한 유치원 교사입니다.
다음 제공된 [전달 내용]을 바탕으로, 해당 반 학부모님들 전체에게 보내는 공통 알림장(안내문)을 1편 작성해 주세요.
어조는 '~했어요', '~했답니다', '~부탁드립니다' 등 다정하고 정중한 체를 사용해 주세요.

**주의사항 (매우 중요)**:
1. 전달 내용에 없는 사실이나 일정을 절대 지어내지 마세요.
2. 모두가 공유하는 내용이므로 특정 아이의 이름을 언급하지 마세요.
3. 알림장 본문에 본인 소개("저는 교사입니다" 등)를 하지 마세요.
4. 끝맺음 인사말을 따뜻하게 포함해 주세요.
5. 할루네이션 방지가 가장 중요합니다.`;

  const userPrompt = `
[전달 내용]
${input.content}

위 내용을 자연스럽고 따뜻한 글로 완성해 주세요.
  `;

  try {
    const result = await noticeModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('공통 알림장 생성 중 오류가 발생했습니다.');
  }
};

// --- Monthly Report Persistence ---

export interface MonthlyReportData {
  id?: string;
  childId: string;
  childName: string;
  reportMonth: string;
  details: any;
  teacherId?: string;
  createdAt?: string;
}

export const saveMonthlyReport = async (data: MonthlyReportData): Promise<string> => {
  const { id, ...reportData } = data;
  
  if (id && !id.startsWith('mr-') && !id.startsWith('rep-')) {
    // 기존 데이터 업데이트
    await db.collection('monthlyReports').doc(id).set({
      ...reportData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return id;
  } else {
    // 신규 데이터 생성
    const docRef = await db.collection('monthlyReports').add({
      ...reportData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }
};

export const getMonthlyReportsByChild = async (childId: string) => {
  const snapshot = await db.collection('monthlyReports')
    .where('childId', '==', childId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteMonthlyReport = async (id: string) => {
  await db.collection('monthlyReports').doc(id).delete();
};
