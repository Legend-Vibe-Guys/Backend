import { db } from '../lib/firebase';
import { createNotification } from './notificationService';

export interface ScheduleInput {
  authorUid: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
  color?: string;
  isCompleted: boolean;
}

export const createSchedule = async (data: ScheduleInput) => {
  const docRef = db.collection('schedules').doc();
  const createdAt = new Date();
  await docRef.set({
    ...data,
    createdAt,
  });

  // --- 알림 로직 시작 ---
  try {
    const senderName = '선생님';

    // 해당 교사의 모든 아이들의 학부모에게 알림
    const studentsSnapshot = await db.collection('students')
      .where('teacherUid', '==', data.authorUid)
      .get();
    
    const parentUids = new Set<string>();
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.parentUid) parentUids.add(data.parentUid);
    });

    for (const parentUid of parentUids) {
      await createNotification({
        recipientUid: parentUid,
        title: '새로운 우리반 일정이 추가되었습니다',
        content: `${data.title} (${data.date})`,
        type: 'schedule',
        link: '/parent/schedule',
        senderName,
      });
    }
  } catch (notifError) {
    console.error('Notification trigger error in createSchedule:', notifError);
  }
  // --- 알림 로직 끝 ---

  return { id: docRef.id, ...data, createdAt: createdAt.toISOString() };
};

export const getSchedulesByAuthor = async (authorUid: string, date?: string) => {
  let query = db.collection('schedules').where('authorUid', '==', authorUid);
  
  if (date) {
    query = query.where('date', '==', date);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
  });
};

export const getSchedulesByAuthors = async (authorUids: string[], date?: string) => {
  if (authorUids.length === 0) return [];
  
  // Firestore 'in' query supports up to 10 items. 
  // For larger scale, this would need chunking, but for a parent's children it's fine.
  let query = db.collection('schedules').where('authorUid', 'in', authorUids);
  
  if (date) {
    query = query.where('date', '==', date);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
  });
};

export const getAllSchedules = async (date?: string) => {
  let query: any = db.collection('schedules');
  
  if (date) {
    query = query.where('date', '==', date);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
  });
};

export const updateSchedule = async (id: string, data: Partial<ScheduleInput>) => {
  await db.collection('schedules').doc(id).update(data);
};

export const deleteSchedule = async (id: string) => {
  await db.collection('schedules').doc(id).delete();
};
