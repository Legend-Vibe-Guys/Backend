import express, { Router } from 'express';
import * as studentController from '../controllers/studentController';
import { verifyToken } from '../middlewares/auth';

const router: Router = express.Router();

router.get('/', verifyToken, studentController.getStudents);
router.put('/:id/traits', verifyToken, studentController.updateTraits);
router.patch('/:id', verifyToken, studentController.updateStudent);
router.get('/:id/memos', verifyToken, studentController.getMemos);
router.post('/:id/memos/:date', verifyToken, studentController.saveMemo);

export default router;
