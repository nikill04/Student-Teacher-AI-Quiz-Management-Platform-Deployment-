import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Result from '../models/Result.js';
import Batch from '../models/Batch.js';
import { getCache, setCache, deleteCache, deleteCacheByPattern } from '../config/cache.js';

// ---------- Small helpers ----------

// Is this quiz past its deadline? (quizzes without a deadline never expire)
const isOverdue = (quiz) => Boolean(quiz.deadline) && new Date(quiz.deadline) < new Date();

// Is the student a member of this batch?
const isMember = (student, batchId) =>
  student.batches.some((id) => id.toString() === batchId.toString());

// Cache key for "quizzes of one batch for one student"
const batchQuizzesKey = (studentId, batchId) => `student:${studentId}:batch:${batchId}:quizzes`;

// Only send safe quiz info to students (never the correct answers!)
const quizSummary = (quiz) => ({
  _id: quiz._id,
  title: quiz.title,
  duration: quiz.duration,
  deadline: quiz.deadline,
  questionCount: quiz.questions.length,
});

// ==================== PROFILE ====================
// GET /api/student/profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId)
      .select('-password')
      .populate('batches', 'name');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error('Error fetching student profile:', err.message);
    res.status(500).json({ error: 'Failed to load your profile' });
  }
};

// ==================== BATCHES ====================
// GET /api/student/batches -> all batches a student can join
export const getAllBatches = async (req, res) => {
  try {
    const cached = await getCache('allBatches');
    if (cached) return res.json(cached);

    const batches = await Batch.find()
      .select('name teacher')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    await setCache('allBatches', batches, 600); // 10 minutes
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err.message);
    res.status(500).json({ error: 'Failed to load batches' });
  }
};

// POST /api/student/join-batch   body: { batchId }
export const joinBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    const studentId = req.user.userId;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const student = await User.findById(studentId);
    if (isMember(student, batch._id)) {
      return res.status(400).json({ error: 'You have already joined this batch' });
    }

    // $addToSet adds the id only if it is not already in the list
    await Batch.updateOne({ _id: batch._id }, { $addToSet: { students: student._id } });
    await User.updateOne({ _id: student._id }, { $addToSet: { batches: batch._id } });

    await deleteCache(batchQuizzesKey(studentId, batchId));

    res.json({ message: `You joined "${batch.name}"`, batch: batch.name });
  } catch (err) {
    console.error('Error joining batch:', err.message);
    res.status(500).json({ error: 'Could not join the batch' });
  }
};

// DELETE /api/student/leave-batch/:batchId
export const leaveBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.user.userId;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // $pull removes the id from the list
    await Batch.updateOne({ _id: batchId }, { $pull: { students: studentId } });
    await User.updateOne({ _id: studentId }, { $pull: { batches: batchId } });

    await deleteCache(batchQuizzesKey(studentId, batchId));

    res.json({ message: `You left "${batch.name}"` });
  } catch (err) {
    console.error('Error leaving batch:', err.message);
    res.status(500).json({ error: 'Could not leave the batch' });
  }
};

// ==================== QUIZ LISTS ====================
// GET /api/student/batch/:batchId/quizzes -> quizzes of one batch with status
export const getQuizzesByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = req.user.userId;
    const cacheKey = batchQuizzesKey(studentId, batchId);

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const student = await User.findById(studentId);
    if (!student || !isMember(student, batchId)) {
      return res.status(403).json({ error: 'You are not a member of this batch' });
    }

    const quizzes = await Quiz.find({ batch: batchId }).sort({ deadline: 1 });
    const results = await Result.find({ student: studentId, quiz: { $in: quizzes.map((q) => q._id) } });

    const quizzesWithStatus = quizzes.map((quiz) => {
      const result = results.find((r) => r.quiz.toString() === quiz._id.toString());
      let status = 'available';
      if (result) status = 'completed';
      else if (isOverdue(quiz)) status = 'overdue';

      return { ...quizSummary(quiz), status, score: result ? result.score : null };
    });

    await setCache(cacheKey, quizzesWithStatus, 300); // 5 minutes
    res.json(quizzesWithStatus);
  } catch (err) {
    console.error('Error fetching batch quizzes:', err.message);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
};

// GET /api/student/active-quizzes -> quizzes the student can still take
export const getActiveQuizzesForStudent = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student = await User.findById(studentId).populate('batches', 'name');
    if (!student || student.batches.length === 0) {
      return res.json([]); // no batches = no quizzes
    }

    const quizzes = await Quiz.find({ batch: { $in: student.batches } }).sort({ deadline: 1 });
    const results = await Result.find({ student: studentId }).select('quiz');
    const completedIds = results.map((r) => r.quiz.toString());

    const active = quizzes
      .filter((quiz) => !completedIds.includes(quiz._id.toString()) && !isOverdue(quiz))
      .map((quiz) => ({
        ...quizSummary(quiz),
        batchName: student.batches.find((b) => b._id.equals(quiz.batch))?.name || '',
      }));

    res.json(active);
  } catch (err) {
    console.error('Error fetching active quizzes:', err.message);
    res.status(500).json({ error: 'Failed to load active quizzes' });
  }
};

