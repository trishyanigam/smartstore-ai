import express from 'express';
import { getSalesAnalytics } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mount the Sales Analytics endpoint
// Requires authentication and administrator clearance
router.get('/sales', protect, admin, getSalesAnalytics);
router.get('/', protect, admin, getSalesAnalytics);

export default router;
