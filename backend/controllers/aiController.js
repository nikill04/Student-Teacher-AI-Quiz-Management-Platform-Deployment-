import Groq from "groq-sdk";
import redisClient from "../redisClient.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * ASK AI CONTROLLER
 * This is the "Ask AI Tutor" feature where students can ask questions
 * 
 * HOW IT WORKS:
 * 1. Check Redis cache first (super fast - ~10ms)
 * 2. If not cached, call Groq AI API (~2-3 seconds)
 * 3. Cache the response for 10 minutes
 * 4. Return answer to student
 * 
 * WHY CACHING?
 * - Groq API has rate limits (free tier)
 * - Same question asked multiple times = instant response from cache
 * - Saves money and improves speed
 */
export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    // Step 1: Validate input
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Step 2: Create cache key (normalized to lowercase for consistency)
    // Example: "What is AI?" and "what is ai?" both use same cache key
    const cacheKey = `ai:${question.trim().toLowerCase()}`;

    // Step 3: CHECK REDIS CACHE FIRST
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ AI CACHE HIT (returning cached answer)");
      return res.json({ 
        answer: cached, 
        cached: true  // Tell frontend this came from cache
      });
    }

    console.log("❌ AI CACHE MISS → calling Groq API");

    // Step 4: CALL GROQ AI API
    // Groq uses Llama 3.1 model - fast and free
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",  // Fast model for quick responses
      messages: [
        {
          role: "system",  // System message sets AI behavior
          content: "Explain clearly in simple words.",
        },
        {
          role: "user",  // User's actual question
          content: question,
        },
      ],
      temperature: 0.7,  // Controls creativity (0=deterministic, 1=creative)
    });

    // Step 5: Extract AI's answer from response
    const answer = completion.choices[0].message.content;

    // Step 6: SAVE TO REDIS CACHE (expires after 600 seconds = 10 minutes)
    await redisClient.set(cacheKey, answer, {
      EX: 600,  // Expire after 600 seconds
    });

    // Step 7: Send response to student
    res.json({
      answer,
      cached: false,  // This is a fresh response from AI
      provider: "groq",
    });

  } catch (error) {
    console.error("Groq AI error:", error.message);
    res.status(500).json({
      error: "Failed to get AI response. Please try again.",
    });
  }
};
