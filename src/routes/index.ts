import express from 'express';
import { formatUptime } from '../utils/time';

const router = express.Router();

router.get('/healthy', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: formatUptime(process.uptime()),
  });
});

export default router;
