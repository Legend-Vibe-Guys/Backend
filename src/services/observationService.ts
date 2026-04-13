import { observationModel } from '../lib/gemini';
import { db } from '../lib/firebase';
import { createNotification } from './notificationService';

export interface ObservationInput {
  childName: string;
  memo: string;
  category: string;
}

export interface ObservationDraft {
  observationContent: string;
  observationEvaluation: string;
}

export interface ObservationRecord extends ObservationInput, ObservationDraft {
  childId: string;
  teacherId: string;
  date: string;
  createdAt?: string;
}

export const generateObservationDraft = async (input: ObservationInput): Promise<ObservationDraft> => {
  const systemPrompt = `당신은 대한민국 유치원의 베테랑 교사입니다. 제공된 [아이 정보]와 [관찰 메모]를 바탕으로, 현장에서 실제로 사용하는 전문적인 [유아관찰일지]를 작성해야 합니다.

출력 형식: 반드시 다음 구조의 JSON 형식으로만 답변하세요.
{
  "observationContent": "객관적이고 구체적인 관찰 내용",
  "observationEvaluation": "발달적 해석 및 교사의 제언"
}

작성 지침 (제공된 실제 샘플의 문체를 따를 것):
1. **관찰 내용 (사실 기록)**:
   - 아이가 한 말을 큰따옴표("")를 사용하여 생생하게 포함하세요. (예: "선생님 솜이 진짜 눈같아요. OO아 진짜 눈같지?"라고 이야기한다.)
   - 행동을 아주 구체적으로 묘사하세요. (예: 한 발로 서서 손을 마구 흔들어 보기도 하며 균형을 잡으려고 시도함.)
   - "~함", "~함이 관찰됨", "~함이 인상적임"과 같은 전문적인 보고서 어조를 사용하세요.

2. **관찰 평가 (해석 및 지도)**:
   - 해당 행동이 어떤 발달적 의미를 갖는지 해석하세요. (예: 운동신경이 매우 잘 발달되고 있는 것으로 보인다.)
   - 사회적 상호작용에 대한 교사의 지도 내용을 포함하세요. (예: 친구의 마음을 상하게 할 수 있음을 설명해주고 어떻게 이야기하면 좋을지 서로 이야기 나누었음.)
   - "~임", "~해보임", "~하는 모습이 긍정적임"과 같은 어조로 마무리하세요.

3. **주의사항**:
   - 전체 분량은 공백 포함 각 항목당 150~250자 내외로 상세하게 작성하세요.
   - 메모에 없는 내용을 지어내되, 교육 전문가로서의 상식적인 추론은 포함할 수 있습니다.
   - 오직 JSON 데이터만 반환하세요.`;

  const userPrompt = `
[아이 정보] 이름: ${input.childName}
[누리과정 영역] 영역: ${input.category}
[관찰 메모] 메모: ${input.memo}
  `;

  try {
    const result = await observationModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    });

    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json|```/g, "").trim();

    const jsonResponse = JSON.parse(text);

    return {
      observationContent: jsonResponse.observationContent || jsonResponse.content || "",
      observationEvaluation: jsonResponse.observationEvaluation || jsonResponse.evaluation || ""
    };
  } catch (error: any) {
    console.error('Gemini Observation Error:', error);
    throw new Error(`관찰일지 생성 중 오류 발생: ${error.message}`);
  }
};

// --- 삭제되었던 함수들 복구 ---

export const saveObservation = async (data: ObservationRecord): Promise<string> => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  
  const docRef = await db.collection('observations').add({
    ...data,
    createdAt: kstDate.toISOString().replace('Z', '+09:00')
  });

  // --- 알림 로직 시작 ---
  try {
    const studentDoc = await db.collection('students').doc(data.childId).get();
    if (studentDoc.exists) {
      const studentData = studentDoc.data();
      if (studentData?.parentUid) {
        await createNotification({
          recipientUid: studentData.parentUid,
          title: '우리 아이의 새로운 성장 기록이 올라왔습니다',
          content: `${data.childName} 유아의 관찰 기록을 확인해보세요.`,
          type: 'observation',
          link: '/parent/observation', // 성장기록 목록 또는 상세 페이지로 이동
          senderName: '선생님',
        });
      }
    }
  } catch (notifError) {
    console.error('Notification trigger error in saveObservation:', notifError);
  }
  // --- 알림 로직 끝 ---

  return docRef.id;
};

export const getObservations = async (filters: { childId?: string | string[]; category?: string; date?: string; teacherId?: string }) => {
  let query: any = db.collection('observations');

  // 필터링 적용 (Firestore 단일 필드 쿼리들)
  if (filters.category && filters.category.trim() !== "") {
    query = query.where('category', '==', filters.category.trim());
  }
  if (filters.date && filters.date.trim() !== "") {
    query = query.where('date', '==', filters.date.trim());
  }

  const snapshot = await query.get();
  
  // 메모리 상에서 필터링 (복잡한 OR 조건 및 데이터 유연성 대응)
  let results = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));

  // 권한/매핑 필터링 (메모리 필터링)
  results = results.filter((obs: any) => {
    // 1. 특정 아동(childId) 필터링 (요청이 온 경우 반드시 일치해야 함)
    if (filters.childId) {
      const matchChild = Array.isArray(filters.childId)
        ? filters.childId.includes(obs.childId)
        : obs.childId === filters.childId.trim();
      
      if (!matchChild) return false;
    }
    
    // 2. 작성자(teacherId) 필터링 (요청이 온 경우 반드시 일치해야 함)
    // - 작성자 정보가 없는 구버전 데이터나 다른 교사의 데이터는 제외됨
    if (filters.teacherId) {
      if (obs.teacherId !== filters.teacherId.trim()) return false;
    }

    return true;
  });

  // 수동 정렬 (최신순)
  return results.sort((a: any, b: any) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
};

export const deleteObservation = async (id: string): Promise<void> => {
  await db.collection('observations').doc(id).delete();
};

export const updateObservation = async (id: string, data: Partial<ObservationRecord>): Promise<void> => {
  await db.collection('observations').doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
  });
};
