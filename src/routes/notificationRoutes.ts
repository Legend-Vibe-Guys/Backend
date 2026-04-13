import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as notificationService from '../services/notificationService';

const router: Router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 사용자의 알림 목록 조회
 *     tags: [Notifications]
 */
router.get('/', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const notifications = await notificationService.getNotifications(authUser.uid);
    res.status(StatusCodes.OK).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: 특정 알림 읽음 처리
 *     tags: [Notifications]
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id);
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: 모든 알림 읽음 처리
 *     tags: [Notifications]
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    await notificationService.markAllAsRead(authUser.uid);
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
