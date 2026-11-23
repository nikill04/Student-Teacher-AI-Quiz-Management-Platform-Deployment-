// middleware/auth.js
// Purpose: Check that the user is logged in (JWT) and has the right role.

import jwt from 'jsonwebtoken';

/**
 * MIDDLEWARE 1: Verify JWT Token
 * Runs on every protected route to check if the user is logged in.
 * The token comes from the "token" cookie (set at login).
 * An "Authorization: Bearer <token>" header also works (handy for Swagger/Postman).
 */
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Please login first.' });
  }

  try {
    // Throws an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Now every controller can use req.user.userId and req.user.role
    req.user = decoded;
    next();
  } catch (err) {
    const error = err.name === 'TokenExpiredError'
      ? 'Your session has expired. Please login again.'
      : 'Invalid session. Please login again.';
    return res.status(401).json({ error });
  }
};

/**
 * MIDDLEWARE 2: Check User Role
 * Example: requireRole('teacher') -> only teachers can continue.
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `Only ${role}s can do this.` });
    }
    next();
  };
};
