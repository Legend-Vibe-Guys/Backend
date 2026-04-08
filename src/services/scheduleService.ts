import { db } from '../lib/firebase';

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
