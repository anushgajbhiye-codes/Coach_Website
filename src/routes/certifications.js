const uploadToCloudinary = require('../utils/uploadToCloudinary');
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Store files in memory buffer before compression
const storage = multer.memoryStorage();
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

// 1. PUBLIC: GET /api/certifications
router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.certification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: POST /api/certifications (Add Certification)
router.post('/', authenticateToken, upload.single('certificateImage'), async (req, res, next) => {
  try {
    const { name, title, issuingBody } = req.body;
    const certTitle = title || name;
    if (!certTitle || !issuingBody) {
      return res.status(400).json({ error: 'Certification title and issuing body are required.' });
    }

    const imageUrl = req.file
      ? await uploadToCloudinary(req.file, 'apex-coaching/certifications')
      : null;
    const cert = await prisma.certification.create({
      data: {
        title: certTitle.trim(),
        issuingBody: issuingBody.trim(),
        imageUrl: imageUrl
      }
    });

    return res.status(201).json(cert);
  } catch (error) {
    next(error);
  }
});

// 3. PROTECTED: DELETE /api/certifications/:id (Delete Certification)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.certification.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Certification not found.' });

    // Clean up badge upload file
    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../..', existing.imageUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(err);
        }
      }
    }

    await prisma.certification.delete({ where: { id } });
    return res.json({ message: 'Certification deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
