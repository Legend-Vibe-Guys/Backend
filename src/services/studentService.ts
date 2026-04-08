import { db } from '../lib/firebase';

export const getStudentsByTeacher = async (teacherName: string) => {
  const snapshot = await db.collection('students').where('teacherName', '==', teacherName).get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const getStudentsByParent = async (parentUid: string) => {
  const snapshot = await db.collection('students').where('parentUid', '==', parentUid).get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const updateStudentTraits = async (childId: string, traits: string[]) => {
  await db.collection('students').doc(childId).update({ traits });
};

export const updateStudent = async (childId: string, data: any) => {
  await db.collection('students').doc(childId).update(data);
};

export const getMemosByChild = async (childId: string): Promise<Record<string, string>> => {
  const memosRef = db.collection('student_memos').where('childId', '==', childId);
  const snapshot = await memosRef.get();
  const memos: Record<string, string> = {};
  
  if (!snapshot.empty) {
    snapshot.forEach(doc => {
      const data = doc.data();
      memos[data.date] = data.content;
    });
  }
  return memos;
};

export const saveMemo = async (childId: string, date: string, content: string): Promise<void> => {
  const docId = `${childId}_${date}`;
  const memoRef = db.collection('student_memos').doc(docId);
  
  await memoRef.set({
    childId,
    date,
    content,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

