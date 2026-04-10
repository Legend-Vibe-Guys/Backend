import { Request, Response, NextFunction } from 'express';
import * as observationService from '../services/observationService';
import { StatusCodes } from 'http-status-codes';

export const generateDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childName, memo, category } = req.body;

    if (!childName || !memo || !category) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: '아이 이름, 메모, 누리과정 영역은 필수 입력 항목입니다.'
      });
    }

    const draft = await observationService.generateObservationDraft({
      childName,
      memo,
      category
    });

    res.status(StatusCodes.OK).json(draft);
  } catch (error) {
    next(error);
  }
};

export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const observationData = req.body;
    
    if (!observationData.childId || !observationData.observationContent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: '필수 데이터(childId, 관찰 내용 등)가 부족합니다.'
      });
    }

    const id = await observationService.saveObservation(observationData);
    res.status(StatusCodes.CREATED).json({ 
      success: true, 
      id, 
      message: '관찰일지가 저장되었습니다.' 
    });
  } catch (error) {
    next(error);
  }
};

export const getObservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, category, date } = req.query;
    
    const observations = await observationService.getObservations({
      childId: childId as string,
      category: category as string,
      date: date as string
    });

    res.status(StatusCodes.OK).json({
      success: true,
      observations
    });
  } catch (error) {
    next(error);
  }
};
