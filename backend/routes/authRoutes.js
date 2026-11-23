import express from 'express';
import { login, register, logout, checkAuth } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Register, login and logout
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { name: "Jane", email: "jane@example.com", password: "secret123", role: "student" }
 *     responses:
 *       201: { description: User registered }
 */
authRouter.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in (sets an http-only "token" cookie)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { email: "jane@example.com", password: "secret123" }
 *     responses:
 *       200: { description: Login successful }
 */
authRouter.post('/login', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out (clears the cookie)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
authRouter.post('/logout', logout);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Check if the user is logged in (returns name and role)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Not logged in }
 */
authRouter.get('/check', verifyToken, checkAuth);

export default authRouter;
