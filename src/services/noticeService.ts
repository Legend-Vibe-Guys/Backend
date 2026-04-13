import { db } from '../lib/firebase';
import { createNotification } from './notificationService';

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
  commentCount?: number;
}

export const createNotice = async (notice: NoticeInput) => {
  const docRef = db.collection('notices').doc();
  const createdAt = new Date();
  const noticeData = {
    ...notice,
    commentCount: 0,
    createdAt,
  };
  await docRef.set(noticeData);

  // --- 알림 로직 시작 ---
  try {
    const senderName = '선생님'; // TODO: 알림장 서비스 내에서 작성자 이름을 가져올 수 있다면 사용

    if (notice.type === 'individual' && notice.childId) {
      // 개별 알림장 -> 해당 아이의 학부모에게 알림
      const studentDoc = await db.collection('students').doc(notice.childId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        if (studentData?.parentUid) {
          await createNotification({
            recipientUid: studentData.parentUid,
            title: '새로운 개별 알림장이 도착했습니다',
            content: `${notice.title}`,
            type: 'notice',
            link: `/parent/notices/${docRef.id}`,
            senderName,
          });
        }
      }
    } else if (notice.type === 'common') {
      // 공통 알림장 -> 해당 교사의 모든 아이들의 학부모에게 알림
      const studentsSnapshot = await db.collection('students')
        .where('teacherUid', '==', notice.authorUid) // teacherUid 기준 필터링 (authController에서 보정됨)
        .get();
      
      const parentUids = new Set<string>();
      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.parentUid) parentUids.add(data.parentUid);
      });

      for (const parentUid of parentUids) {
        await createNotification({
          recipientUid: parentUid,
          title: '우리반 공통 알림장이 새로 올라왔습니다',
          content: `${notice.title}`,
          type: 'notice',
          link: `/notices/${docRef.id}`,
          senderName,
        });
      }
    }
  } catch (notifError) {
    console.error('Notification trigger error in createNotice:', notifError);
  }
  // --- 알림 로직 끝 ---

  return { id: docRef.id, ...noticeData, createdAt: createdAt.toISOString() };
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
