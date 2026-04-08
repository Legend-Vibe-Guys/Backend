import express, { Router } from 'express';
import { body } from 'express-validator'; // 추가
import * as authController from '../controllers/authController';
import { verifyToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validator'; // 추가

const router: Router = express.Router();

router.post(
  '/signup',
  verifyToken,
  [
    body('name').notEmpty().withMessage('이름은 필수 입력값입니다.').trim(),
    body('role').isIn(['parent', 'teacher']).withMessage('역할은 parent 또는 teacher여야 합니다.'),
    body('phone').optional().isString().trim(),
    body('studentInfo.kidsName')
      .if(body('role').equals('parent'))
      .notEmpty()
      .withMessage('학부모의 경우 아이 이름은 필수입니다.'),
  ],
  validateRequest,
  authController.signup,
);

router.post(
  '/login',
  verifyToken,
  authController.login,
);

export default router;
