import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Note the `.js` extension is required
import dotenv from 'dotenv';

dotenv.config();

/**
 * LOGIN CONTROLLER
 * Flow: Validate credentials → Create JWT → Store in cookie → Send response
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Step 1: Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Step 2: Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Login failed: User not found for email:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Step 3: Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Login failed: Wrong password for email:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Step 4: Create JWT token
    // Token contains userId and role - this is what gets sent with every request
    const token = jwt.sign(
      { userId: user._id, role: user.role },  // Payload: Data stored in token
      process.env.JWT_SECRET,                  // Secret key to sign the token
      { expiresIn: '1d' }                      // Token expires in 24 hours
    );

    // Step 5: Store token in HTTP-only cookie
    // HTTP-only = JavaScript cannot access it (prevents XSS attacks)
    // Secure = Only sent over HTTPS
    // SameSite = Controls cross-site cookie behavior
   res.cookie('token', token, {
    httpOnly: true,      // ✅ Prevents JavaScript from accessing cookie
    secure: true,        // ✅ Only sent over HTTPS (set to false for local development)
    sameSite: 'None',    // ✅ Allows cross-origin requests (frontend ≠ backend domain)
    maxAge: 24 * 60 * 60 * 1000,  // Cookie expires in 24 hours
  });

    // Step 6: Send success response with user data
    console.log(`User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        token: token, // Also sending token in response (optional)
      }
    });
  } catch (err) {
    console.log("Login error:", err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * REGISTER CONTROLLER
 * Flow: Validate input → Hash password → Save to database → Send response
 */
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Step 1: Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'All fields are required: name, email, password, role' 
      });
    }

    // Step 2: Validate email format (simple check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Step 3: Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Step 4: Validate role
    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ 
        error: 'Role must be either "student" or "teacher"' 
      });
    }

    // Step 5: Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered. Please login instead.' 
      });
    }

    // Step 6: Hash password (never store plain passwords!)
    // Salt rounds = 10 means password is hashed 2^10 = 1024 times
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Step 7: Create user in database
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role 
    });

    console.log(`User registered: ${email} as ${role}`);

    // Step 8: Send success response (NOT logging in automatically)
    res.status(201).json({
      message: 'User registered successfully. Please login.',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("Registration error:", err.message);
    
    // Handle duplicate email error from MongoDB
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: 'Email already registered. Please login instead.' 
      });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};


/**
 * LOGOUT CONTROLLER
 * Simply clears the token cookie - browser will no longer send it
 */
export const logout = (req, res) => {
  res.clearCookie('token');
  console.log("User logged out.");
  res.json({ message: 'Logged out successfully' });
};