import { Request, Response, NextFunction } from 'express';
import * as observationService from '../services/observationService';
import { db } from '../lib/firebase';
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
    const authUser = (req as any).user;
    const observationData = req.body;

    if (!observationData.childId || !observationData.observationContent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: '필수 데이터(childId, 관찰 내용 등)가 부족합니다.'
      });
    }

    // teacherId는 항상 인증된 사용자 uid로 덮어씀 (클라이언트 조작 방지)
    observationData.teacherId = authUser.uid;

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
    const authUser = (req as any).user;
    const { childId, category, date } = req.query;

    // 유저 정보 가져와서 역할 확인
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    const userData = userDoc.data();

    const filters: { childId?: string | string[]; category?: string; date?: string; teacherId?: string } = {
      category: category as string,
      date: date as string,
    };

    if (childId) {
      filters.childId = childId as string;
    }

    // 역할별 권한 제어
    if (userData?.role === 'parent') {
      // 1. 부모인 경우: 자신의 자녀들 ID 목록 가져오기
      const studentsSnapshot = await db.collection('students').where('parentUid', '==', authUser.uid).get();
      const myChildIds = studentsSnapshot.docs.map(doc => doc.id);

      if (myChildIds.length === 0) {
        return res.status(StatusCodes.OK).json({ success: true, observations: [] });
      }

      if (filters.childId) {
        // 특정 아이를 요청한 경우, 본인 자녀인지 확인
        const requestedChildId = filters.childId as string;
        if (!myChildIds.includes(requestedChildId)) {
          return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            error: '본인 자녀의 정보만 조회할 수 있습니다.'
          });
        }
      } else {
// 부모용: 필터가 없으면 자기 자녀들 것만 보이도록 설정
        filters.childId = myChildIds;
      }
    } else {
      // 2. 교사(또는 기타역할)인 경우:
      // (1) 본인이 작성한 기록만 보이도록 teacherId 강제 설정 (사용자 요청 사항)
      filters.teacherId = authUser.uid;

      // (2) 자신이 관리하는 원아 목록을 가져와서 필터링 (보안 강화)
      const studentsSnapshot = await db.collection('students')
        .where('teacherUid', '==', authUser.uid)
        .get();
      
      let myChildIds = studentsSnapshot.docs.map(doc => doc.id);

      // teacherUid 필드가 없는 구버전 데이터 대응 (classId 폴백)
      if (myChildIds.length === 0) {
        const classId = userData?.classId;
        if (classId) {
          const byClass = await db.collection('students').where('classId', '==', classId).get();
          myChildIds = byClass.docs.map(doc => doc.id);
        }
      }
      
      if (myChildIds.length > 0) {
        // 요청된 childId가 내 담당 원아인지 검증 (main 브랜치 로직 반영)
        if (filters.childId) {
          const requestedId = filters.childId as string;
          if (!myChildIds.includes(requestedId)) {
             return res.status(StatusCodes.FORBIDDEN).json({ 
               success: false, 
               error: '담당 원아의 기록만 조회할 수 있습니다.' 
             });
          }
        } else {
          // 전체 조회 시 담당 원아들 데이터로 범위 제한
          filters.childId = myChildIds;
        }
      }
    }

    const observations = await observationService.getObservations(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      observations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 음성 파일(STT)을 텍스트로 변환하는 컨트롤러
 * @param req Multer를 통해 전달된 file 객체와 함께 전달됨
 * @param res { text: string } 형태의 JSON 반환
 */
export const transcribeSTT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: '오디오 파일이 없습니다.' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' });
    }

    const formData = new FormData();
    // TS 에러 해결: Node.js Buffer를 브라우저 표준 Uint8Array로 감쌉니다.
    const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || 'audio/webm' });

    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ko'); // 한국어
    formData.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: formData
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('Groq API Error:', errorText);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'STT 변환 중 오류가 발생했습니다.' });
    }

    const result = (await groqRes.json()) as { text: string };

    res.status(StatusCodes.OK).json({ text: result.text });
  } catch (error) {
    console.error('STT Processing Error:', error);
    next(error);
  }
};

export const deleteObservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: '삭제할 ID가 필요합니다.' });
    }

    await observationService.deleteObservation(id as string);
    res.status(StatusCodes.OK).json({ success: true, message: '관찰일지가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const updateObservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: '수정할 ID가 필요합니다.' });
    }

    await observationService.updateObservation(id as string, updateData);
    res.status(StatusCodes.OK).json({ success: true, message: '관찰일지가 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};
