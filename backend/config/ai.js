// config/ai.js
// One small helper to talk to the Groq AI API.
// Used by: Ask AI (students) and PDF -> Quiz generation (teachers).
//
// Get a FREE key at https://console.groq.com/keys and put it in backend/.env:
//   GROQ_API_KEY=gsk_...

import Groq from 'groq-sdk';

// Models to try, in order. Groq sometimes retires old models, so if one no
// longer exists we automatically try the next one.
// You can put your own favourite first with GROQ_MODEL in .env
// (list of models: https://console.groq.com/docs/models)
const MODELS = [process.env.GROQ_MODEL, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b']
  .filter(Boolean);

let groq = null;

// Creates an Error that also carries an HTTP status code for the response
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Send messages to the AI and return its text answer.
 * @param {Array} messages  e.g. [{ role: 'user', content: 'Hi' }]
 * @param {Object} options  extra Groq options (max_tokens, response_format, ...)
 */
export async function askGroq(messages, options = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw httpError(503, 'AI is not configured. Add GROQ_API_KEY to backend/.env');
  }

  // Create the client only once, the first time it is needed
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60 * 1000 });

  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        ...options,
      });
      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      // 404 = this model does not exist anymore -> try the next one
      if (err.status === 404) {
        console.warn(`Groq model "${model}" is not available, trying the next one...`);
        continue;
      }
      console.error('Groq API error:', err.status, err.message);
      if (err.status === 401) throw httpError(503, 'The GROQ_API_KEY is invalid. Please check backend/.env');
      if (err.status === 429) throw httpError(503, 'The AI is busy (free rate limit). Please wait a minute and try again.');
      throw httpError(502, 'The AI service failed. Please try again in a moment.');
    }
  }

  throw httpError(503, 'None of the AI models are available. Set GROQ_MODEL in backend/.env (see console.groq.com/docs/models)');
}
