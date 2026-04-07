import { Request, Response } from 'express';
import { db } from '../lib/firebase'; //

export const signup = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const { name, role, email, phone, studentInfo } = req.body;

  try {
    const batch = db.batch();

    const userRef = db.collection('users').doc(authUser.uid);
    batch.set(userRef, {
      uid: authUser.uid,
      name,
      role,
      email: email || authUser.email,
      phone,
      createdAt: new Date(),
    });

    if (role === 'parent' && studentInfo) {
      const studentRef = db.collection('students').doc();
      batch.set(studentRef, {
        name: studentInfo.name,
        birthDate: studentInfo.birthDate,
        allergy: studentInfo.allergy || [],
        parentUid: authUser.uid,
        classId: 'waiting',
        createdAt: new Date(),
      });
    }

    await batch.commit();
    res.status(200).json({ success: true, message: '회원가입 완료' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
};

export const login = async (req: Request, res: Response) => {
  const authUser = (req as any).user; // 미들웨어에서 검증된 유저 정보

  try {
    const userDoc = await db.collection('users').doc(authUser.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: '가입되지 않은 사용자입니다. 회원가입을 먼저 진행해주세요.',
      });
    }

    const userData = userDoc.data();
    res.status(200).json({
      success: true,
      message: '로그인 성공',
      user: userData,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
};
