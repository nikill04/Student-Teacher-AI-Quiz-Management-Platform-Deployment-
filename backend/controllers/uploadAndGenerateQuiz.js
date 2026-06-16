import multer from 'multer';
import Quiz from '../models/Quiz.js';
import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse-fork';
import client from '../redisClient.js';

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Multer storage (keep file in memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

/**
 * UPLOAD AND GENERATE QUIZ CONTROLLER
 * This is where teachers upload PDFs and AI generates quiz questions
 * 
 * COMPLETE FLOW:
 * 1. Teacher uploads PDF file (handled by Multer middleware)
 * 2. Extract text from PDF using pdf-parse library
 * 3. Send text to Groq AI with specific prompt
 * 4. AI generates 10 multiple choice questions in JSON format
 * 5. Parse and validate the JSON response
 * 6. Return quiz preview to teacher
 * 7. Teacher can edit and then publish
 */
export const uploadAndGenerateQuiz = async (req, res) => {
  try {
    const { batchId } = req.body;
    const file = req.file;  // Multer middleware puts uploaded file here

    // STEP 1: VALIDATION
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    console.log('📄 Processing PDF:', file.originalname);

    // STEP 2: EXTRACT TEXT FROM PDF
    // file.buffer contains the binary PDF data (stored in memory by Multer)
    const pdfData = await pdfParse(file.buffer);
    const pdfText = pdfData.text;  // Extracted text content
    
    console.log('📝 Extracted text length:', pdfText.length, 'characters');

    // Validate that PDF has enough content
    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'PDF content is too short or empty. Please upload a document with substantial text.' 
      });
    }

    // STEP 3: CREATE AI PROMPT
    // We only send first 3000 characters to stay within API token limits
    // The prompt is VERY specific about the output format we need
    const prompt = `Based on the following document content, generate exactly 10 multiple-choice quiz questions.
                    DOCUMENT CONTENT:
                    ${pdfText.slice(0, 3000)}

                    REQUIREMENTS:
                    - Generate exactly 10 questions
                    - Each question must have 4 options
                    - Questions should test understanding of the content
                    - Include the correct answer

                    RESPOND ONLY WITH VALID JSON in this exact format:
                    {
                      "questions": [
                        {
                          "question": "Question text here?",
                          "options": ["Option A", "Option B", "Option C", "Option D"],
                          "correct": 0
                        }
                      ]
                    }

                    The "correct" field should be the index (0-3) of the correct option.
                    DO NOT include any markdown, explanations, or text outside the JSON.`;

    console.log('🤖 Generating quiz with AI...');
    
    // STEP 4: CALL GROQ AI API
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",  // Fast model
      messages: [
        {
          role: "system",
          content: "You are a quiz generator. Respond ONLY with valid JSON. No markdown, no explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,     // Moderate creativity
      max_tokens: 2000      // Limit response length
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('🤖 AI Response received');

    // STEP 5: PARSE JSON RESPONSE
    let quizData;
    try {
      // Sometimes AI includes markdown code blocks like ```json
      // We need to remove these before parsing
      const cleanedResponse = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      quizData = JSON.parse(cleanedResponse);
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('AI Response:', aiResponse);
      
      // FALLBACK: If AI fails, return sample questions
      // This ensures the feature doesn't completely break
      return res.status(200).json({
        quiz: {
          questions: [
            {
              question: 'Sample Question 1 (AI generation failed - Please try again)',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct: 0
            },
            {
              question: 'Sample Question 2 (AI generation failed - Please try again)',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct: 1
            },
            {
              question: 'Sample Question 3',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct: 2
            }
          ]
        },
        warning: 'AI generation failed. Showing sample questions. Please try uploading again.'
      });
    }

    // STEP 6: VALIDATE QUIZ STRUCTURE
    if (!quizData.questions || quizData.questions.length === 0) {
      return res.status(400).json({ 
        error: 'AI failed to generate valid questions. Please try again.' 
      });
    }

    console.log('✅ Generated', quizData.questions.length, 'questions');

    // STEP 7: RETURN QUIZ PREVIEW TO TEACHER
    // Teacher will see this in frontend and can edit before publishing
    res.status(200).json({ 
      quiz: quizData,
      message: `Successfully generated ${quizData.questions.length} questions from PDF`
    });

  } catch (error) {
    console.error('❌ Upload and generate error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message 
    });
  }
};

