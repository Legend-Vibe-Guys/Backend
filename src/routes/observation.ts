import express, { Router } from 'express';
import * as observationController from '../controllers/observationController';
import multer from 'multer';

const router: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /observations/stt:
 *   post:
 *     summary: 음성 파일을 텍스트로 변환 (Groq Whisper)
 *     description: 브라우저에서 녹음된 오디오 파일(Blob)을 받아 Groq의 Whisper-large-v3 모델을 통해 한국어 텍스트로 변환합니다.
 *     tags: [Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 녹음된 오디오 파일 (audio/webm 등)
 *     responses:
 *       200:
 *         description: 변환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: 변환된 텍스트 내용
 *                   example: "아이가 친구에게 장난감을 양보하며 즐겁게 놀았습니다."
 *       400:
 *         description: 파일 없음 또는 요청 오류
 *       500:
 *         description: STT 변환 실패 또는 API 키 설정 오류
 */
router.post('/stt', upload.single('file'), observationController.transcribeSTT);

/**
 * @swagger
 * /observations/generate-draft:
 *   post:
 *     summary: 관찰일지 AI 초안 생성
 *     tags: [Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               childName:
 *                 type: string
 *               memo:
 *                 type: string
 *               category:
 *                 type: string
 */
router.post('/generate-draft', observationController.generateDraft);

/**
 * @swagger
 * /observations:
 *   post:
 *     summary: 관찰일지 저장
 *     tags: [Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               childId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               childName:
 *                 type: string
 *               memo:
 *                 type: string
 *               category:
 *                 type: string
 *               observationContent:
 *                 type: string
 *               observationEvaluation:
 *                 type: string
 *               date:
 *                 type: string
 *                 example: "2026-04-09"
 *     responses:
 *       201:
 *         description: 저장 성공
 */
router.post('/', observationController.createObservation);

/**
 * @swagger
 * /observations:
 *   get:
 *     summary: 관찰일지 목록 조회 (필터링 가능)
 *     tags: [Observations]
 *     parameters:
 *       - in: query
 *         name: childId
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 */
router.get('/', observationController.getObservations);

export default router;
