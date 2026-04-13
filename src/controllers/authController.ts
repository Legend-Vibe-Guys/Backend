import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase';
import { StatusCodes } from 'http-status-codes';
import { createNotification } from '../services/notificationService';

/**
 * @swagger
 * /auth/teachers:
 *   get:
 *     summary: 등록된 모든 선생님 목록 조회
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 목록 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 teachers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid: { type: 'string' }
 *                       name: { type: 'string' }
 *                       className: { type: 'string' }
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role]
 *             properties:
 *               name: { type: 'string' }
 *               role: { type: 'string', enum: [teacher, parent] }
 *               phone: { type: 'string' }
 *               className: { type: 'string', description: '선생님인 경우 반 이름' }
 *               studentInfo:
 *                 type: object
 *                 properties:
 *                   kidsName: { type: 'string' }
 *                   birthDate: { type: 'string' }
 *                   teacherName: { type: 'string' }
 *     responses:
 *       201:
 *         description: 가입 성공
 * /auth/login:
 *   post:
 *     summary: 로그인 및 사용자 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const authUser = (req as any).user;
  const { name, role, phone, studentInfo, className } = req.body;

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
    const userData: any = {
      uid: authUser.uid,
      name,
      role,
      phone: phone,
      createdAt: new Date(),
    };

    if (role === 'teacher' && className) {
      userData.className = className;
    }

    batch.set(userRef, userData);

    if (role === 'parent' && studentInfo) {
      const studentRef = db.collection('students').doc();
      batch.set(studentRef, {
        kidsName: studentInfo.kidsName,
        birthDate: studentInfo.birthDate,
        teacherName: studentInfo.teacherName,
        teacherUid: studentInfo.teacherUid || '', // UID 저장
        parentUid: authUser.uid,
        createdAt: new Date(),
        className: '', // 초기화
      });
    }

    await batch.commit();
    res.status(StatusCodes.CREATED).json({ success: true, message: '회원가입 완료' });
  } catch (error) {
    next(error);
  }
};

export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'teacher').get();
    const teachers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name,
        className: data.className || ''
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      teachers
    });
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

/**
 * 교사 프로필 업데이트 (주로 반 이름 설정)
 * PATCH /auth/profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  const authUser = (req as any).user;
  const { className } = req.body;

  try {
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    if (!userDoc.exists) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'teacher') {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: '교사만 이 기능을 사용할 수 있습니다.' });
    }

    // 1. 교사 doc 업데이트
    await db.collection('users').doc(authUser.uid).update({ className: className || '' });

    // 2. 해당 교사 이름으로 등록된 학생들의 className도 일괄 업데이트
    if (userData?.name) {
      const studentsSnapshot = await db
        .collection('students')
        .where('teacherName', '==', userData.name)
        .get();

      if (!studentsSnapshot.empty) {
        const batch = db.batch();
        const parentUids = new Set<string>();

        studentsSnapshot.docs.forEach(doc => {
          const sData = doc.data();
          if (sData.parentUid) parentUids.add(sData.parentUid);

          batch.update(doc.ref, { 
            className: className || '',
            teacherUid: authUser.uid // UID 주입 (데이터 보정)
          });
        });
        await batch.commit();

        // --- 알림 로직 시작 ---
        try {
          for (const parentUid of parentUids) {
            await createNotification({
              recipientUid: parentUid,
              title: '우리반 이름이 변경되었습니다',
              content: `새로운 반 이름: "${className || '이름 없음'}"`,
              type: 'class_update',
              link: '/parent',
              senderName: userData?.name || '선생님',
            });
          }
        } catch (notifError) {
          console.error('Notification trigger error in updateProfile:', notifError);
        }
        // --- 알림 로직 끝 ---
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      className: className || '',
    });
  } catch (error) {
    next(error);
  }
};
