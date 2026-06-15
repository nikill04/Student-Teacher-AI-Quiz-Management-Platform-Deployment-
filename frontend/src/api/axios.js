/**
 * AXIOS CONFIGURATION
 * This creates a custom axios instance for all API calls
 * 
 * WHY CUSTOM INSTANCE?
 * - Sets baseURL once (no need to repeat in every request)
 * - Automatically includes cookies (withCredentials: true)
 * - Consistent configuration across all API calls
 * 
 * HOW COOKIES WORK:
 * 1. Backend sends Set-Cookie header with JWT token
 * 2. Browser stores cookie automatically
 * 3. withCredentials: true tells axios to include cookies in requests
 * 4. Browser automatically attaches cookie to every request
 * 5. Backend reads cookie via req.cookies.token
 * 
 * IMPORTANT: This only works because:
 * - Backend CORS has credentials: true
 * - Frontend axios has withCredentials: true
 * - Cookie has sameSite: 'None' (allows cross-origin)
 */

import axios from "axios";

// const instance = axios.create({
//   // Automatically prepends this to all requests
//   // Example: axios.get('/auth/login') → http://localhost:5000/api/auth/login
//   baseURL: import.meta.env.MODE==="development"
//     ?"http://localhost:5000/api"
//     :"https://quizapp-backend-frj2.onrender.com/api",
    
//   // ✅ CRITICAL: Allow cookies to be sent with requests
//   withCredentials: true,
// });

const instance = axios.create({
  // In development: uses localhost
  // In production build: uses VITE_API_URL env var set at build time
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  
  // ✅ CRITICAL: Allow cookies to be sent with requests
  withCredentials: true,
});

export default instance;
