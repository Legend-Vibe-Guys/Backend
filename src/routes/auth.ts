import express, { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middlewares/auth';

const router: Router = express.Router();

router.post('/signup', verifyToken, authController.signup);
router.post('/login', verifyToken, authController.login);

export default router;
