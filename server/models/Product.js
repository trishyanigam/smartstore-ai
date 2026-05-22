import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a product title'],
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
    stock: {
      type: Number,
      required: [true, 'Please add product stock count'],
      default: 0,
    },
    stockCount: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
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

// Pre-validate hook to automatically sync name/title and stockCount/stock for backward compatibility
productSchema.pre('validate', function () {
  if (this.title && !this.name) {
    this.name = this.title;
  } else if (this.name && !this.title) {
    this.title = this.name;
  }

  if (this.stock !== undefined && (this.stockCount === undefined || this.stockCount === 0)) {
    this.stockCount = this.stock;
  } else if (this.stockCount !== undefined && (this.stock === undefined || this.stock === 0)) {
    this.stock = this.stockCount;
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
