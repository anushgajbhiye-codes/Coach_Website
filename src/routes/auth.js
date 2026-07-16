const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

// Helper middleware for protected routes inside this router
function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.adminId = decoded.id;
    req.adminEmail = decoded.email;
    next();
  });
}

// 1. POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    // Sign JWT token valid for 7 days
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and profile details (excluding password hash), and set httpOnly cookie
    res.cookie('apex_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { passwordHash: _, ...profile } = admin;
    return res.json({ token, profile });
  } catch (error) {
    next(error);
  }
});

// 1.5. POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('apex_token');
  return res.json({ message: 'Logged out successfully.' });
});

// 2. GET /api/auth/me (Protected)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId }
    });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    const { passwordHash: _, ...profile } = admin;
    return res.json(profile);
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/auth/profile (Protected)
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { email, firstName, lastName, whatsapp } = req.body;
    if (!email || !firstName || !lastName || !whatsapp) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if email is already taken by another admin
    if (email.trim().toLowerCase() !== req.adminEmail.toLowerCase()) {
      const existing = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: req.adminId },
      data: {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        whatsapp: whatsapp.trim(),
      }
    });

    const { passwordHash: _, ...profile } = updatedAdmin;
    return res.json({ message: 'Profile updated successfully.', profile });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/auth/password (Protected)
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// 5. PROTECTED: PUT /api/auth/settings (Update dynamic settings)
router.put('/settings', authenticateToken, async (req, res, next) => {
  try {
    const {
      gstNumber,
      privacyPolicy, termsOfService, refundPolicy,
      serviceArea,
      seasonalBannerActive, seasonalBannerText, seasonalBannerDiscount,
      heroTitleEn, heroTitleHi, heroSubtitleEn, heroSubtitleHi,
      aboutTextEn, aboutTextHi,
      prog1NameEn, prog1NameHi, prog1DescEn, prog1DescHi, prog1PriceEn, prog1PriceHi,
      prog2NameEn, prog2NameHi, prog2DescEn, prog2DescHi, prog2PriceEn, prog2PriceHi,
      prog3NameEn, prog3NameHi, prog3DescEn, prog3DescHi, prog3PriceEn, prog3PriceHi,
      prog4NameEn, prog4NameHi, prog4DescEn, prog4DescHi, prog4PriceEn, prog4PriceHi
    } = req.body;

    const updatedAdmin = await prisma.admin.update({
      where: { id: req.adminId },
      data: {
        gstNumber: gstNumber !== undefined ? gstNumber.trim() : undefined,
        privacyPolicy: privacyPolicy !== undefined ? privacyPolicy.trim() : undefined,
        termsOfService: termsOfService !== undefined ? termsOfService.trim() : undefined,
        refundPolicy: refundPolicy !== undefined ? refundPolicy.trim() : undefined,
        serviceArea: serviceArea !== undefined ? serviceArea.trim() : undefined,
        seasonalBannerActive: seasonalBannerActive !== undefined ? (seasonalBannerActive === true || seasonalBannerActive === 'true') : undefined,
        seasonalBannerText: seasonalBannerText !== undefined ? seasonalBannerText.trim() : undefined,
        seasonalBannerDiscount: seasonalBannerDiscount !== undefined ? parseInt(seasonalBannerDiscount) : undefined,
        heroTitleEn: heroTitleEn !== undefined ? heroTitleEn.trim() : undefined,
        heroTitleHi: heroTitleHi !== undefined ? heroTitleHi.trim() : undefined,
        heroSubtitleEn: heroSubtitleEn !== undefined ? heroSubtitleEn.trim() : undefined,
        heroSubtitleHi: heroSubtitleHi !== undefined ? heroSubtitleHi.trim() : undefined,
        aboutTextEn: aboutTextEn !== undefined ? aboutTextEn.trim() : undefined,
        aboutTextHi: aboutTextHi !== undefined ? aboutTextHi.trim() : undefined,
        prog1NameEn: prog1NameEn !== undefined ? prog1NameEn.trim() : undefined,
        prog1NameHi: prog1NameHi !== undefined ? prog1NameHi.trim() : undefined,
        prog1DescEn: prog1DescEn !== undefined ? prog1DescEn.trim() : undefined,
        prog1DescHi: prog1DescHi !== undefined ? prog1DescHi.trim() : undefined,
        prog1PriceEn: prog1PriceEn !== undefined ? prog1PriceEn.trim() : undefined,
        prog1PriceHi: prog1PriceHi !== undefined ? prog1PriceHi.trim() : undefined,
        prog2NameEn: prog2NameEn !== undefined ? prog2NameEn.trim() : undefined,
        prog2NameHi: prog2NameHi !== undefined ? prog2NameHi.trim() : undefined,
        prog2DescEn: prog2DescEn !== undefined ? prog2DescEn.trim() : undefined,
        prog2DescHi: prog2DescHi !== undefined ? prog2DescHi.trim() : undefined,
        prog2PriceEn: prog2PriceEn !== undefined ? prog2PriceEn.trim() : undefined,
        prog2PriceHi: prog2PriceHi !== undefined ? prog2PriceHi.trim() : undefined,
        prog3NameEn: prog3NameEn !== undefined ? prog3NameEn.trim() : undefined,
        prog3NameHi: prog3NameHi !== undefined ? prog3NameHi.trim() : undefined,
        prog3DescEn: prog3DescEn !== undefined ? prog3DescEn.trim() : undefined,
        prog3DescHi: prog3DescHi !== undefined ? prog3DescHi.trim() : undefined,
        prog3PriceEn: prog3PriceEn !== undefined ? prog3PriceEn.trim() : undefined,
        prog3PriceHi: prog3PriceHi !== undefined ? prog3PriceHi.trim() : undefined,
        prog4NameEn: prog4NameEn !== undefined ? prog4NameEn.trim() : undefined,
        prog4NameHi: prog4NameHi !== undefined ? prog4NameHi.trim() : undefined,
        prog4DescEn: prog4DescEn !== undefined ? prog4DescEn.trim() : undefined,
        prog4DescHi: prog4DescHi !== undefined ? prog4DescHi.trim() : undefined,
        prog4PriceEn: prog4PriceEn !== undefined ? prog4PriceEn.trim() : undefined,
        prog4PriceHi: prog4PriceHi !== undefined ? prog4PriceHi.trim() : undefined
      }
    });

    const { passwordHash: _, ...profile } = updatedAdmin;
    return res.json({ message: 'Settings updated successfully.', profile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
