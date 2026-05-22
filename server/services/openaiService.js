import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

/**
 * Checks if OpenAI API key is missing or is the default dummy placeholder.
 */
const isApiKeyMissing = () => {
  const key = process.env.OPENAI_API_KEY;
  return !key || key.includes('your_openai_api_key') || key === 'dummy_key';
};

/**
 * Generates mock assets dynamically based on product details for offline/fallback mode.
 */
const generateMockProductAssets = (title, category, features = []) => {
  const featuresList = Array.isArray(features) ? features : [features];
  const featuresStr = featuresList.length > 0 ? featuresList.join(', ') : 'premium build and smart features';
  
  const description = `Experience the ultimate level of performance and design with the brand new ${title}. Meticulously crafted for users seeking quality in ${category || 'General'}, this product integrates high-end engineering with an intuitive user experience.\n\nFeaturing advanced ${featuresStr}, it is built to handle your everyday demands while offering long-lasting durability. Whether you are upgrading your setup or buying a gift, it stands as the ideal choice for modern living.\n\nEnjoy premium reliability, sleek aesthetics, and exceptional utility in one complete package. Elevate your standard and discover what makes it a customer favorite today.`;
  
  const defaultTags = [
    title.toLowerCase(),
    (category || 'General').toLowerCase(),
    'premium quality',
    'ecommerce',
    'smart choice'
  ];
  const featureTags = featuresList.map(f => f.toLowerCase().trim());
  const seoTags = [...new Set([...defaultTags, ...featureTags])].slice(0, 8);
  
  const marketingCaption = `✨ Meet the all-new ${title}! Designed with cutting-edge ${featuresStr} to elevate your lifestyle. Whether it's the premium durability or state-of-the-art aesthetics, we've got you covered. Upgrade yours today! 🚀🔥 #${category ? category.replace(/\s+/g, '') : 'SmartStore'} #PremiumQuality #MustHave`;

  return {
    description,
    seoTags,
    marketingCaption,
  };
};

/**
 * Main copywriting asset generator service.
 * @param {string} title - Product title
 * @param {string} category - Product category
 * @param {Array<string>} features - Key features list
 * @returns {Promise<{description: string, seoTags: Array<string>, marketingCaption: string}>}
 */
export const generateProductAssets = async (title, category, features = []) => {
  if (isApiKeyMissing()) {
    console.log('OpenAI API Key is missing. Using local heuristics engine for mock asset generation.');
    return generateMockProductAssets(title, category, features);
  }

  const systemPrompt = `You are an expert ecommerce copywriter and SEO specialist.
Given a product's title, category, and key features, generate:
1. A compelling, high-converting product description (2-3 paragraphs).
2. A list of 5-8 relevant, search-optimized SEO tags.
3. A catchy, engaging marketing caption suitable for social media or promotional campaigns.

You MUST return a JSON object with EXACTLY this structure:
{
  "description": "Compelling product description text...",
  "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "marketingCaption": "Catchy marketing caption here!"
}`;

  const userPrompt = `Product Details:
  - Title: ${title}
  - Category: ${category}
  - Key Features: ${Array.isArray(features) ? features.join(', ') : features}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      description: result.description || '',
      seoTags: Array.isArray(result.seoTags) ? result.seoTags : [],
      marketingCaption: result.marketingCaption || '',
    };
  } catch (error) {
    console.error('Error contacting OpenAI. Falling back to local mock generator:', error.message);
    return generateMockProductAssets(title, category, features);
  }
};
