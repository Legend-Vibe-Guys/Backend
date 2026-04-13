import { db } from './src/lib/firebase';

async function findUser() {
  try {
    const users = await db.collection('users').where('name', '==', '토란').get();
    if (users.empty) {
      console.log('User "토란" not found. Searching all users...');
      const allUsers = await db.collection('users').limit(10).get();
      allUsers.forEach(doc => console.log(`ID: ${doc.id}, Name: ${doc.data().name}`));
    } else {
      const user = users.docs[0];
      console.log(`Found User: ${user.data().name}, UID: ${user.id}, Role: ${user.data().role}`);
      
      const notifications = await db.collection('notifications').where('recipientUid', '==', user.id).get();
      console.log(`Notifications for this user: ${notifications.size}`);
      notifications.forEach(doc => console.log(`- [${doc.data().isRead ? 'READ' : 'UNREAD'}] ${doc.data().title}`));
    }
  } catch (err) {
    console.error(err);
  }
}

findUser().then(() => process.exit(0));
