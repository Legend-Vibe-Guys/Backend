import { Request, Response, NextFunction } from 'express';
import * as noticeService from '../services/noticeService';
import { db } from '../lib/firebase';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /notices:
 *   get:
 *     summary: 알림장 목록 조회
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *   post:
 *     summary: 알림장 전송(저장)
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: 'string', example: 'common' }
 *               childId: { type: 'string' }
 *               title: { type: 'string' }
 *               content: { type: 'string' }
 *               date: { type: 'string' }
 *               photoUrl: { type: 'string' }
 *     responses:
 *       201:
 *         description: 생성 성공
 */
export const createNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const { type, childId, title, content, date, isRead, photoUrl } = req.body;
    
    if (!type || !title || !content || !date) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: '필수 값이 누락되었습니다.' });
    }

    const notice: noticeService.NoticeInput = {
      type,
      authorUid: authUser.uid,
      childId,
      title,
      content,
      date,
      isRead: isRead || false,
      photoUrl
    };

    const created = await noticeService.createNotice(notice);
    res.status(StatusCodes.CREATED).json({ success: true, notice: created });
  } catch (error) {
    next(error);
  }
};

export const getNotices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await db.collection('users').doc(authUser.uid).get();
    const userData = dbUser.data();
    
    let notices: any[] = [];
    if (userData?.role === 'teacher') {
      notices = await noticeService.getNoticesByAuthor(authUser.uid);
    } else if (userData?.role === 'parent') {
      // 1. 부모의 아이들 목록 가져오기
      const students = await db.collection('students').where('parentUid', '==', authUser.uid).get();
      const childIds = students.docs.map(doc => doc.id);
      
      if (childIds.length > 0) {
        // 2. 해당 아이들의 개별 알림장 + 전체 공통 알림장 가져오기
        const individualNotices = await noticeService.getNoticesByChildIds(childIds);
        const commonNotices = await noticeService.getCommonNotices();
        notices = [...individualNotices, ...commonNotices];
      } else {
        // 아이 정보가 없으면 공통 알림장만
        notices = await noticeService.getCommonNotices();
      }
    }
    res.status(StatusCodes.OK).json({ success: true, notices });
  } catch (error) {
    next(error);
  }
};
export const updateReadStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await noticeService.markAsRead(id as string);
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await noticeService.updateNotice(id as string, data);
    res.status(StatusCodes.OK).json({ success: true, message: '알림장이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await noticeService.deleteNotice(id as string);
    res.status(StatusCodes.OK).json({ success: true, message: '알림장이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};
