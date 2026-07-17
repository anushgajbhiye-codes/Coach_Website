const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';
const jwt = require('jsonwebtoken');

// Verification helper
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// 1. GET /api/testimonials (public, no auth)
router.get('/', async (req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    return res.json(testimonials);
  } catch (error) {
    next(error);
  }
});

// Helper function to auto-derive initials from clientName
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// 2. POST /api/testimonials (coach-only)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { clientName, initials, rating, quote, resultTag, displayOrder } = req.body;
    if (!clientName || !quote || !resultTag) {
      return res.status(400).json({ error: 'Client Name, Quote, and Result Tag are required.' });
    }

    const newTestimonial = await prisma.testimonial.create({
      data: {
        clientName: clientName.trim(),
        initials: (initials && initials.trim()) ? initials.trim().toUpperCase() : getInitials(clientName),
        rating: rating !== undefined ? parseInt(rating) : 5,
        quote: quote.trim(),
        resultTag: resultTag.trim(),
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0
      }
    });

    return res.status(201).json(newTestimonial);
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/testimonials/:id (coach-only)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clientName, initials, rating, quote, resultTag, displayOrder } = req.body;

    const existing = await prisma.testimonial.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        clientName: clientName !== undefined ? clientName.trim() : undefined,
        initials: initials !== undefined 
          ? ((initials && initials.trim()) ? initials.trim().toUpperCase() : getInitials(clientName || existing.clientName))
          : undefined,
        rating: rating !== undefined ? parseInt(rating) : undefined,
        quote: quote !== undefined ? quote.trim() : undefined,
        resultTag: resultTag !== undefined ? resultTag.trim() : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. DELETE /api/testimonials/:id (coach-only)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.testimonial.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    await prisma.testimonial.delete({
      where: { id }
    });

    return res.json({ message: 'Testimonial deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
