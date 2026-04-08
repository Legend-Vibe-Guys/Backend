import express, { Router } from 'express';
import * as noticeController from '../controllers/noticeController';
import { verifyToken } from '../middlewares/auth';

const router: Router = express.Router();

router.get('/', verifyToken, noticeController.getNotices);
router.post('/', verifyToken, noticeController.createNotice);
router.put('/:id/read', verifyToken, noticeController.updateReadStatus);
router.patch('/:id', verifyToken, noticeController.updateNotice);
router.delete('/:id', verifyToken, noticeController.deleteNotice);

export default router;
