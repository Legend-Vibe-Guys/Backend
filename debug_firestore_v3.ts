import { db } from './src/lib/firebase';

async function debug() {
  try {
    console.log('--- Notices ---');
    const notices = await db.collection('notices').limit(5).get();
    for (const doc of notices.docs) {
      const d = doc.data();
      console.log(`Notice ID: ${doc.id}, Title: ${d.title}, AuthorUid: ${d.authorUid}, Type: ${d.type}`);
    }

    console.log('\n--- Recent Comments ---');
    const comments = await db.collection('notice_comments').orderBy('createdAt', 'desc').limit(5).get();
    for (const doc of comments.docs) {
      const d = doc.data();
      console.log(`Comment ID: ${doc.id}, NoticeId: ${d.noticeId}, AuthorName: ${d.authorName}, AuthorRole: ${d.authorRole}`);
    }

    console.log('\n--- Recent Notifications related to Comments ---');
    const commentNotifications = await db.collection('notifications').where('type', '==', 'comment').orderBy('createdAt', 'desc').limit(5).get();
    for (const doc of commentNotifications.docs) {
      const d = doc.data();
      console.log(`Notif ID: ${doc.id}, Recipient: ${d.recipientUid}, Title: ${d.title}, Content: ${d.content}`);
    }

  } catch (err) {
    console.error('Debug error:', err);
  }
}

debug().then(() => process.exit(0));
