import express, { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';
import { verifyToken } from '../middlewares/auth';

const router: Router = express.Router();

router.get('/', verifyToken, scheduleController.getSchedules);
router.post('/', verifyToken, scheduleController.createSchedule);
router.patch('/:id', verifyToken, scheduleController.updateSchedule);
router.delete('/:id', verifyToken, scheduleController.deleteSchedule);

export default router;
