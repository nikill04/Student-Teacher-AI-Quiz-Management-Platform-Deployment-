import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Cookie settings for the login token.
// - Deployed (https): frontend and backend are on different domains, so the
//   cookie must be "secure" + "sameSite: none" or the browser will not send it.
// - Local development (http://localhost): a normal cookie.
// req.secure is true when the request came over https (see "trust proxy" in index.js).
const cookieOptions = (req) => ({
  httpOnly: true, // JavaScript in the browser cannot read it
  secure: req.secure,
  sameSite: req.secure ? 'none' : 'lax',
});
const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * LOGIN
 * Flow: check email + password -> create JWT -> store it in a cookie
 */
export const login = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // The token stores the user id and role. It expires in 1 day.
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, { ...cookieOptions(req), maxAge: ONE_DAY });

    console.log(`User logged in: ${email}`);
    // The token is sent in the cookie AND in the response. Some browsers (Safari, iPhone,
    // Brave, Incognito) block cookies between two different sites, so the frontend also
    // keeps the token and sends it in the "Authorization" header (see frontend/src/api/axios.js).
    res.json({
      message: 'Login successful',
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * REGISTER
 * Flow: validate input -> hash password -> save user
 * (The user logs in afterwards on the login page.)
 */
export const register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const { password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required: name, email, password, role' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ error: 'Role must be either "student" or "teacher"' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered. Please login instead.' });
    }

    // Never store plain passwords! 10 = how strong the hashing is
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    console.log(`User registered: ${email} as ${role}`);
    res.status(201).json({
      message: 'Account created. Please login.',
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * LOGOUT
 * Clears the token cookie (must use the same options it was created with).
 */
export const logout = (req, res) => {
  res.clearCookie('token', cookieOptions(req));
  res.json({ message: 'Logged out successfully' });
};

/**
 * CHECK (who am I?)
 * Used by the frontend on page load to know if the user is still logged in.
 */
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name role');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Please login again.' });
    }
    res.json({ success: true, name: user.name, role: user.role });
  } catch (err) {
    console.error('Auth check error:', err.message);
    res.status(500).json({ error: 'Could not check login status' });
  }
};
