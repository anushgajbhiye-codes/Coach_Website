const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 1. PUBLIC: GET /api/legal/:type (privacy, terms, refund)
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const admin = await prisma.admin.findFirst();
    if (!admin) return res.status(404).json({ error: 'System administrator settings not configured.' });

    let content = '';
    if (type === 'privacy') {
      content = admin.privacyPolicy || 'Privacy Policy under construction.';
    } else if (type === 'terms') {
      content = admin.termsOfService || 'Terms of Service under construction.';
    } else if (type === 'refund') {
      content = admin.refundPolicy || 'Refund Policy under construction.';
    } else {
      return res.status(400).json({ error: 'Invalid policy type parameter.' });
    }

    return res.json({ type, content });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
