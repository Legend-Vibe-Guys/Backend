import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../services/scheduleService';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: 일정 목록 조회
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: 필터링할 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 조회 성공
 *   post:
 *     summary: 일정 생성
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, startTime, endTime, date]
 *             properties:
 *               title: { type: 'string' }
 *               startTime: { type: 'string' }
 *               endTime: { type: 'string' }
 *               date: { type: 'string' }
 *               description: { type: 'string' }
 *               color: { type: 'string' }
 *               isCompleted: { type: 'boolean' }
 *     responses:
 *       201:
 *         description: 생성 성공
 * /schedules/{id}:
 *   patch:
 *     summary: 일정 수정
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 일정의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: 'string' }
 *               startTime: { type: 'string' }
 *               endTime: { type: 'string' }
 *               date: { type: 'string' }
 *               description: { type: 'string' }
 *               color: { type: 'string' }
 *               isCompleted: { type: 'boolean' }
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     summary: 일정 삭제
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 일정의 고유 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    // For now, allow all authenticated users to see all schedules (Center/School-wide)
    const schedules = await scheduleService.getAllSchedules(date as string);
    res.status(StatusCodes.OK).json({ success: true, schedules });
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const data = req.body;
    
    const scheduleData: scheduleService.ScheduleInput = {
      ...data,
      authorUid: authUser.uid,
      isCompleted: data.isCompleted || false,
    };

    const created = await scheduleService.createSchedule(scheduleData);
    res.status(StatusCodes.CREATED).json({ success: true, schedule: created });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await scheduleService.updateSchedule(id as string, data);
    res.status(StatusCodes.OK).json({ success: true, message: '일정이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id as string);
    res.status(StatusCodes.OK).json({ success: true, message: '일정이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};
