import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import * as studentService from '../services/studentService';
import { db } from '../lib/firebase';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: 알림장 댓글 관리
 */

/**
 * @swagger
 * /notices/{noticeId}/comments:
 *   get:
 *     summary: 특정 알림장의 댓글 목록 조회
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noticeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *   post:
 *     summary: 알림장에 댓글 작성
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noticeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "좋은 하루 되세요!"
 *     responses:
 *       201:
 *         description: 작성 성공
 */

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;
    const comments = await commentService.getCommentsByNotice(noticeId);
    res.status(StatusCodes.OK).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;
    const { content } = req.body;
    const authUser = (req as any).user;

    if (!content?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        message: '댓글 내용을 입력해주세요.' 
      });
    }

    // 작성자 정보 조회를 위해 DB에서 유저 정보 가져오기
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        message: '사용자 정보를 찾을 수 없습니다.' 
      });
    }

    let authorDisplayName = userData.name;
    if (userData.role === 'parent') {
      const children = await studentService.getStudentsByParent(authUser.uid);
      if (children.length > 0) {
        authorDisplayName = children[0].name;
      }
    } else if (userData.role === 'teacher') {
      authorDisplayName = userData.name;
    }

    const commentData: commentService.CommentInput = {
      noticeId,
      authorUid: authUser.uid,
      authorName: authorDisplayName,
      authorRole: userData.role as 'teacher' | 'parent',
      content: content.trim()
    };

    const created = await commentService.addComment(commentData);
    res.status(StatusCodes.CREATED).json({ success: true, comment: created });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /notices/{noticeId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noticeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId, commentId } = req.params;
    await commentService.deleteComment(commentId, noticeId);
    res.status(StatusCodes.OK).json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /notices/{noticeId}/comments/{commentId}:
 *   patch:
 *     summary: 댓글 수정
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noticeId
 *         required: true
 *       - in: path
 *         name: commentId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 */
export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        message: '내용을 입력해주세요.' 
      });
    }

    const updated = await commentService.updateComment(commentId, content.trim());
    res.status(StatusCodes.OK).json({ success: true, comment: updated });
  } catch (error) {
    next(error);
  }
};
