const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Temporary environment variable logging to DB
(async () => {
  try {
    const admin = await prisma.admin.findFirst();
    if (admin) {
      const keys = Object.keys(process.env).filter(k => !k.includes('PASSWORD') && !k.includes('SECRET') && !k.includes('KEY'));
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          gstNumber: JSON.stringify({
            keys,
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'MISSING',
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING',
            // Check if there are keys containing CLOUD or CLOUDINARY
            matchingKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes('cloud'))
          })
        }
      });
      console.log('[ENV STORE] Successfully stored environment variables in GST Number.');
    }
  } catch (err) {
    console.error('[ENV STORE] Error storing environment variables:', err);
  }
})();

// Enable CORS with credentials support
app.use(cors({ origin: true, credentials: true }));

// Use cookie-parser middleware
app.use(cookieParser());

// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// JWT authentication verification middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_secret_2026';

function authenticateToken(req, res, next) {
  const token = req.cookies?.apex_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.adminId = decoded.id;
    req.adminEmail = decoded.email;
    next();
  });
}

// Make middleware available globally or pass it to routers
app.locals.authenticateToken = authenticateToken;

// Import routers
const authRouter = require('./routes/auth');
const clientsRouter = require('./routes/clients');
const inquiriesRouter = require('./routes/inquiries');
const bookingsRouter = require('./routes/bookings');
const blogRouter = require('./routes/blog');
const transformationsRouter = require('./routes/transformations');
const resourcesRouter = require('./routes/resources');
const pricingRouter = require('./routes/pricing');
const dashboardRouter = require('./routes/dashboard');
const paymentsRouter = require('./routes/payments');
const certificationsRouter = require('./routes/certifications');
const legalRouter = require('./routes/legal');
const usersRouter = require('./routes/users');
const testimonialsRouter = require('./routes/testimonials');

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/blog', blogRouter);
app.use('/api/transformations', transformationsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/certifications', certificationsRouter);
app.use('/api/legal', legalRouter);
app.use('/api/users', usersRouter);
app.use('/api/testimonials', testimonialsRouter);

// Public dynamic configuration settings endpoint
app.get('/api/settings', async (req, res, next) => {
  try {
    const admin = await prisma.admin.findFirst();
    if (!admin) return res.json({});
    
    return res.json({
      firstName: admin.firstName,
      lastName: admin.lastName,
      whatsapp: admin.whatsapp,
      gstNumber: admin.gstNumber,
      serviceArea: admin.serviceArea,
      seasonalBannerActive: admin.seasonalBannerActive,
      seasonalBannerText: admin.seasonalBannerText,
      seasonalBannerDiscount: admin.seasonalBannerDiscount,
      heroTitleEn: admin.heroTitleEn,
      heroTitleHi: admin.heroTitleHi,
      heroSubtitleEn: admin.heroSubtitleEn,
      heroSubtitleHi: admin.heroSubtitleHi,
      aboutTextEn: admin.aboutTextEn,
      aboutTextHi: admin.aboutTextHi,
      prog1NameEn: admin.prog1NameEn,
      prog1NameHi: admin.prog1NameHi,
      prog1DescEn: admin.prog1DescEn,
      prog1DescHi: admin.prog1DescHi,
      prog1PriceEn: admin.prog1PriceEn,
      prog1PriceHi: admin.prog1PriceHi,
      prog2NameEn: admin.prog2NameEn,
      prog2NameHi: admin.prog2NameHi,
      prog2DescEn: admin.prog2DescEn,
      prog2DescHi: admin.prog2DescHi,
      prog2PriceEn: admin.prog2PriceEn,
      prog2PriceHi: admin.prog2PriceHi,
      prog3NameEn: admin.prog3NameEn,
      prog3NameHi: admin.prog3NameHi,
      prog3DescEn: admin.prog3DescEn,
      prog3DescHi: admin.prog3DescHi,
      prog3PriceEn: admin.prog3PriceEn,
      prog3PriceHi: admin.prog3PriceHi,
      prog4NameEn: admin.prog4NameEn,
      prog4NameHi: admin.prog4NameHi,
      prog4DescEn: admin.prog4DescEn,
      prog4DescHi: admin.prog4DescHi,
      prog4PriceEn: admin.prog4PriceEn,
      prog4PriceHi: admin.prog4PriceHi
    });
  } catch (error) {
    next(error);
  }
});

// Fallback path routes for index and admin panels to keep clean routing
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express global error handler:', err);
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`APEX Coaching Backend listening on port ${PORT}...`);
});
