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

// Helper to compress and save image as WebP
async function compressAndSaveImage(file) {
  if (!file) return null;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `blog-${uniqueSuffix}.webp`;
  const destDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const destPath = path.join(destDir, filename);

  // Resize to max 800px width/height inside bound, encode as WebP with 80% quality
  await sharp(file.buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(destPath);

  return `/uploads/${filename}`;
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

// 1. PUBLIC: GET /api/blog (List posts)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const queryOptions = {
      orderBy: { createdAt: 'desc' }
    };
    if (status) {
      queryOptions.where = { status };
    }
    const posts = await prisma.blogPost.findMany(queryOptions);
    return res.json(posts);
  } catch (error) {
    next(error);
  }
});

// 2. PROTECTED: POST /api/blog (Create Post)
router.post('/', authenticateToken, upload.single('coverImage'), async (req, res, next) => {
  try {
    const { title, category, content, status } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({ error: 'Title, category, and content are required.' });
    }

    const coverImageUrl = req.file ? await compressAndSaveImage(req.file) : null;

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        status: status || 'published',
        coverImage: coverImageUrl
      }
    });

    return res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// 3. PROTECTED: PUT /api/blog/:id (Update Post)
router.put('/:id', authenticateToken, upload.single('coverImage'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, content, status } = req.body;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    let coverImageUrl = existing.coverImage;
    if (req.file) {
      coverImageUrl = await compressAndSaveImage(req.file);
      deleteLocalFile(existing.coverImage);
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        category: category !== undefined ? category.trim() : existing.category,
        content: content !== undefined ? content.trim() : existing.content,
        status: status !== undefined ? status : existing.status,
        coverImage: coverImageUrl
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// 4. PROTECTED: DELETE /api/blog/:id (Delete Post)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    deleteLocalFile(existing.coverImage);

    await prisma.blogPost.delete({ where: { id } });
    return res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
