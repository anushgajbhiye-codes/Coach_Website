const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Token authentication middleware
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// All clients endpoints are protected
router.use(authenticateToken);

// 1. GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(clients);
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/clients (Create Client)
router.post('/', async (req, res, next) => {
  try {
    const { name, program, plan, checkinDate, progress, status, paidUntil, startDate } = req.body;
    if (!name || !program || !plan || !checkinDate) {
      return res.status(400).json({ error: 'Name, program, plan and check-in date are required.' });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        program: program.trim(),
        plan: plan.trim(),
        checkinDate: checkinDate.trim(),
        progress: progress ? parseInt(progress) : 0,
        status: status || 'active',
        startDate: startDate ? new Date(startDate) : new Date(),
        paidUntil: paidUntil ? new Date(paidUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      }
    });

    return res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/clients/:id (Update Client)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, program, plan, checkinDate, progress, status, paidUntil, startDate } = req.body;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Client not found.' });

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        program: program !== undefined ? program.trim() : existing.program,
        plan: plan !== undefined ? plan.trim() : existing.plan,
        checkinDate: checkinDate !== undefined ? checkinDate.trim() : existing.checkinDate,
        progress: progress !== undefined ? parseInt(progress) : existing.progress,
        status: status !== undefined ? status : existing.status,
        startDate: startDate !== undefined ? new Date(startDate) : existing.startDate,
        paidUntil: paidUntil !== undefined ? new Date(paidUntil) : existing.paidUntil,
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. DELETE /api/clients/:id (Delete Client)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Client not found.' });

    await prisma.client.delete({ where: { id } });
    return res.json({ message: 'Client deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