// ==================== TAKE A QUIZ ====================
// GET /api/student/quiz/:quizId -> questions WITHOUT correct answers
export const getStudentQuizById = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const student = await User.findById(studentId);
    if (!student || !isMember(student, quiz.batch)) {
      return res.status(403).json({ error: 'You are not a member of the batch for this quiz' });
    }

    const alreadySubmitted = await Result.exists({ quiz: quiz._id, student: studentId });
    if (alreadySubmitted) {
      return res.status(400).json({ error: 'You have already submitted this quiz', alreadySubmitted: true });
    }

    if (isOverdue(quiz)) {
      return res.status(400).json({ error: 'The deadline for this quiz has passed' });
    }

    res.json({
      _id: quiz._id,
      title: quiz.title,
      duration: quiz.duration || 30, // minutes
      questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
    });
  } catch (err) {
    console.error('Error fetching quiz:', err.message);
    res.status(500).json({ error: 'Failed to load the quiz' });
  }
};

// POST /api/student/submit   body: { quizId, timeSpent, answers: [{ questionIndex, selectedOption }] }
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, timeSpent, answers } = req.body;
    const studentId = req.user.userId;

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid quiz submission' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.questions.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or has no questions' });
    }

    const alreadySubmitted = await Result.exists({ quiz: quizId, student: studentId });
    if (alreadySubmitted) {
      return res.status(400).json({ error: 'You have already submitted this quiz' });
    }

    // Count correct answers on the SERVER (never trust a score sent by the browser)
    let correct = 0;
    answers.forEach(({ questionIndex, selectedOption }) => {
      if (quiz.questions[questionIndex]?.correctAnswer === selectedOption) correct += 1;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);

    const result = await Result.create({
      quiz: quizId,
      student: studentId,
      score,
      correctAnswers: correct,
      timeSpent: timeSpent || 'Unknown',
      answers,
    });

    // Update the quiz's average score
    const allResults = await Result.find({ quiz: quizId }).select('score');
    quiz.avgScore = Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length);
    await quiz.save();

    // This data changed, so remove old cached copies
    await deleteCache(`studentResults:${studentId}`, batchQuizzesKey(studentId, quiz.batch));
    await deleteCacheByPattern(`leaderboard:${quiz.createdBy}:*`);

    res.status(201).json({ message: 'Quiz submitted successfully', result });
  } catch (err) {
    // 11000 = duplicate key (the same quiz submitted twice at the same moment)
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already submitted this quiz' });
    }
    console.error('Quiz submission failed:', err.message);
    res.status(500).json({ error: 'Quiz submission failed' });
  }
};

// ==================== RESULTS ====================
// GET /api/student/my-results -> all results of the student
export const getAllResultsForStudent = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const cacheKey = `studentResults:${studentId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const results = await Result.find({ student: studentId })
      .populate('quiz', 'title questions')
      .sort({ completedAt: -1 });

    const formatted = results
      .filter((result) => result.quiz) // skip results of deleted quizzes
      .map((result) => ({
        quizId: result.quiz._id,
        quizTitle: result.quiz.title,
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.quiz.questions.length,
        completedAt: result.completedAt,
        timeSpent: result.timeSpent,
      }));

    await setCache(cacheKey, formatted, 600);
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching student results:', err.message);
    res.status(500).json({ error: 'Failed to load results' });
  }
};

// GET /api/student/result/:quizId -> detailed result of one quiz
export const getStudentResult = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.userId;
    const cacheKey = `studentResult:${studentId}:${quizId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const result = await Result.findOne({ quiz: quizId, student: studentId });
    if (!result) return res.status(404).json({ error: 'Result not found' });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const responseData = {
      quizTitle: quiz.title,
      score: result.score,
      correctAnswers: result.correctAnswers,
      totalQuestions: quiz.questions.length,
      completedAt: result.completedAt,
      timeSpent: result.timeSpent,
      questions: quiz.questions.map((q, index) => {
        const answer = result.answers.find((a) => a.questionIndex === index);
        const userAnswer = answer?.selectedOption ?? -1; // -1 = not answered
        return {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer,
          isCorrect: userAnswer === q.correctAnswer,
          explanation: q.explanation || '',
        };
      }),
    };

    await setCache(cacheKey, responseData, 3600); // results never change
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching result:', err.message);
    res.status(500).json({ error: 'Failed to load result' });
  }
};

// ==================== STATS ====================
// GET /api/student/stats -> average score
export const getStudentStats = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.userId }).select('score');
    const total = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = results.length > 0 ? Math.round(total / results.length) : 0;
    res.json({ averageScore });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
};

// GET /api/student/quiz-counts -> total and active quiz counts
export const getStudentQuizCounts = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const quizzes = await Quiz.find({ batch: { $in: student.batches } }).select('deadline');
    const results = await Result.find({ student: studentId }).select('quiz');
    const completedIds = results.map((r) => r.quiz.toString());

    const activeQuizzes = quizzes.filter(
      (quiz) => !completedIds.includes(quiz._id.toString()) && !isOverdue(quiz)
    ).length;

    res.json({ totalQuizzes: quizzes.length, activeQuizzes });
  } catch (err) {
    console.error('Error fetching quiz counts:', err.message);
    res.status(500).json({ error: 'Failed to load quiz counts' });
  }
};
