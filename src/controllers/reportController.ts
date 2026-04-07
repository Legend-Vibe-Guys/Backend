import { Request, Response } from 'express';
import * as reportService from '../services/reportService';

/**
 * @swagger
 * /report/generate:
 *   post:
 *     summary: 유치원 알림장 생성
 *     tags: [Report]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childName
 *               - mood
 *               - lunch
 *               - nap
 *               - keywords
 *             properties:
 *               childName:
 *                 type: string
 *                 example: "지훈"
 *               mood:
 *                 type: string
 *                 example: "매우 좋음"
 *               lunch:
 *                 type: string
 *                 example: "조금 남김"
 *               nap:
 *                 type: string
 *                 example: "1시간"
 *               keywords:
 *                 type: string
 *                 example: "색종이 접기, 개구리 만들기, 친구에게 양보함"
 *               specialNote:
 *                 type: string
 *                 example: "기침 조금 함"
 *     responses:
 *       200:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: string
 *       500:
 *         description: 서버 오류
 */
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: reportService.ReportInput = req.body;

    if (!input.childName || !input.mood || !input.lunch || !input.nap || !input.keywords) {
      res.status(400).json({ 
        success: false, 
        message: '필수 입력 정보가 누락되었습니다.' 
      });
      return;
    }

    const report = await reportService.generateDailyReport(input);

    res.status(200).json({
      success: true,
      report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
