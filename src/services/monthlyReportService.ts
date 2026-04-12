import { db } from '../lib/firebase';

export interface MonthlyReportData {
  id?: string;
  childId: string;
  childName: string;
  reportMonth: string;
  details: any;
  teacherId?: string;
  isSent?: boolean;
  createdAt?: string;
}

export const saveMonthlyReport = async (data: MonthlyReportData): Promise<string> => {
  const { id, ...reportData } = data;

  // 1. 명시적 id가 있고 임시 id가 아닌 경우 → 기존 문서 업데이트
  if (id && !id.startsWith('mr-') && !id.startsWith('rep-')) {
    await db.collection('monthlyReports').doc(id).set({
      ...reportData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return id;
  }

  // 2. 같은 childId + reportMonth 의 기존 문서 조회 (월별 1건 보장)
  const existing = await db.collection('monthlyReports')
    .where('childId', '==', data.childId)
    .where('reportMonth', '==', data.reportMonth)
    .limit(1)
    .get();

  if (!existing.empty) {
    // 기존 문서가 있으면 해당 문서를 완전히 덮어씌움 (Upsert)
    const existingDoc = existing.docs[0];
    await existingDoc.ref.set({
      ...reportData,
      createdAt: existingDoc.data().createdAt, // 최초 작성일 보존
      updatedAt: new Date().toISOString()
    });
    return existingDoc.id;
  }

  // 3. 기존 문서가 없으면 신규 생성
  const docRef = await db.collection('monthlyReports').add({
    ...reportData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
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
