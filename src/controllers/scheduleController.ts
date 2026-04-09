import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../services/scheduleService';
import * as studentService from '../services/studentService';
import { db } from '../lib/firebase';
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
    const authUser = (req as any).user;
    
    // Fetch full user data to get role
    const dbUser = await db.collection('users').doc(authUser.uid).get();
    if (!dbUser.exists) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    const userData = dbUser.data();
    let schedules = [];

    if (userData?.role === 'teacher') {
      // Teachers only see their own schedules
      schedules = await scheduleService.getSchedulesByAuthor(authUser.uid, date as string);
    } else if (userData?.role === 'parent') {
      // Parents see schedules of their child's teacher
      const students = await studentService.getStudentsByParent(authUser.uid);
      // 'teacherName' exists in students, but we need teacher UID. 
      // Assumption: schedules are stored with authorUid. 
      // We need to find teacher users by their name or better, store teacherUid in student data.
      
      const teacherNames = [...new Set(students.map((s: any) => s.teacherName).filter(Boolean))];
      
      if (teacherNames.length > 0) {
        // Find teacher UIDs by their names
        const teachersSnapshot = await db.collection('users')
          .where('role', '==', 'teacher')
          .where('name', 'in', teacherNames)
          .get();
        
        const teacherUids = teachersSnapshot.docs.map((doc: any) => doc.id);
        
        if (teacherUids.length > 0) {
          schedules = await scheduleService.getSchedulesByAuthors(teacherUids, date as string);
        }
      }
    } else {
      // Fallback or Admin
      schedules = await scheduleService.getAllSchedules(date as string);
    }

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
