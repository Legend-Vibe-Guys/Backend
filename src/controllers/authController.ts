import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase';
import { StatusCodes } from 'http-status-codes';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const authUser = (req as any).user;
  const { name, role, phone, studentInfo } = req.body;

  try {
    const existingUser = await db.collection('users').doc(authUser.uid).get();
    if (existingUser.exists) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '이미 가입된 사용자입니다.',
      });
    }

    const batch = db.batch();

    const userRef = db.collection('users').doc(authUser.uid);
    batch.set(userRef, {
      uid: authUser.uid,
      name,
      role,
      phone: phone,
      createdAt: new Date(),
    });

    if (role === 'parent' && studentInfo) {
      const studentRef = db.collection('students').doc();
      batch.set(studentRef, {
        kidsName: studentInfo.kidsName,
        birthDate: studentInfo.birthDate,
        teacherName: studentInfo.teacherName,
        parentUid: authUser.uid,
        createdAt: new Date(),
      });
    }

    await batch.commit();
    res.status(StatusCodes.CREATED).json({ success: true, message: '회원가입 완료' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const authUser = (req as any).user;

  try {
    const userDoc = await db.collection('users').doc(authUser.uid).get();

    if (!userDoc.exists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `가입되지 않은 사용자입니다 (UID: ${authUser.uid}). 회원가입을 먼저 진행해주세요.`,
      });
    }

    const userData = userDoc.data();
    const responseUser: any = { ...userData };

    if (userData?.role === 'teacher') {
      const studentsSnapshot = await db
        .collection('students')
        .where('teacherName', '==', userData?.name)
        .get();

      responseUser.kids = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '로그인 성공',
      user: responseUser,
    });
  } catch (error) {
    next(error);
  }
};
