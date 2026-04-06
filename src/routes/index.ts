import express, { Router, Request, Response } from 'express';
import { formatUptime } from '../utils/time';
const router: Router = express.Router();

router.get('/healthy', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: formatUptime(process.uptime()),
  });
});

export default router;
