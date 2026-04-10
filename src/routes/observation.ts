import express, { Router } from 'express';
import * as observationController from '../controllers/observationController';

const router: Router = express.Router();

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
