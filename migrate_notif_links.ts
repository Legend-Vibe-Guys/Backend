import { db } from './src/lib/firebase';

async function migrate() {
  try {
    const snapshot = await db.collection('notifications').get();
    console.log(`Checking ${snapshot.size} notifications...`);

    const batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldLink = data.link;
      let newLink = oldLink;

      // 1. /notices/ID -> /parent/notices/ID or /teacher/notice/detail/ID
      if (oldLink && oldLink.startsWith('/notices/')) {
        const id = oldLink.split('/').pop();
        // recipient 역할에 따라 분화
        const userDoc = await db.collection('users').doc(data.recipientUid).get();
        if (userDoc.exists) {
            const role = userDoc.data()?.role;
            if (role === 'teacher') {
                newLink = `/teacher/notice/detail/${id}`;
            } else {
                newLink = `/parent/notices/${id}`;
            }
        } else {
             newLink = `/parent/notices/${id}`; // fallback
        }
      } 
      // 2. /observations -> /parent/observation
      else if (oldLink === '/observations') {
        newLink = '/parent/observation';
      }
      // 3. /schedule -> /parent/schedule
      else if (oldLink === '/schedule') {
        newLink = '/parent/schedule';
      }
      // 4. /students/ID -> /teacher/students/ID
      else if (oldLink && oldLink.startsWith('/students/')) {
        const id = oldLink.split('/').pop();
        newLink = `/teacher/students/${id}`;
      }
      // 5. / -> /parent or /teacher
      else if (oldLink === '/' || !oldLink) {
        const userDoc = await db.collection('users').doc(data.recipientUid).get();
        if (userDoc.exists) {
            const role = userDoc.data()?.role;
            newLink = role === 'teacher' ? '/teacher' : '/parent';
        }
      }

      if (newLink !== oldLink) {
        console.log(`Updating ${doc.id}: ${oldLink} -> ${newLink}`);
        batch.update(doc.ref, { link: newLink });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Success! Updated ${count} notifications.`);
    } else {
      console.log('No updates needed.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate().then(() => process.exit(0));
