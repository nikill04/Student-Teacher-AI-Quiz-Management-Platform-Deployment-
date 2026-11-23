import Quiz from '../models/Quiz.js';
import Batch from '../models/Batch.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { getCache, setCache, deleteCache, deleteCacheByPattern } from '../config/cache.js';

// ==================== PROFILE ====================
// GET /api/teacher/profile
export const getTeacherProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

// ==================== DASHBOARD ====================
// GET /api/teacher/dashboard -> numbers for the cards + 5 recent quizzes
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const batches = await Batch.find({ teacher: teacherId });
    const quizzes = await Quiz.find({ createdBy: teacherId })
      .populate('batch', 'name students')
      .sort({ createdAt: -1 });
    const results = await Result.find({ quiz: { $in: quizzes.map((q) => q._id) } }).select('quiz score');

    // Unique students across all of this teacher's batches
    const studentIds = new Set(batches.flatMap((b) => b.students.map((id) => id.toString())));

    // Average of ALL submissions to this teacher's quizzes
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    const recentQuizzes = quizzes.slice(0, 5).map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      batch: quiz.batch?.name || 'N/A',
      students: quiz.batch?.students?.length || 0,
      attempts: results.filter((r) => r.quiz.equals(quiz._id)).length,
      avgScore: quiz.avgScore || 0,
    }));

    res.json({
      metrics: {
        totalQuizzes: quizzes.length,
        activeStudents: studentIds.size,
        avgScore,
        totalBatches: batches.length,
      },
      quizzes: recentQuizzes,
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};

// ==================== BATCHES ====================
// POST /api/teacher/batch/create   body: { name }
export const createBatch = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Batch name is required' });
    }

    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({ error: 'A batch with this name already exists' });
    }

    const batch = await Batch.create({ name, teacher: req.user.userId, students: [] });

    await deleteCache('allBatches'); // students should see the new batch
    res.status(201).json({ message: 'Batch created', batch });
  } catch (err) {
    console.error('Batch creation error:', err.message);
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

// GET /api/teacher/batches -> this teacher's batches with their students
export const listTeacherBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ teacher: req.user.userId })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    console.error('Fetch batches error:', err.message);
    res.status(500).json({ error: 'Failed to load batches' });
  }
};

// ==================== QUIZZES ====================
// GET /api/teacher/quizzes -> all quizzes created by this teacher
export const getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const cacheKey = `teacherQuizzes:${teacherId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json({ quizzes: cached });

    const quizzes = await Quiz.find({ createdBy: teacherId })
      .populate('batch', 'name')
      .sort({ createdAt: -1 });

    await setCache(cacheKey, quizzes, 600);
    res.json({ quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err.message);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
};

/**
 * CREATE / PUBLISH A QUIZ (used by BOTH "Create Quiz" and "Upload with AI")
 * POST /api/teacher/publish-quiz   (also /api/teacher/create-quiz)
 * body: {
 *   batchId,
 *   quiz: {
 *     title, deadline, duration, source: 'ai' | 'manual',
 *     questions: [{ question, options: ['A','B','C','D'], correct: 0 }]
 *   }
 * }
 * "correct" is the INDEX of the right option (0 = first option).
 */
export const createQuiz = async (req, res) => {
  try {
    const { batchId, quiz } = req.body;
    const teacherId = req.user.userId;

    // ---- Validate input ----
    if (!batchId || !quiz) {
      return res.status(400).json({ error: 'batchId and quiz are required' });
    }
    if (!quiz.title?.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Add at least one question' });
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const options = q.options || [];
      const correct = Number(q.correct);
      if (!q.question?.trim() || options.length < 2 || options.some((opt) => !String(opt).trim())) {
        return res.status(400).json({ error: `Question ${i + 1} needs text and all options filled in` });
      }
      if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
        return res.status(400).json({ error: `Question ${i + 1} needs a correct answer` });
      }
    }

    const batch = await Batch.findById(batchId);
    if (!batch || !batch.teacher.equals(teacherId)) {
      return res.status(403).json({ error: 'You can only add quizzes to your own batches' });
    }

    // ---- Save the quiz ----
    const newQuiz = await Quiz.create({
      title: quiz.title.trim(),
      batch: batchId,
      createdBy: teacherId,
      source: quiz.source === 'ai' ? 'ai' : 'manual',
      // An empty deadline means "no deadline"
      deadline: quiz.deadline ? new Date(quiz.deadline) : undefined,
      duration: Number(quiz.duration) || 30,
      questions: quiz.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt) => String(opt).trim()),
        correctAnswer: Number(q.correct),
        explanation: q.explanation || '',
      })),
    });

    // ---- Remove old cached lists so everyone sees the new quiz ----
    await deleteCache(`teacherQuizzes:${teacherId}`);
    await deleteCacheByPattern(`student:*:batch:${batchId}:quizzes`);
    await deleteCacheByPattern(`leaderboard:${teacherId}:*`);

    res.status(201).json({ message: 'Quiz published successfully', quiz: newQuiz });
  } catch (err) {
    console.error('Create quiz error:', err.message);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

// ==================== LEADERBOARD ====================
// GET /api/teacher/leaderboard?batchId=...&quizId=...  (both filters optional)
export const getLeaderboard = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { batchId, quizId } = req.query;
    const cacheKey = `leaderboard:${teacherId}:${batchId || 'all'}:${quizId || 'all'}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // Options for the two dropdowns (always the full lists, so filters can be changed)
    const batchOptions = await Batch.find({ teacher: teacherId }).select('name');
    const quizFilter = { createdBy: teacherId };
    if (batchId) quizFilter.batch = batchId;
    const quizOptions = await Quiz.find(quizFilter).select('title').sort({ createdAt: -1 });

    // Which quizzes to rank
    const quizIds = quizId ? [quizId] : quizOptions.map((q) => q._id);
    const results = await Result.find({ quiz: { $in: quizIds } })
      .populate('student', 'name email')
      .populate('quiz', 'title')
      .sort({ score: -1, completedAt: 1 });

    const leaderboard = results
      .filter((r) => r.student && r.quiz) // skip deleted users/quizzes
      .map((r, index) => ({
        rank: index + 1,
        name: r.student.name,
        email: r.student.email,
        quizTitle: r.quiz.title,
        score: r.score,
        submittedAt: r.completedAt,
      }));

    const responseData = {
      leaderboard,
      batchOptions,
      quizOptions: quizOptions.map((q) => ({ id: q._id, title: q.title })),
    };

    await setCache(cacheKey, responseData, 300);
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching leaderboard:', err.message);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
};
