import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { verifyToken } from '../middlewares/auth';
import cloudinary from '../lib/cloudinary';
import { Readable } from 'stream';

const router: Router = express.Router();

// 메모리 저장소 설정 (디스크 공간 소모 방지)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: 이미지 업로드 (Cloudinary)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: 업로드 성공 (클라우드 URL 반환)
 */
router.post('/', verifyToken, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
  }

  try {
    // Cloudinary 업로드 스트림 생성
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'vibe-guys', // 폴더 구조 설정
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: '클라우드 업로드 중 오류가 발생했습니다.' });
        }
        
        // 성공 시 보안 URL 반환
        res.status(200).json({ 
          success: true, 
          url: result?.secure_url 
        });
      }
    );

    // 파일 버퍼를 스트림으로 전송
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);

  } catch (error) {
    console.error('Upload process error:', error);
    res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.' });
  }
});

export default router;
