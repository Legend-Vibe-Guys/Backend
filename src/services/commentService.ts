import { db } from '../lib/firebase';
import admin from 'firebase-admin';
import { createNotification } from './notificationService';

export interface CommentInput {
  noticeId: string;
  authorUid: string;
  authorName: string;
  authorRole: 'teacher' | 'parent';
  content: string;
}

export const addComment = async (comment: CommentInput) => {
  const commentRef = db.collection('notice_comments').doc();
  const createdAt = new Date();
  
  const commentData = {
    ...comment,
    createdAt: admin.firestore.Timestamp.fromDate(createdAt),
  };

  let noticeData: any = null;

  // Transaction to add comment and increment count
  await db.runTransaction(async (transaction) => {
    const noticeRef = db.collection('notices').doc(comment.noticeId);
    const noticeDoc = await transaction.get(noticeRef);
    
    noticeData = noticeDoc.data();
    
    if (!noticeDoc.exists || !noticeData) {
      throw new Error('Notice not found');
    }

    transaction.set(commentRef, commentData);
    transaction.update(noticeRef, {
      commentCount: admin.firestore.FieldValue.increment(1)
    });
  });

  // --- 알림 로직 시작 (트랜잭션 외부에서 실행) ---
  try {
    let recipientUid = '';
    let title = '';
    const content = `${comment.authorName}님이 댓글을 남겼습니다: "${comment.content.substring(0, 20)}${comment.content.length > 20 ? '...' : ''}"`;
    let link = '';

    if (comment.authorRole === 'parent') {
      // 부모가 댓글을 쓴 경우 -> 알림장 작성자(교사)에게 알림
      recipientUid = noticeData?.authorUid;
      title = '알림장에 새로운 댓글이 달렸습니다';
      link = `/teacher/notice/detail/${comment.noticeId}`;
    } else {
      // 교사가 댓글을 쓴 경우 -> 해당 아이의 부모에게 알림
      if (noticeData?.type === 'individual' && noticeData?.childId) {
        const studentDoc = await db.collection('students').doc(noticeData.childId).get();
        if (studentDoc.exists) {
          recipientUid = studentDoc.data()?.parentUid;
          title = '아이의 알림장에 선생님이 댓글을 남겼습니다';
          link = `/parent/notices/${comment.noticeId}`;
        }
      }
    }

    if (recipientUid && recipientUid !== comment.authorUid) {
      await createNotification({
        recipientUid,
        title,
        content,
        type: 'comment',
        link,
        senderName: comment.authorName,
      });
    }
  } catch (notifError) {
    console.error('Notification trigger error in addComment:', notifError);
  }
  // --- 알림 로직 끝 ---

  return { 
    id: commentRef.id, 
    ...comment, 
    createdAt: createdAt.toISOString() 
  };
};

export const getCommentsByNotice = async (noticeId: string) => {
  const snapshot = await db.collection('notice_comments')
    .where('noticeId', '==', noticeId)
    // .orderBy('createdAt', 'asc') // Index required for this
    .get();

  const comments = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
    };
  });

  // Sort in memory for now to avoid index issue
  return comments.sort((a, b) => (a.createdAt as string).localeCompare(b.createdAt as string));
};

export const deleteComment = async (commentId: string, noticeId: string) => {
  const commentRef = db.collection('notice_comments').doc(commentId);
  const noticeRef = db.collection('notices').doc(noticeId);

  await db.runTransaction(async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists) {
      throw new Error('Comment not found');
    }

    transaction.delete(commentRef);
    transaction.update(noticeRef, {
      commentCount: admin.firestore.FieldValue.increment(-1)
    });
  });
};

export const updateComment = async (commentId: string, content: string) => {
  const commentRef = db.collection('notice_comments').doc(commentId);
  const updatedAt = new Date();

  await commentRef.update({
    content,
    updatedAt: admin.firestore.Timestamp.fromDate(updatedAt),
    isEdited: true
  });

  return {
    id: commentId,
    content,
    updatedAt: updatedAt.toISOString()
  };
};
