import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a product price'],
      default: 0.0,
    },
    category: {
      type: String,
      required: [true, 'Please add a product category'],
    },
    stockCount: {
      type: Number,
      required: [true, 'Please add product stock count'],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },
    // AI and Analytics Fields
    sentimentScore: {
      type: Number, // 0.0 - 5.0 based on AI review analysis
      default: 4.0,
    },
    demandForecast: {
      type: String, // AI prediction
      enum: ['High', 'Stable', 'Low'],
      default: 'Stable',
    },
    aiKeywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
