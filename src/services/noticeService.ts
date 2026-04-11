import { db } from '../lib/firebase';

export interface NoticeInput {
  type: 'common' | 'individual';
  authorUid: string;
  childId?: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  photoUrl?: string;
  photoUrls?: string[];
  cushionLevel?: string;
  createdAt?: string;
}

export const createNotice = async (notice: NoticeInput) => {
  const docRef = db.collection('notices').doc();
  const createdAt = new Date();
  await docRef.set({
    ...notice,
    createdAt,
  });
  return { id: docRef.id, ...notice, createdAt: createdAt.toISOString() };
};

export const getNoticesByAuthor = async (authorUid: string) => {
  const snapshot = await db.collection('notices')
    .where('authorUid', '==', authorUid)
    .get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt 
    };
  });
};

export const getNoticesByChild = async (childId: string) => {
  const snapshot = await db.collection('notices')
    .where('childId', '==', childId)
    .get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt 
    };
  });
};

export const getNoticesByChildIds = async (childIds: string[]) => {
  if (childIds.length === 0) return [];
  const snapshot = await db.collection('notices')
    .where('childId', 'in', childIds)
    .get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt 
    };
  });
};

export const getCommonNotices = async (authorUids?: string[]) => {
  // authorUids가 undefined이거나 빈 배열이면 반드시 빈 배열 반환
  // (필터 없이 전체 공통 알림장을 반환하지 않도록 방어)
  if (!authorUids || authorUids.length === 0) {
    return [];
  }

  const snapshot = await db.collection('notices')
    .where('type', '==', 'common')
    .where('authorUid', 'in', authorUids)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt 
    };
  });
};

export const getCommonNoticesByAuthors = async (authorUids: string[]) => {
  if (authorUids.length === 0) return [];
  const snapshot = await db.collection('notices')
    .where('type', '==', 'common')
    .where('authorUid', 'in', authorUids)
    .get();
    
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt 
    };
  });
};

export const markAsRead = async (id: string) => {
  await db.collection('notices').doc(id).update({ isRead: true });
};

export const updateNotice = async (id: string, data: Partial<NoticeInput>) => {
  await db.collection('notices').doc(id).update(data);
};

export const deleteNotice = async (id: string) => {
  await db.collection('notices').doc(id).delete();
};
