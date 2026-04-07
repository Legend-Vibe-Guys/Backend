import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { StatusCodes } from 'http-status-codes';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: '인증 토큰이 없습니다.' }); // 401 변경
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(StatusCodes.UNAUTHORIZED).json({ error: '유효하지 않은 토큰입니다.' }); // 401 변경
  }
};
