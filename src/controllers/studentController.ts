import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/studentService';
import { db } from '../lib/firebase';
import { StatusCodes } from 'http-status-codes';
import { createNotification } from '../services/notificationService';

/**
 * @swagger
 * /students:
 *   get:
 *     summary: 내 원아 목록 조회
 *     description: 로그인된 유저의 역할에 따라 (teacher/parent) 연관된 학생들의 목록을 반환합니다.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 학생 목록 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 * /students/{id}/memos:
 *   get:
 *     summary: 원아 개별 메모(특이사항) 조회
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 * /students/{id}/traits:
 *   patch:
 *     summary: 원아 특징(키워드) 수정
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               traits:
 *                 type: array
 *                 items: { type: 'string' }
 *     responses:
 *       200:
 *         description: 수정 성공
 * /students/{id}/memos/{date}:
 *   post:
 *     summary: 원아 일일 요약 메모 저장
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: 'string' }
 *     responses:
 *       200:
 *         description: 저장 성공
 * /students/{id}:
 *   patch:
 *     summary: 원아 기본 정보 수정
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               profileImageUrl: { type: 'string' }
 *               profileEmoji: { type: 'string' }
 *               className: { type: 'string' }
 *               allergies: { type: 'array', items: { type: 'string' } }
 *               medicationRequest: { type: 'string' }
 *     responses:
 *       200:
 *         description: 수정 성공
 */
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await db.collection('users').doc(authUser.uid).get();
    
    if (!dbUser.exists) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const userData = dbUser.data();
    let students: any[] = [];

    if (userData?.role === 'teacher') {
      students = await studentService.getStudentsByTeacher(userData.name);
    } else if (userData?.role === 'parent') {
      students = await studentService.getStudentsByParent(authUser.uid);
    }

    res.status(StatusCodes.OK).json({ success: true, students });
  } catch (error) {
    next(error);
  }
};
export const getMemos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const memos = await studentService.getMemosByChild(id);
    res.status(StatusCodes.OK).json({ success: true, memos });
  } catch (error) {
    next(error);
  }
};

export const updateTraits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { traits } = req.body;
    
    if (!Array.isArray(traits)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Traits must be an array' });
    }
    
    await studentService.updateStudentTraits(id, traits);
    res.status(StatusCodes.OK).json({ success: true, message: 'Traits updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const saveMemo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const date = req.params.date as string;
    const { content } = req.body;
    if (!content && content !== '') {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Content is required' });
    }
    
    await studentService.saveMemo(id, date, content);
    res.status(StatusCodes.OK).json({ success: true, message: 'Memo saved successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { allergies, medicationRequest, name, profileImageUrl, profileEmoji, className } = req.body;
    
    const updateData: any = {};
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medicationRequest !== undefined) updateData.medicationRequest = medicationRequest;
    if (name !== undefined) {
      updateData.name = name;
      updateData.kidsName = name; // 레거시 필드 동기화
    }
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (profileEmoji !== undefined) updateData.profileEmoji = profileEmoji;
    if (className !== undefined) updateData.className = className;

    await studentService.updateStudent(id, updateData);

    // --- 알림 로직 시작 ---
    try {
      const authUser = (req as any).user;
      const userDoc = await db.collection('users').doc(authUser.uid).get();
      const userData = userDoc.data();

      if (userData?.role === 'parent' && (allergies !== undefined || medicationRequest !== undefined)) {
        const studentDoc = await db.collection('students').doc(id).get();
        const studentData = studentDoc.data();
        const teacherUid = studentData?.teacherUid;

        if (teacherUid) {
          await createNotification({
            recipientUid: teacherUid,
            title: '유아 건강 정보가 업데이트되었습니다',
            content: `${studentData?.kidsName || '아이'}의 건강 정보(알레르기/투약)가 수정되었습니다.`,
            type: 'health_update',
            link: `/teacher/students/${id}`,
            senderName: userData.name || '학부모',
          });
        }
      }
    } catch (notifError) {
      console.error('Notification trigger error in updateStudent:', notifError);
    }
    // --- 알림 로직 끝 ---

    res.status(StatusCodes.OK).json({ success: true, message: '원아 정보가 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

