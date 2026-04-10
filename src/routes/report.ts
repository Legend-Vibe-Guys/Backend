import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { verifyToken } from '../middlewares/auth';

const router: Router = Router();

router.post('/generate', reportController.generateReport);
router.post('/common/generate', reportController.generateCommonReport);

// Monthly Report CRUD
router.post('/monthly', verifyToken, reportController.saveMonthlyReport);
router.get('/monthly', verifyToken, reportController.getMonthlyReports);
router.delete('/monthly/:id', verifyToken, reportController.deleteMonthlyReport);

export default router;
