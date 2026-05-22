import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Base informational endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SmartStore AI Ecommerce Dashboard API is running...',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      dashboard: '/api/dashboard',
      ai: '/api/ai',
      analytics: '/api/analytics',
    },
  });
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback for Page/Route Not Found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );
});
