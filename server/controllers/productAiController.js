import { generateProductAssets } from '../services/openaiService.js';

// @desc    Generate product description, SEO tags, and marketing caption
// @route   POST /api/ai/product/generate
// @access  Private
export const generateProductCopy = async (req, res, next) => {
  const { title, category, features } = req.body;

  try {
    if (!title || !title.trim()) {
      res.status(400);
      throw new Error('Please provide a product title');
    }

    if (!category || !category.trim()) {
      res.status(400);
      throw new Error('Please provide a product category');
    }

    // Call service to generate product assets (description, SEO tags, marketing caption)
    const assets = await generateProductAssets(
      title,
      category,
      features || []
    );

    res.json(assets);
  } catch (error) {
    next(error);
  }
};
