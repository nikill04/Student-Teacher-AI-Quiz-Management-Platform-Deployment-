import express from 'express';
import {
  getStudentProfile,
  getAllBatches,
  joinBatch,
  leaveBatch,
  getQuizzesByBatch,
  getActiveQuizzesForStudent,
  getStudentQuizById,
  submitQuiz,
  getAllResultsForStudent,
  getStudentResult,
  getStudentStats,
  getStudentQuizCounts,
} from '../controllers/studentController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const studentRouter = express.Router();

// Every route below needs a logged-in STUDENT
studentRouter.use(verifyToken, requireRole('student'));

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Endpoints for students (login as a student first)
 */

/**
 * @swagger
 * /student/profile:
 *   get:
 *     summary: Student profile with joined batches
 *     tags: [Student]
 *     responses:
 *       200: { description: Profile }
 */
studentRouter.get('/profile', getStudentProfile);

/**
 * @swagger
 * /student/batches:
 *   get:
 *     summary: All batches a student can join
 *     tags: [Student]
 *     responses:
 *       200: { description: List of batches }
 */
studentRouter.get('/batches', getAllBatches);

/**
 * @swagger
 * /student/join-batch:
 *   post:
 *     summary: Join a batch
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { batchId: "64f2e8d67f23b67c23a8c1a2" }
 *     responses:
 *       200: { description: Joined }
 */
studentRouter.post('/join-batch', joinBatch);

/**
 * @swagger
 * /student/leave-batch/{batchId}:
 *   delete:
 *     summary: Leave a batch
 *     tags: [Student]
 *     parameters:
 *       - { in: path, name: batchId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Left the batch }
 */
studentRouter.delete('/leave-batch/:batchId', leaveBatch);

/**
 * @swagger
 * /student/batch/{batchId}/quizzes:
 *   get:
 *     summary: Quizzes of one batch with status (available / completed / overdue)
 *     tags: [Student]
 *     parameters:
 *       - { in: path, name: batchId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: List of quizzes }
 */
studentRouter.get('/batch/:batchId/quizzes', getQuizzesByBatch);

/**
 * @swagger
 * /student/active-quizzes:
 *   get:
 *     summary: Quizzes the student can still take
 *     tags: [Student]
 *     responses:
 *       200: { description: List of active quizzes }
 */
studentRouter.get('/active-quizzes', getActiveQuizzesForStudent);

/**
 * @swagger
 * /student/quiz/{quizId}:
 *   get:
 *     summary: Get quiz questions to take the quiz (without answers)
 *     tags: [Student]
 *     parameters:
 *       - { in: path, name: quizId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Quiz questions }
 */
studentRouter.get('/quiz/:quizId', getStudentQuizById);

/**
 * @swagger
 * /student/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             quizId: "64bbcc223344"
 *             timeSpent: "3m 20s"
 *             answers: [{ questionIndex: 0, selectedOption: 2 }]
 *     responses:
 *       201: { description: Submitted }
 */
studentRouter.post('/submit', submitQuiz);

/**
 * @swagger
 * /student/my-results:
 *   get:
 *     summary: All results of the student
 *     tags: [Student]
 *     responses:
 *       200: { description: List of results }
 */
studentRouter.get('/my-results', getAllResultsForStudent);

/**
 * @swagger
 * /student/result/{quizId}:
 *   get:
 *     summary: Detailed result of one quiz
 *     tags: [Student]
 *     parameters:
 *       - { in: path, name: quizId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Result with question breakdown }
 */
studentRouter.get('/result/:quizId', getStudentResult);

/**
 * @swagger
 * /student/stats:
 *   get:
 *     summary: Average score of the student
 *     tags: [Student]
 *     responses:
 *       200: { description: Stats }
 */
studentRouter.get('/stats', getStudentStats);

/**
 * @swagger
 * /student/quiz-counts:
 *   get:
 *     summary: Total and active quiz counts
 *     tags: [Student]
 *     responses:
 *       200: { description: Counts }
 */
studentRouter.get('/quiz-counts', getStudentQuizCounts);

export default studentRouter;
