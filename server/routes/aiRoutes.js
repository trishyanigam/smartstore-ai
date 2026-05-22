import express from 'express';
import {
  getInsightsList,
  generateStoreInsights,
  getSalesSuggestions,
} from '../controllers/aiController.js';
import { generateProductCopy } from '../controllers/productAiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/insights', protect, getInsightsList);
router.post('/generate', protect, generateStoreInsights);
router.post('/product/generate', protect, generateProductCopy);
router.post('/sales-suggestions', protect, getSalesSuggestions);

export default router;
