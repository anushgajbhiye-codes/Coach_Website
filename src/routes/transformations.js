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

// Verification middleware
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.adminId = decoded.id;
    next();
  });
}

// Helper to clean up file from disk
function deleteLocalFile(fileUrl) {
  if (fileUrl && fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../..', fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }
  }
}

// 1. PUBLIC: GET /api/transformations
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const queryOptions = {
      orderBy: { createdAt: 'desc' }
    };
    if (status) {
      queryOptions.where = { status };
    }
    const list = await prisma.transformation.findMany(queryOptions);
    return res.json(list);
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: POST /api/transformations (Create)
router.post(
  '/',
  authenticateToken,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { clientName, duration, result, programType, testimonial, consent, status, videoUrl } = req.body;
      if (!clientName || !duration || !result || !programType) {
        return res.status(400).json({ error: 'Client name, duration, result, and program type are required.' });
      }

      const coverUrl = req.files?.coverImage
        ? await uploadToCloudinary(req.files.coverImage[0], 'apex-coaching/transformations')
        : null;

      const beforeUrl = req.files?.beforeImage
        ? await uploadToCloudinary(req.files.beforeImage[0], 'apex-coaching/transformations')
        : null;

      const afterUrl = req.files?.afterImage
        ? await uploadToCloudinary(req.files.afterImage[0], 'apex-coaching/transformations')
        : null;

      const trans = await prisma.transformation.create({
        data: {
          clientName: clientName.trim(),
          duration: duration.trim(),
          result: result.trim(),
          programType: programType.trim(),
          testimonial: testimonial ? testimonial.trim() : null,
          videoUrl: videoUrl ? videoUrl.trim() : null,
          consent: consent === 'true' || consent === true,
          status: status || 'live',
          coverImage: coverUrl,
          beforeImage: beforeUrl,
          afterImage: afterUrl
        }
      });

      return res.status(201).json(trans);
    } catch (error) {
      next(error);
    }
  }
);

// 3. PROTECTED: PUT /api/transformations/:id (Update)
router.put(
  '/:id',
  authenticateToken,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { clientName, duration, result, programType, testimonial, consent, status, videoUrl } = req.body;

      const existing = await prisma.transformation.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Transformation entry not found.' });

      let coverUrl = existing.coverImage;
      if (req.files && req.files['coverImage']) {
        coverUrl = await uploadToCloudinary(
          req.files.coverImage[0],
          'apex-coaching/transformations'
        ); deleteLocalFile(existing.coverImage);
      }

      let beforeUrl = existing.beforeImage;
      if (req.files && req.files['beforeImage']) {
        beforeUrl = await uploadToCloudinary(
          req.files.beforeImage[0],
          'apex-coaching/transformations'
        ); deleteLocalFile(existing.beforeImage);
      }

      let afterUrl = existing.afterImage;
      if (req.files && req.files['afterImage']) {
        afterUrl = await uploadToCloudinary(
          req.files.afterImage[0],
          'apex-coaching/transformations'
        ); deleteLocalFile(existing.afterImage);
      }

      const updated = await prisma.transformation.update({
        where: { id },
        data: {
          clientName: clientName !== undefined ? clientName.trim() : existing.clientName,
          duration: duration !== undefined ? duration.trim() : existing.duration,
          result: result !== undefined ? result.trim() : existing.result,
          programType: programType !== undefined ? programType.trim() : existing.programType,
          testimonial: testimonial !== undefined ? testimonial.trim() : existing.testimonial,
          videoUrl: videoUrl !== undefined ? videoUrl.trim() : existing.videoUrl,
          consent: consent !== undefined ? (consent === 'true' || consent === true) : existing.consent,
          status: status !== undefined ? status : existing.status,
          coverImage: coverUrl,
          beforeImage: beforeUrl,
          afterImage: afterUrl
        }
      });

      return res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// 4. PROTECTED: DELETE /api/transformations/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transformation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Transformation entry not found.' });

    deleteLocalFile(existing.coverImage);
    deleteLocalFile(existing.beforeImage);
    deleteLocalFile(existing.afterImage);

    await prisma.transformation.delete({ where: { id } });
    return res.json({ message: 'Transformation entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
