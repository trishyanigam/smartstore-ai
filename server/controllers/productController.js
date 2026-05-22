import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const keyword = req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: 'i' } },
            { name: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : {};

    const products = await Product.find({ ...keyword });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  const { title, name, price, description, imageUrl, category, stock, stockCount, sales, sentimentScore, demandForecast, aiKeywords } = req.body;

  try {
    const product = new Product({
      title: title || name || 'Sample Product',
      name: name || title || 'Sample Product',
      price: price !== undefined ? price : 0.0,
      description: description || 'Sample Description',
      imageUrl: imageUrl || 'https://via.placeholder.com/150',
      category: category || 'General',
      stock: stock !== undefined ? stock : (stockCount !== undefined ? stockCount : 0),
      stockCount: stockCount !== undefined ? stockCount : (stock !== undefined ? stock : 0),
      sales: sales !== undefined ? sales : 0,
      sentimentScore: sentimentScore || 4.0,
      demandForecast: demandForecast || 'Stable',
      aiKeywords: aiKeywords || [],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  const { title, name, price, description, imageUrl, category, stock, stockCount, sales, sentimentScore, demandForecast, aiKeywords } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = title || name || product.title;
      product.name = name || title || product.name;
      product.price = price !== undefined ? price : product.price;
      product.description = description || product.description;
      product.imageUrl = imageUrl || product.imageUrl;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : (stockCount !== undefined ? stockCount : product.stock);
      product.stockCount = stockCount !== undefined ? stockCount : (stock !== undefined ? stock : product.stockCount);
      product.sales = sales !== undefined ? sales : product.sales;
      product.sentimentScore = sentimentScore !== undefined ? sentimentScore : product.sentimentScore;
      product.demandForecast = demandForecast || product.demandForecast;
      product.aiKeywords = aiKeywords || product.aiKeywords;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};
