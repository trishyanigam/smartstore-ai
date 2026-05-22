import OpenAI from 'openai';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Insight from '../models/Insight.js';

// Initialize OpenAI client (handles missing key gracefully)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// @desc    Get saved AI insights from database
// @route   GET /api/ai/insights
// @access  Private/Admin
export const getInsightsList = async (req, res, next) => {
  try {
    const insights = await Insight.find().sort({ createdAt: -1 });

    // Fallback default insights if database is empty
    if (insights.length === 0) {
      const defaultInsights = [
        {
          _id: 'mock1',
          title: 'Low Inventory Warning: Electronics',
          description:
            'Demand forecasting indicates a 35% surge in Electronics sales next month. Current stock level is insufficient to meet this demand.',
          category: 'Inventory',
          severity: 'High',
          actionableSteps: [
            "Reorder 'Sample Electronics Product' by at least 50 units",
            'Adjust promotional spending for low-stock items',
          ],
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          _id: 'mock2',
          title: 'Sales Growth Velocity Pick-up',
          description:
            'SmartStore sales velocity has increased by 12% week-over-week, primarily driven by fashion and accessory categories.',
          category: 'Sales',
          severity: 'Medium',
          actionableSteps: [
            'Highlight trending clothing items on homepage',
            'Consider product bundles to increase Average Order Value (AOV)',
          ],
          createdAt: new Date(Date.now() - 7200000),
        },
      ];
      return res.json(defaultInsights);
    }

    res.json(insights);
  } catch (error) {
    next(error);
  }
};

// @desc    Request new AI insights generation
// @route   POST /api/ai/generate
// @access  Private/Admin
export const generateStoreInsights = async (req, res, next) => {
  try {
    const lowStock = await Product.find({ stockCount: { $lt: 10 } });
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();

    const systemPrompt = `You are an AI Business Analyst for SmartStore, an ecommerce website. 
    Analyze the following store status and provide 2 distinct, highly actionable insights.
    Return JSON format only, matching this structure:
    [
      {
        "title": "Short title",
        "description": "Deep-dive analysis text...",
        "category": "Inventory" | "Sales" | "Marketing" | "Customer",
        "severity": "Low" | "Medium" | "High",
        "actionableSteps": ["Step 1", "Step 2"]
      }
    ]`;

    const userPrompt = `Store status:
    - Total products in catalog: ${productsCount}
    - Total orders placed: ${ordersCount}
    - Products with low stock (<10 units): ${JSON.stringify(
      lowStock.map((p) => ({ name: p.name, stock: p.stockCount }))
    )}
    `;

    const isApiKeyMissing =
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY.includes('your_openai_api_key') ||
      process.env.OPENAI_API_KEY === 'dummy_key';

    if (isApiKeyMissing) {
      console.log(
        'Using local heuristics engine (mock AI) due to missing OpenAI key.'
      );

      // Smart mock engine generating smart dynamic insights based on actual database values!
      const generatedInsights = [];

      if (lowStock.length > 0) {
        generatedInsights.push({
          title: 'Critical Stock Shortage Detected',
          description: `You have ${lowStock.length} items running low on stock (under 10 units). This might lead to order fulfillment failures and lost revenue soon.`,
          category: 'Inventory',
          severity: 'High',
          actionableSteps: lowStock.map(
            (p) => `Restock '${p.name}' (current stock: ${p.stockCount})`
          ),
        });
      } else {
        generatedInsights.push({
          title: 'Inventory Level Optimized',
          description:
            'All products are currently well-stocked. Great job maintaining optimal buffer inventory levels across all departments.',
          category: 'Inventory',
          severity: 'Low',
          actionableSteps: [
            'Keep monitoring stock levels weekly',
            'Analyze slow-moving items to clear warehouse space',
          ],
        });
      }

      generatedInsights.push({
        title: 'Customer Retention Strategy',
        description: `With a total of ${ordersCount} orders in our system, retention analysis suggests we could boost repeat purchases by 15% with targeted discount follow-up emails.`,
        category: 'Marketing',
        severity: 'Medium',
        actionableSteps: [
          'Set up automated email flow for post-purchase review discounts',
          'Promote related products based on order patterns',
        ],
      });

      // Save insights to DB
      const savedInsights = await Insight.insertMany(generatedInsights);
      return res.status(201).json(savedInsights);
    }

    // Call actual OpenAI if key is present
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    // Support either direct array or wrapping object
    const insightsArray = Array.isArray(result)
      ? result
      : result.insights || Object.values(result)[0];

    const savedInsights = await Insight.insertMany(insightsArray);
    res.status(201).json(savedInsights);
  } catch (error) {
    next(error);
  }
};
