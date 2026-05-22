import express from 'express';
import {
  getInsightsList,
  generateStoreInsights,
  getSalesSuggestions,
} from '../controllers/aiController.js';
import { generateProductCopy } from '../controllers/productAiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/insights', protect, admin, getInsightsList);
router.post('/generate', protect, admin, generateStoreInsights);
router.post('/product/generate', protect, generateProductCopy);
router.post('/sales-suggestions', protect, admin, getSalesSuggestions);

export default router;
