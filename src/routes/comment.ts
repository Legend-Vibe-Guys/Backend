import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { verifyToken } from '../middlewares/auth';

const router: Router = Router({ mergeParams: true }); // 하위 라우팅에서 noticeId를 넘겨받기 위해 mergeParams 사용

router.get('/', verifyToken, commentController.getComments);
router.post('/', verifyToken, commentController.createComment);
router.patch('/:commentId', verifyToken, commentController.updateComment);
router.delete('/:commentId', verifyToken, commentController.deleteComment);

export default router;
