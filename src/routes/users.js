const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();
const JWT_SECRET_ADMIN = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';
const JWT_SECRET_USER = process.env.JWT_SECRET_USER || 'apex_visitor_secure_secret_2026';

// 1. Rate Limiting on Sign Up and Log In (10 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many auth attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to authenticate Coach (Admin)
function authenticateAdmin(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  
  jwt.verify(token, JWT_SECRET_ADMIN, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// Middleware to authenticate Website User
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  
  jwt.verify(token, JWT_SECRET_USER, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.userId = decoded.id;
    next();
  });
}

// Validation Helpers
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// A. PUBLIC: POST /api/users/signup (Rate Limited)
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Name, email, password, and confirm password are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Indian phone number check (if provided)
    if (phone) {
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        return res.status(400).json({ error: 'Invalid Indian phone number format.' });
      }
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        passwordHash
      }
    });

    // Sign User JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET_USER,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// B. PUBLIC: POST /api/users/login (Rate Limited)
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // Generic error message for security
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update lastLoginAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Sign User JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET_USER,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// C. USER-AUTH: GET /api/users/me
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    next(error);
  }
});

// D. COACH-ONLY: GET /api/users (List all site users)
router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Map out passwordHash before returning
    const safeUsers = users.map(u => {
      const { passwordHash: _, ...rest } = u;
      return rest;
    });

    return res.json(safeUsers);
  } catch (error) {
    next(error);
  }
});

// E. COACH-ONLY: POST /api/users/:id/reset-password (Manually reset user's password)
router.post('/:id/reset-password', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Generate random 6-digit number if newPassword is not provided
    const tempPassword = newPassword ? newPassword.trim() : `APEX@user${Math.floor(1000 + Math.random() * 9000)}`;

    if (tempPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    return res.json({
      message: 'Password reset successful.',
      tempPassword
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
