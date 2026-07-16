const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Storage configuration for resource documents (PDFs, docx)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resource-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

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

// 1. PUBLIC: GET /api/resources (List Resources)
router.get('/', async (req, res, next) => {
  try {
    const { access } = req.query; // e.g. access=Public
    const queryOptions = {
      orderBy: { createdAt: 'desc' }
    };
    if (access) {
      queryOptions.where = { access };
    }
    const list = await prisma.resource.findMany(queryOptions);
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: POST /api/resources (Upload Resource)
router.post('/', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    const { name, type, access, isVegFriendly } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Resource name and type are required.' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        access: access || 'Public',
        fileUrl: fileUrl,
        downloads: 0,
        isVegFriendly: isVegFriendly === 'true' || isVegFriendly === true
      }
    });

    return res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
});

// 3. PROTECTED: PUT /api/resources/:id (Edit Resource / Record download)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, access, isVegFriendly, downloadIncrement } = req.body;

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found.' });

    // Handle download increment (can be updated publicly on download trigger)
    if (downloadIncrement) {
      const updated = await prisma.resource.update({
        where: { id },
        data: { downloads: existing.downloads + 1 }
      });
      return res.json(updated);
    }

    // Otherwise require authentication for updates
    const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    if (!token) return res.status(401).json({ error: 'Access token required.' });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(403).json({ error: 'Invalid token.' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        type: type !== undefined ? type.trim() : existing.type,
        access: access !== undefined ? access : existing.access,
        isVegFriendly: isVegFriendly !== undefined ? (isVegFriendly === 'true' || isVegFriendly === true) : existing.isVegFriendly
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. PROTECTED: DELETE /api/resources/:id (Delete Resource)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found.' });

    // Remove PDF document from disk if it exists
    if (existing.fileUrl && existing.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../..', existing.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.resource.delete({ where: { id } });
    return res.json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
