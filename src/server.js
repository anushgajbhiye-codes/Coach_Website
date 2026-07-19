const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

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
      heroSubtitleEn: admin.heroSubtitleEn,
      aboutTextEn: admin.aboutTextEn,
      prog1NameEn: admin.prog1NameEn,
      prog1DescEn: admin.prog1DescEn,
      prog1PriceEn: admin.prog1PriceEn,
      prog2NameEn: admin.prog2NameEn,
      prog2DescEn: admin.prog2DescEn,
      prog2PriceEn: admin.prog2PriceEn,
      prog3NameEn: admin.prog3NameEn,
      prog3DescEn: admin.prog3DescEn,
      prog3PriceEn: admin.prog3PriceEn,
      prog4NameEn: admin.prog4NameEn,
      prog4DescEn: admin.prog4DescEn,
      prog4PriceEn: admin.prog4PriceEn
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
