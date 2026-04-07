import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount: any;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else {
    serviceAccount = require('../config/firebase-service-account.json');
  }
} catch (error) {
  console.error('❌ Firebase 서비스 계정 설정 오류:', error);
}

if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('🔥 Firebase Admin SDK 초기화 완료');
  } catch (initError) {
    console.error('❌ Firebase Admin SDK 초기화 실패:', initError);
  }
}

export const db: admin.firestore.Firestore = admin.firestore();
export const messaging: admin.messaging.Messaging = admin.messaging();
