import express from 'express';
import {
  getTeacherProfile,
  getTeacherDashboard,
  createBatch,
  listTeacherBatches,
  getTeacherQuizzes,
  createQuiz,
  getLeaderboard,
} from '../controllers/teacherController.js';
import { uploadMiddleware, uploadAndGenerateQuiz } from '../controllers/uploadAndGenerateQuiz.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const teacherRouter = express.Router();

// Every route below needs a logged-in TEACHER
teacherRouter.use(verifyToken, requireRole('teacher'));

/**
 * @swagger
 * tags:
 *   name: Teacher
 *   description: Endpoints for teachers (login as a teacher first)
 */

/**
 * @swagger
 * /teacher/profile:
 *   get:
 *     summary: Teacher profile
 *     tags: [Teacher]
 *     responses:
 *       200: { description: Profile }
 */
teacherRouter.get('/profile', getTeacherProfile);

/**
 * @swagger
 * /teacher/dashboard:
 *   get:
 *     summary: Dashboard numbers and recent quizzes
 *     tags: [Teacher]
 *     responses:
 *       200: { description: Dashboard data }
 */
teacherRouter.get('/dashboard', getTeacherDashboard);

/**
 * @swagger
 * /teacher/batch/create:
 *   post:
 *     summary: Create a batch
 *     tags: [Teacher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { name: "CS-A 2025" }
 *     responses:
 *       201: { description: Batch created }
 */
teacherRouter.post('/batch/create', createBatch);
teacherRouter.post('/create-batch', createBatch); // same as above (old URL)

/**
 * @swagger
 * /teacher/batches:
 *   get:
 *     summary: This teacher's batches (with students)
 *     tags: [Teacher]
 *     responses:
 *       200: { description: List of batches }
 */
teacherRouter.get('/batches', listTeacherBatches);

/**
 * @swagger
 * /teacher/quizzes:
 *   get:
 *     summary: All quizzes created by this teacher
 *     tags: [Teacher]
 *     responses:
 *       200: { description: List of quizzes }
 */
teacherRouter.get('/quizzes', getTeacherQuizzes);

/**
 * @swagger
 * /teacher/publish-quiz:
 *   post:
 *     summary: Create / publish a quiz (manual or AI generated)
 *     tags: [Teacher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             batchId: "64aabb112233"
 *             quiz:
 *               title: "Math Quiz 1"
 *               deadline: "2030-01-01T10:00"
 *               duration: 30
 *               source: "manual"
 *               questions: [{ question: "2 + 2 = ?", options: ["3", "4", "5", "6"], correct: 1 }]
 *     responses:
 *       201: { description: Quiz created }
 */
teacherRouter.post('/publish-quiz', createQuiz);
teacherRouter.post('/create-quiz', createQuiz); // same as above (old URL)

/**
 * @swagger
 * /teacher/upload-and-generate:
 *   post:
 *     summary: Upload a PDF and let AI generate questions (preview, not saved)
 *     tags: [Teacher]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Generated questions }
 */
teacherRouter.post('/upload-and-generate', uploadMiddleware, uploadAndGenerateQuiz);

/**
 * @swagger
 * /teacher/leaderboard:
 *   get:
 *     summary: Leaderboard (optional filters batchId and quizId)
 *     tags: [Teacher]
 *     parameters:
 *       - { in: query, name: batchId, schema: { type: string } }
 *       - { in: query, name: quizId, schema: { type: string } }
 *     responses:
 *       200: { description: Leaderboard rows and filter options }
 */
teacherRouter.get('/leaderboard', getLeaderboard);

export default teacherRouter;
