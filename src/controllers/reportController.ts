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
 *               - commonActivities
 *               - length
 *             properties:
 *               childName:
 *                 type: string
 *                 example: "지훈"
 *               commonActivities:
 *                 type: string
 *                 example: "오전에 놀이터에서 모래놀이를 하고 오후에는 그림책 읽기를 했어요."
 *               specialNote:
 *                 type: string
 *                 example: "점심시간에 밥을 남김없이 다 먹었어요."
 *               length:
 *                 type: string
 *                 enum: ['short', 'long']
 *                 example: "short"
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

    if (!input.childName || !input.commonActivities || !input.length) {
      res.status(400).json({ 
        success: false, 
        message: '필수 입력 정보가 누락되었습니다.' 
      });
      return;
    }

    if (input.length !== 'short' && input.length !== 'long') {
      res.status(400).json({ 
        success: false, 
        message: 'length 속성은 "short" 또는 "long"이어야 합니다.' 
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

/**
 * @swagger
 * /report/common/generate:
 *   post:
 *     summary: 공통 알림장 생성
 *     tags: [Report]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "내일은 외부 체험학습이 있는 날입니다. 물병과 모자를 꼭 챙겨주세요."
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
export const generateCommonReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: reportService.CommonReportInput = req.body;

    if (!input.content) {
      res.status(400).json({ 
        success: false, 
        message: '공통 전달 내용(content)이 누락되었습니다.' 
      });
      return;
    }

    const report = await reportService.generateCommonReport(input);

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

// --- Monthly Report Controllers ---

export const saveMonthlyReport = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const data = req.body;
    
    // 현재 접속한 교사 ID 추가
    data.teacherId = authUser.uid;

    const id = await reportService.saveMonthlyReport(data);
    res.status(200).json({
      success: true,
      id,
      message: '종합 평가가 저장되었습니다.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyReports = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { childId } = req.query;
    
    if (!childId) {
      return res.status(400).json({ success: false, message: 'childId가 필요합니다.' });
    }

    let reports = await reportService.getMonthlyReportsByChild(childId as string);

    // 부모인 경우 전송된(isSent: true) 보고서만 필터링
    // authUser.role 정보가 없으면 DB에서 유저 정보를 가져와야 함 (여기서는 auth 미들웨어에서 넣어준다고 가정)
    if (authUser.role === 'parent') {
      reports = reports.filter((r: any) => r.isSent === true);
    }

    res.status(200).json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await reportService.deleteMonthlyReport(id as string);
    res.status(200).json({ success: true, message: '종합 평가가 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
