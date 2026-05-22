import OpenAI from 'openai';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Insight from '../models/Insight.js';

// Initialize OpenAI client lazily to ensure environment variables are loaded
const getOpenAIClient = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
  baseURL: 'https://openrouter.ai/api/v1',
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
    const response = await getOpenAIClient().chat.completions.create({
      model: 'openai/gpt-4o-mini',
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

// @desc    Get AI Sales Suggestions
// @route   POST /api/ai/sales-suggestions
// @access  Private/Admin
export const getSalesSuggestions = async (req, res, next) => {
  try {
    let salesData = req.body.salesData;
    let stockData = req.body.stock;
    let categoryData = req.body.category;
    let revenueData = req.body.revenue;

    // If inputs not supplied in request body, retrieve them dynamically from the database
    if (!salesData || !stockData || !categoryData || !revenueData) {
      const products = await Product.find({});
      
      // Construct rich input records based on current catalog and sales count
      salesData = products.map(p => ({
        title: p.title || p.name || 'Unknown Item',
        category: p.category || 'General',
        price: p.price || 0.0,
        stock: p.stockCount !== undefined ? p.stockCount : (p.stock || 0),
        sales: p.sales || 0,
        revenue: Math.round((p.sales || 0) * (p.price || 0) * 100) / 100
      }));

      stockData = salesData.map(s => ({ title: s.title, stock: s.stock }));
      categoryData = [...new Set(salesData.map(s => s.category))];
      revenueData = salesData.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.revenue;
        return acc;
      }, {});
    }

    const isApiKeyMissing =
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY.includes('your_openai_api_key') ||
      process.env.OPENAI_API_KEY === 'dummy_key';

    if (isApiKeyMissing) {
      console.log('Using local heuristics engine (mock AI) for sales suggestions.');

      // Run advanced mock sales suggestion logic
      const pricingRecommendations = [];
      const lowStockAlerts = [];
      const trendingProductInsights = [];

      // Pricing Recommendations Heuristics
      salesData.forEach(item => {
        if (item.sales > 5) {
          pricingRecommendations.push({
            productTitle: item.title,
            currentPrice: item.price,
            recommendedPrice: Math.round(item.price * 1.1 * 100) / 100,
            action: 'Increase price',
            rationale: `Strong sales velocity (${item.sales} units sold) and consistent category traction indicate robust brand loyalty and demand inelasticity.`
          });
        } else if (item.stock > 25 && item.sales === 0) {
          pricingRecommendations.push({
            productTitle: item.title,
            currentPrice: item.price,
            recommendedPrice: Math.round(item.price * 0.85 * 100) / 100,
            action: 'Discount price',
            rationale: `Slow-moving inventory with high storage stock count (${item.stock} units) can be optimized by initiating a limited 15% discount campaign.`
          });
        } else {
          pricingRecommendations.push({
            productTitle: item.title,
            currentPrice: item.price,
            recommendedPrice: item.price,
            action: 'No change',
            rationale: 'Optimal current price. Sales rate and stock count align perfectly with standard expectations.'
          });
        }

        // Low stock heuristic
        if (item.stock < 10) {
          const daysToOutofStock = Math.max(1, Math.round(item.stock / Math.max(0.2, item.sales / 15)));
          lowStockAlerts.push({
            productTitle: item.title,
            currentStock: item.stock,
            salesVelocity: item.sales > 5 ? 'High' : 'Medium',
            restockRecommendation: `Restock ${Math.max(25, item.sales * 2.5)} units immediately`,
            daysToOutofStock
          });
        }
      });

      // Categories summary for trending insights
      const sortedCategories = Object.entries(revenueData)
        .map(([category, rev]) => ({ category, revenue: rev }))
        .sort((a, b) => b.revenue - a.revenue);

      if (sortedCategories.length > 0) {
        const topCat = sortedCategories[0];
        trendingProductInsights.push({
          category: topCat.category,
          insight: `${topCat.category} category dominates store performance with a total of $${topCat.revenue.toLocaleString()} revenue generated.`,
          recommendedActions: [
            `Feature top items from ${topCat.category} on homepage promo slots.`,
            `Develop custom bundle kits within ${topCat.category} to scale Average Order Value (AOV).`
          ]
        });
      }

      // Add a secondary marketing insight if other categories exist
      if (sortedCategories.length > 1) {
        const runnerUp = sortedCategories[1];
        trendingProductInsights.push({
          category: runnerUp.category,
          insight: `${runnerUp.category} shows high growth potential with $${runnerUp.revenue.toLocaleString()} sales revenue recorded.`,
          recommendedActions: [
            `Launch email remarketing targets offering a coupon on ${runnerUp.category}.`,
            `Cross-sell items from ${runnerUp.category} with leading accessories.`
          ]
        });
      }

      // If no categories have revenue, inject default ones
      if (trendingProductInsights.length === 0) {
        trendingProductInsights.push({
          category: 'General',
          insight: 'Store catalog analytics show stable baseline engagement across general categories.',
          recommendedActions: [
            'Launch seasonal promotional campaign to drive sales velocity.',
            'Encourage repeat orders using loyalty point incentives.'
          ]
        });
      }

      // Fallback response matches target schema
      return res.status(200).json({
        pricingRecommendations: pricingRecommendations.slice(0, 5), // Cap for conciseness
        trendingProductInsights,
        lowStockAlerts
      });
    }

    // Call actual OpenAI Chat Completion API if key is present
    const systemPrompt = `You are an expert e-commerce Business Analyst and pricing strategist.
Analyze the provided store product sales, stock levels, categories, and revenue aggregates.
Based on the sales velocity, categories, stock limits, and prices, compile highly actionable insights:
1. Pricing Recommendations: Specific price changes with rationales (e.g. raise price for high-sales items, discount overstocked/slow items).
2. Trending Product Insights: Which categories are performing best and what marketing steps to take.
3. Low Stock Alerts: Critical restock suggestions based on sales metrics.

Return a strict, valid JSON object matching exactly this structure, keeping recommendations concise:
{
  "pricingRecommendations": [
    {
      "productTitle": "string",
      "currentPrice": number,
      "recommendedPrice": number,
      "action": "Increase price" | "Discount price" | "Bundle discount" | "No change",
      "rationale": "string"
    }
  ],
  "trendingProductInsights": [
    {
      "category": "string",
      "insight": "string",
      "recommendedActions": ["string", "string"]
    }
  ],
  "lowStockAlerts": [
    {
      "productTitle": "string",
      "currentStock": number,
      "salesVelocity": "High" | "Medium" | "Low",
      "restockRecommendation": "string",
      "daysToOutofStock": number
    }
  ]
}`;

    const userPrompt = `E-commerce Sales Report Data:
    - Products Sales & Catalog details: ${JSON.stringify(salesData)}
    - Stocks details: ${JSON.stringify(stockData)}
    - Categories recorded: ${JSON.stringify(categoryData)}
    - Category Revenues: ${JSON.stringify(revenueData)}`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