/**
 * PUBLISH QUIZ CONTROLLER
 * After teacher reviews AI-generated quiz, this saves it to database
 * 
 * IMPORTANT: Redis Cache Clearing
 * When a new quiz is published, we must clear caches so:
 * - Teachers see the new quiz in their quiz list
 * - Students in that batch see the new quiz
 */
export const publishQuiz = async (req, res) => {
  try {
    // Frontend sends: { batchId, quiz: { title, deadline, duration, questions } }
    const { batchId, quiz: quizData } = req.body;

    // STEP 1: VALIDATION
    if (!batchId || !quizData) {
      return res.status(400).json({ error: 'batchId and quiz data are required' });
    }

    if (!quizData.title || !quizData.questions || quizData.questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must have title and questions' });
    }

    // STEP 2: CREATE NEW QUIZ IN DATABASE
    // STEP 2: CREATE NEW QUIZ IN DATABASE
    const newQuiz = await Quiz.create({
      title: quizData.title,
      batch: batchId,
      createdBy: req.user.userId,  // From JWT token
      source: quizData.source || 'ai',  // 'ai' or 'manual'
      // Convert empty string to undefined so Mongoose doesn't try to cast "" to Date
      deadline: quizData.deadline ? new Date(quizData.deadline) : undefined,
      duration: quizData.duration || 30,
      questions: quizData.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,  // Index of correct answer (0-3)
        explanation: q.explanation || ''
      }))
    });

    // STEP 3: CLEAR REDIS CACHES
    // Why? Because cached data is now outdated - we have a new quiz!
    
    // Clear teacher's quiz cache
    const teacherCacheKey = `teacherQuizzes:${req.user.userId}`;
    await client.del(teacherCacheKey);
    console.log(`Redis cache cleared: ${teacherCacheKey}`);

    // Clear all student caches for this batch
    // Pattern: student:*:batch:123:quizzes
    const studentCachePattern = `student:*:batch:${batchId}:quizzes`;
    const keys = await client.keys(studentCachePattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Redis cache cleared for ${keys.length} students in batch ${batchId}`);
    }

    // STEP 4: SEND SUCCESS RESPONSE
    res.status(201).json({ 
      message: 'Quiz published successfully',
      quiz: newQuiz
    });

  } catch (err) {
    console.error('Publish quiz error:', err.message);
    res.status(500).json({ error: 'Failed to publish quiz', details: err.message });
  }
};


















// import multer from 'multer';
// import Quiz from '../models/Quiz.js';

// // Set up multer storage (optional, since we’re not saving the file)
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Middleware to export and use in the router
// export const uploadMiddleware = upload.single('file');

// // Generate hardcoded quiz
// export const uploadAndGenerateQuiz = async (req, res) => {
//   const { batchId } = req.body;

//   if (!batchId) {
//     return res.status(400).json({ error: 'Batch ID is required' });
//   }

//   const hardcodedQuiz = {
//     questions: [
//       {
//         question: 'What is the capital of India?',
//         options: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata'],
//         correct: 1
//       },
//       {
//         question: 'What is 2 * 6?',
//         options: ['10', '11', '12', '14'],
//         correct: 2
//       },
//       {
//         question: 'Which language is used for web apps?',
//         options: ['Python', 'Java', 'JavaScript', 'C++'],
//         correct: 2
//       }
//     ]
//   };

//   return res.status(200).json({ quiz: hardcodedQuiz });
// };

// // Publish to DB
// export const publishQuiz = async (req, res) => {
//   try {
//     const { quizId, batchId } = req.body;

//     if (!quizId || !batchId) {
//       return res.status(400).json({ error: 'quizId and batchId are required' });
//     }

//     // 1️⃣ Find quiz ONLY by quizId + teacher
//     const quiz = await Quiz.findOne({
//       _id: quizId,
//       createdBy: req.user.userId
//     });

//     if (!quiz) {
//       return res.status(404).json({ error: 'Quiz not found' });
//     }

//     // 2️⃣ Validate batch separately
//     if (quiz.batch.toString() !== batchId) {
//       return res.status(400).json({ error: 'Batch mismatch' });
//     }

//     // 3️⃣ Publish quiz (if you want status)
//     // quiz.isPublished = true;

//     await quiz.save();

//     res.status(200).json({ message: 'Quiz published successfully' });

//   } catch (err) {
//     console.error('Publish quiz error:', err.message);
//     res.status(500).json({ error: 'Failed to publish quiz' });
//   }
// };