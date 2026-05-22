import express from 'express';
import {
  getInsightsList,
  generateStoreInsights,
} from '../controllers/aiController.js';
import { generateProductCopy } from '../controllers/productAiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/insights', protect, admin, getInsightsList);
router.post('/generate', protect, admin, generateStoreInsights);
router.post('/product/generate', protect, generateProductCopy);

export default router;
