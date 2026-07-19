const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

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

// 1. PUBLIC: GET /api/pricing
router.get('/', async (req, res, next) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return res.json(plans);
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: PUT /api/pricing/:id (Save pricing changes)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, features, isActive, isVegFriendly } = req.body;

    const existing = await prisma.pricingPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Pricing plan not found.' });

    const updated = await prisma.pricingPlan.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        price: price !== undefined ? parseInt(price) : existing.price,
        features: features !== undefined ? features.trim() : existing.features,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existing.isActive,
        isVegFriendly: isVegFriendly !== undefined ? (isVegFriendly === 'true' || isVegFriendly === true) : existing.isVegFriendly
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
