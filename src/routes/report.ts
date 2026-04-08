import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router: Router = Router();

router.post('/generate', reportController.generateReport);
router.post('/common/generate', reportController.generateCommonReport);

export default router;
