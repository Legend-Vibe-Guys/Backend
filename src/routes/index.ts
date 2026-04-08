import express, { Router, Request, Response } from 'express';
import { formatUptime } from '../utils/time';
import authRouter from './auth';
import reportRouter from './report';
import studentRouter from './student';
import noticeRouter from './notice';
import scheduleRouter from './schedule';

const router: Router = express.Router();

router.get('/healthy', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: formatUptime(process.uptime()),
  });
});

router.use('/auth', authRouter);
router.use('/report', reportRouter);
router.use('/students', studentRouter);
router.use('/notices', noticeRouter);
router.use('/schedules', scheduleRouter);

export default router;
