import multer from 'multer';
import pdfParse from 'pdf-parse-fork';
import { askGroq } from '../config/ai.js';

// Multer keeps the uploaded file in memory (we only need its text)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(Object.assign(new Error('Only PDF files are allowed'), { status: 400 }));
  },
});

export const uploadMiddleware = upload.single('file');

/**
 * UPLOAD PDF -> AI GENERATES QUESTIONS (preview only, nothing is saved yet)
 * POST /api/teacher/upload-and-generate   (multipart form: file, batchId)
 *
 * 1. Read the text from the PDF
 * 2. Ask the AI for 10 multiple-choice questions in JSON
 * 3. Send the questions back so the teacher can review them
 * 4. The teacher then clicks "Publish" -> POST /api/teacher/publish-quiz
 */
export const uploadAndGenerateQuiz = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    // STEP 1: Extract text from the PDF
    // (We pass a fresh copy of the bytes: the PDF library misreads small Node buffers.)
    const pdfData = await pdfParse(new Uint8Array(req.file.buffer));
    const pdfText = pdfData.text?.trim() || '';
    if (pdfText.length < 50) {
      return res.status(400).json({
        error: 'Could not read enough text from this PDF. (Scanned/image PDFs are not supported.)',
      });
    }

    // STEP 2: Ask the AI (only the first ~6000 characters, to stay within free limits)
    const prompt = `Create exactly 10 multiple-choice questions from this study material.

STUDY MATERIAL:
${pdfText.slice(0, 6000)}

Reply with JSON in exactly this format:
{
  "questions": [
    { "question": "Question text?", "options": ["A", "B", "C", "D"], "correct": 0 }
  ]
}
Rules: every question has exactly 4 options, and "correct" is the index (0-3) of the right option.`;

    const aiText = await askGroq(
      [
        { role: 'system', content: 'You are a quiz generator. Reply ONLY with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { response_format: { type: 'json_object' }, max_tokens: 6000 }
    );

    // STEP 3: Parse the JSON and keep only valid questions
    let questions = [];
    try {
      questions = JSON.parse(aiText).questions || [];
    } catch {
      console.error('AI returned invalid JSON:', aiText.slice(0, 300));
    }

    questions = questions
      .filter((q) =>
        q?.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correct) &&
        q.correct >= 0 && q.correct <= 3
      )
      .map((q) => ({ question: q.question, options: q.options.map(String), correct: q.correct }));

    if (questions.length === 0) {
      return res.status(502).json({ error: 'The AI could not create questions this time. Please try again.' });
    }

    res.json({
      quiz: { questions },
      message: `Generated ${questions.length} questions from the PDF`,
    });
  } catch (err) {
    console.error('Upload and generate error:', err.message);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to generate quiz' });
  }
};
