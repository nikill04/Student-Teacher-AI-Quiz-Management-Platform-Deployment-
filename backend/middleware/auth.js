// backend/middleware/auth.js
// Purpose: Verify JWT tokens and check user roles for protected routes

import jwt from 'jsonwebtoken';

/**
 * MIDDLEWARE 1: Verify JWT Token
 * This runs on every protected route to check if user is logged in
 */
export const verifyToken = (req, res, next) => {
  // Step 1: Get token from cookies (browser automatically sends this)
  const token = req.cookies?.token;

  // Step 2: Check if token exists
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required. Please login first.' 
    });
  }

  try {
    // Step 3: Verify token using secret key
    // This checks if token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 4: Attach user info to request object
    // Now all controllers can access req.user and req.userId
    req.user = decoded; 
    req.userId = decoded.userId || decoded._id || decoded.id;
    
    // Step 5: Continue to next middleware or controller
    next();
    
  } catch (err) {
    // Token is invalid or expired
    let errorMessage = 'Invalid or expired token. Please login again.';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Your session has expired. Please login again.';
    }
    
    return res.status(403).json({ error: errorMessage });
  }
};

/**
 * MIDDLEWARE 2: Check User Role
 * This ensures only users with the correct role can access certain routes
 * Example: Only teachers can create quizzes
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    // Check if user exists and has the required role
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ 
        error: `Access denied. This action requires ${role} role.` 
      });
    }
    // User has correct role, continue
    next();
  };
};





/* 
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ===== MIDDLEWARE 1: Verify JWT Token =====
export const protect = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.token;
    
    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // 3. Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If token is valid, decoded = { id: "userId", role: "student", iat: timestamp }
    // If invalid, jwt.verify() throws error → caught by catch block

    // 4. Find user from decoded ID
    const user = await User.findById(decoded.id).select('-password');
    // .select('-password') excludes password field from result
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 5. Attach user to request object
    req.user = user;
    // Now all subsequent middleware/controllers can access req.user

    // 6. Continue to next middleware/controller
    next();
    
  } catch (error) {
    // Token verification failed (expired, invalid signature, etc.)
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

// ===== MIDDLEWARE 2: Check User Role =====
export const authorize = (...roles) => {
  // This is a middleware factory - it returns a middleware function
  // Usage: authorize('teacher') or authorize('student', 'teacher')
  
  return (req, res, next) => {
    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

// ===== USAGE IN ROUTES =====
// router.post('/create-batch', protect, authorize('teacher'), createBatch);
//
// Flow:
// 1. protect: Verifies token, sets req.user
// 2. authorize('teacher'): Checks if req.user.role === 'teacher'
// 3. createBatch: Controller executes if both checks pass             */