import { db } from './lib/firebase';

const seed = async () => {
  const teacherUid = 'z7tWfvEkM2Sv2MPvo6mDaT537xt2';
  const parent1Uid = 'WhauzWsjDoNQeC1bE8mFBiQoW5l1';
  const parent2Uid = 'Dh3v5EW0GHhX7oVWitQXQPuLCua2';

  const batch = db.batch();

  // Users
  batch.set(db.collection('users').doc(teacherUid), {
    uid: teacherUid,
    name: '아이노트 선생님',
    role: 'teacher',
    phone: '010-1111-2222',
    className: '햇살반',
    createdAt: new Date().toISOString()
  });

  batch.set(db.collection('users').doc(parent1Uid), {
    uid: parent1Uid,
    name: '김우주 학부모',
    role: 'parent',
    phone: '010-3333-4444',
    createdAt: new Date().toISOString()
  });

  batch.set(db.collection('users').doc(parent2Uid), {
    uid: parent2Uid,
    name: '이수아 학부모',
    role: 'parent',
    phone: '010-5555-6666',
    createdAt: new Date().toISOString()
  });

  // Students
  const student1Ref = db.collection('students').doc('student_wooju');
  batch.set(student1Ref, {
    id: student1Ref.id,
    name: '김우주',
    age: 5,
    classId: 'class_sun',
    className: '햇살반',
    gender: 'male',
    parentUid: parent1Uid,
    parentName: '김우주 학부모',
    parentPhone: '010-3333-4444',
    teacherName: '아이노트 선생님',
    profileEmoji: '🐶',
    birthDate: '2020-03-15',
    allergies: ['땅콩'],
    traits: ['활발함', '창의적'],
    medicationRequest: null,
    notes: ''
  });

  const student2Ref = db.collection('students').doc('student_sua');
  batch.set(student2Ref, {
    id: student2Ref.id,
    name: '이수아',
    age: 5,
    classId: 'class_sun',
    className: '햇살반',
    gender: 'female',
    parentUid: parent2Uid,
    parentName: '이수아 학부모',
    parentPhone: '010-5555-6666',
    teacherName: '아이노트 선생님',
    profileEmoji: '🐰',
    birthDate: '2020-08-20',
    allergies: [],
    traits: ['차분함', '집중력이 좋음'],
    medicationRequest: '식후 감기약 복용',
    notes: ''
  });

  await batch.commit();
  console.log('Test accounts and students successfully seeded.');
  process.exit(0);
};

seed().catch(console.error);
