import { db } from '../lib/firebase';
import admin from 'firebase-admin';

export interface NotificationInput {
  recipientUid: string;
  title: string;
  content: string;
  type: 'comment' | 'notice' | 'observation' | 'schedule' | 'class_update' | 'health_update';
  link: string;
  senderName: string;
}

export const createNotification = async (notif: NotificationInput) => {
  console.log('[DEBUG] Creating notification:', notif);
  const notifRef = db.collection('notifications').doc();
  const createdAt = admin.firestore.Timestamp.now();

  const notifData = {
    ...notif,
    isRead: false,
    createdAt,
  };

  try {
    await notifRef.set(notifData);
    console.log('[DEBUG] Notification created successfully. ID:', notifRef.id);
  } catch (err) {
    console.error('[DEBUG] Failed to create notification:', err);
  }
  
  return { id: notifRef.id, ...notifData, createdAt: createdAt.toDate().toISOString() };
};

export const getNotifications = async (userId: string, limitCount = 20) => {
  const snapshot = await db.collection('notifications')
    .where('recipientUid', '==', userId)
    .limit(limitCount)
    .get();

  const notifications = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
    };
  });

  // Sort in memory (newest first)
  return notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const markAsRead = async (id: string) => {
  await db.collection('notifications').doc(id).update({ isRead: true });
};

export const markAllAsRead = async (userId: string) => {
  const snapshot = await db.collection('notifications')
    .where('recipientUid', '==', userId)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    if (!doc.data().isRead) {
      batch.update(doc.ref, { isRead: true });
    }
  });

  await batch.commit();
};
