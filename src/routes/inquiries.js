const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Token authentication helper
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// 1. PUBLIC: POST /api/inquiries (Submit Contact Form)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, message, subject } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        message: message.trim(),
        subject: subject ? subject.trim() : 'Coaching Inquiry',
        time: 'Just now',
        status: 'new'
      }
    });

    return res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry });
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: GET /api/inquiries (List Inquiries)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(inquiries);
  } catch (error) {
    next(error);
  }
});

// 3. PROTECTED: PUT /api/inquiries/:id (Mark as Read)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'read' or 'new'

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status: status || 'read' }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. PROTECTED: DELETE /api/inquiries/:id (Delete Inquiry)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });

    await prisma.inquiry.delete({ where: { id } });
    return res.json({ message: 'Inquiry deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
