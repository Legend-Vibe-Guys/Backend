import { db } from './src/lib/firebase';

async function debug() {
  try {
    console.log('--- Random Users ---');
    const users = await db.collection('users').limit(3).get();
    users.forEach(doc => console.log(`User ID: ${doc.id}, Name: ${doc.data().name}, Role: ${doc.data().role}`));

    console.log('\n--- Random Students ---');
    const students = await db.collection('students').limit(3).get();
    students.forEach(doc => {
      const d = doc.data();
      console.log(`Student ID: ${doc.id}, ParentUid: ${d.parentUid}, TeacherUid: ${d.teacherUid}`);
    });

    console.log('\n--- ALL Notifications (last 5) ---');
    const notifications = await db.collection('notifications').orderBy('createdAt', 'desc').limit(5).get();
    if (notifications.empty) {
      console.log('No notifications found in the entire collection!');
    } else {
      notifications.forEach(doc => {
        const d = doc.data();
        console.log(`Notif ID: ${doc.id}, Recipient: ${d.recipientUid}, Title: ${d.title}, CreatedAt: ${d.createdAt?.toDate?.() || d.createdAt}`);
      });
    }

    // Try to create a test notification for a real user if possible
    if (!users.empty) {
      const firstUser = users.docs[0];
      const testNotif = {
        recipientUid: firstUser.id,
        title: '[TEST] Debug Notification',
        content: 'This is a test notification created by debug script.',
        type: 'notice',
        link: '/',
        isRead: false,
        createdAt: new Date(),
        senderName: 'System'
      };
      const ref = await db.collection('notifications').add(testNotif);
      console.log(`\n[SUCCESS] Created test notification for ${firstUser.data().name} (${firstUser.id}). ID: ${ref.id}`);
    }

  } catch (err) {
    console.error('Debug error:', err);
  }
}

debug().then(() => process.exit(0));
