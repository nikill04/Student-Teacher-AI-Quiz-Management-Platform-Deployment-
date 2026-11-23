import { askGroq } from '../config/ai.js';
import { getCache, setCache } from '../config/cache.js';

/**
 * ASK AI (students' "AI Tutor")
 * 1. Check the cache (same question asked recently? answer instantly)
 * 2. Otherwise ask the Groq AI
 * 3. Save the answer in the cache for 10 minutes
 */
export const askAI = async (req, res) => {
  try {
    const question = req.body.question?.trim();
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // "What is AI?" and "what is ai?" share the same cache key
    const cacheKey = `ai:${question.toLowerCase()}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ answer: cached, cached: true });
    }

    const answer = await askGroq([
      {
        role: 'system',
        content: 'You are a friendly tutor for students. Explain clearly in simple words with a short example. Keep answers short. Reply in plain text only: no markdown, no tables, no ** or #. Use simple "- " bullet lines if needed.',
      },
      { role: 'user', content: question },
    ]);

    await setCache(cacheKey, answer, 600);
    res.json({ answer, cached: false });
  } catch (error) {
    console.error('Ask AI error:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Failed to get AI response.' });
  }
};
