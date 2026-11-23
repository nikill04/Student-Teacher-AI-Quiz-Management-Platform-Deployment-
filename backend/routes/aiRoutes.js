import express from 'express';
import { askAI } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/auth.js';

const aiRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI tutor
 */

/**
 * @swagger
 * /ai/ask-question:
 *   post:
 *     summary: Ask the AI tutor a question
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { question: "Explain Newton's laws in simple terms." }
 *     responses:
 *       200: { description: The AI answer }
 */
aiRouter.post('/ask-question', verifyToken, askAI);

export default aiRouter;
