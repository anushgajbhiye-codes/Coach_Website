const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Helper token auth middleware
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// 1. PUBLIC: POST /api/bookings (Submit Consultation Request)
router.post('/', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, programInterest, goal, dateTime } = req.body;
    // Goal can be added to goal field or description. Let's merge first and last name if needed, or save properly.
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    if (!name || !email || !phone || !programInterest) {
      return res.status(400).json({ error: 'Name, email, phone, and program interest are required.' });
    }

    // Default booking date to 2 days from now if not specified (for the mock)
    const bookingDate = dateTime ? new Date(dateTime) : new Date(Date.now() + 48 * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dateTime: bookingDate,
        programInterest: programInterest.trim(),
        status: 'pending'
      }
    });

    return res.status(201).json({ message: 'Consultation request submitted successfully.', booking });
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: GET /api/bookings (List All Bookings)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { dateTime: 'asc' }
    });
    return res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// 3. PROTECTED: PUT /api/bookings/:id/status (Approve/Decline Booking)
router.put('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed', 'declined', 'pending'

    if (!['confirmed', 'declined', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Booking not found.' });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. PROTECTED: DELETE /api/bookings/:id (Delete Booking)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Booking not found.' });

    await prisma.booking.delete({ where: { id } });
    return res.json({ message: 'Booking deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
