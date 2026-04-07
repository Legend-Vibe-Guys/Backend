import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router: Router = Router();

router.post('/generate', reportController.generateReport);

export default router;
