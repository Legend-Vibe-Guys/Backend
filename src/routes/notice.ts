import express, { Router } from 'express';
import * as noticeController from '../controllers/noticeController';
import { verifyToken } from '../middlewares/auth';
import commentRouter from './comment';

const router: Router = express.Router();

router.get('/', verifyToken, noticeController.getNotices);
router.post('/', verifyToken, noticeController.createNotice);
router.put('/:id/read', verifyToken, noticeController.updateReadStatus);
router.patch('/:id', verifyToken, noticeController.updateNotice);
router.delete('/:id', verifyToken, noticeController.deleteNotice);

// 댓글 라우트 마운트
router.use('/:noticeId/comments', commentRouter);

export default router;
