const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    success: true,
    message: 'BudgetWatch API is operational on Vercel Serverless',
    databaseMode: 'In-Memory Government Datastore',
    timestamp: new Date().toISOString()
  });
});

// Fallback high-fidelity routes
const fallback = require('../lib/routes/fallbackRoutes');

app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  } else if (req.url === '/api') {
    req.url = '/';
  }
  return fallback(req, res, next);
});

module.exports = app;
