import { db } from '../lib/firebase';
import admin from 'firebase-admin';

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

  // Transaction to add comment and increment count
  await db.runTransaction(async (transaction) => {
    const noticeRef = db.collection('notices').doc(comment.noticeId);
    const noticeDoc = await transaction.get(noticeRef);
    
    if (!noticeDoc.exists) {
      throw new Error('Notice not found');
    }

    transaction.set(commentRef, commentData);
    transaction.update(noticeRef, {
      commentCount: admin.firestore.FieldValue.increment(1)
    });
  });

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
