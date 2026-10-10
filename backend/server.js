require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');
const { connectDB, getIsConnected } = require('./src/config/db');

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:4200', 'http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve compiled Angular production frontend
const frontendDist = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(frontendDist));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BudgetWatch API is operational',
    databaseMode: getIsConnected() ? 'MongoDB' : 'In-Memory Government Datastore',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  const dbConnected = await connectDB();

  if (dbConnected) {
    // Normal MongoDB Mongoose routes
    app.use('/api/auth', require('./src/routes/auth'));
    app.use('/api/departments', require('./src/routes/departments'));
    app.use('/api/budgets', require('./src/routes/budgets'));
    app.use('/api/expenditures', require('./src/routes/expenditures'));
    app.use('/api/alerts', require('./src/routes/alerts'));
    app.use('/api/monitoring', require('./src/routes/monitoring'));
    app.use('/api/reports', require('./src/routes/reports'));
    app.use('/api/admin', require('./src/routes/admin'));
  } else {
    // Zero-downtime high-fidelity in-memory routes
    app.use('/api', require('./src/routes/fallbackRoutes'));
  }

  // SPA client-side routing for Angular
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  // 404 handler for API
  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
  });

  // Cron job: Run anomaly detection daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running scheduled anomaly detection...');
    try {
      const { runFullCheck } = require('./src/utils/anomalyDetection');
      const result = await runFullCheck();
      console.log('✅ Scheduled check complete:', result);
    } catch (err) {
      console.error('❌ Scheduled anomaly detection failed:', err.message);
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n================================================================`);
    console.log(`🚀 BudgetWatch API running on http://localhost:${PORT}`);
    console.log(`📡 Mode: [${process.env.NODE_ENV || 'development'}] | DB: [${dbConnected ? 'MongoDB' : 'In-Memory Pre-Seeded'}]`);
    console.log(`================================================================\n`);
  });
}

startServer();

module.exports = app;
