/**
 * AXIOS SETUP
 * One axios instance for every API call in the app.
 *
 * - baseURL: the backend address (set VITE_API_URL in frontend/.env for production)
 * - withCredentials: true -> the browser sends the login cookie with every request
 * - the login token is ALSO kept in localStorage and sent in the "Authorization" header,
 *   because some browsers (Safari, iPhone, Brave, Incognito) block the cookie when the
 *   frontend and backend are on different websites.
 */
import axios from 'axios';

// Backend address:
// 1. VITE_API_URL if it is set (frontend/.env or Render "Environment")
// 2. otherwise: the deployed backend for production builds, localhost for "npm run dev"
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://student-teacher-ai-quiz-management.onrender.com/api'
    : 'http://localhost:5001/api');

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Save / remove the login token (wrapped in try/catch: storage can be blocked in some browsers)
export const saveToken = (token) => {
  try { localStorage.setItem('quizai_token', token); } catch { /* ignore */ }
};
export const clearToken = () => {
  try { localStorage.removeItem('quizai_token'); } catch { /* ignore */ }
};

// Send the saved token with every request
instance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('quizai_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* ignore */ }
  return config;
});

// If the login session expired (401), go back to the login page.
// (Skip /auth/ calls: a wrong password on the login page also returns 401.)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall && window.location.pathname !== '/login') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Turns any API error into a message we can show to the user.
 * Usage: catch (err) { setError(getErrorMessage(err)) }
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err.response) {
    return 'Cannot reach the server. Is the backend running?';
  }
  return err.response.data?.error || err.response.data?.message || fallback;
}

export default instance;
