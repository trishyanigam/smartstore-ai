import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Insight from './models/Insight.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Insight.deleteMany();

    console.log('Database cleared.');

    // 1. Create Users (Pre-save in User model handles hashing, but we can also pass plain text here)
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@smartstore.com',
        password: 'admin123', // Automatically encrypted by User model's pre-save middleware
        role: 'admin',
      },
      {
        name: 'John Doe',
        email: 'john@gmail.com',
        password: 'customer123', // Automatically encrypted by User model's pre-save middleware
        role: 'customer',
      },
    ]);

    const adminUser = users[0];
    const customerUser = users[1];

    console.log('Users seeded.');

    // 2. Create Products
    const products = await Product.insertMany([
      {
        name: 'Wireless Noise-Cancelling Headphones',
        price: 199.99,
        description:
          'High-fidelity audio with active noise-cancellation and 40-hour battery life.',
        category: 'Electronics',
        stockCount: 15,
        sentimentScore: 4.8,
        demandForecast: 'High',
        aiKeywords: ['premium', 'noise-cancelling', 'long-battery'],
      },
      {
        name: 'Ergonomic Office Chair',
        price: 349.5,
        description:
          'Adjustable lumbar support, 3D armrests, and breathable mesh back.',
        category: 'Office',
        stockCount: 4, // Trigger low stock alert!
        sentimentScore: 4.2,
        demandForecast: 'Stable',
        aiKeywords: ['ergonomic', 'office', 'comfortable'],
      },
      {
        name: 'Smart Fitness Tracker Watch',
        price: 89.99,
        description:
          'Real-time heart rate monitoring, sleep tracking, and built-in GPS.',
        category: 'Electronics',
        stockCount: 50,
        sentimentScore: 4.5,
        demandForecast: 'High',
        aiKeywords: ['fitness', 'smartwatch', 'tracking'],
      },
      {
        name: 'Stainless Steel Water Bottle',
        price: 24.95,
        description:
          'Vacuum insulated, keeps drinks cold for 24 hours or hot for 12 hours.',
        category: 'Home & Living',
        stockCount: 8, // Trigger low stock alert!
        sentimentScore: 4.6,
        demandForecast: 'Stable',
        aiKeywords: ['eco-friendly', 'insulated', 'durable'],
      },
      {
        name: 'Premium Leather Wallet',
        price: 45.0,
        description:
          'Minimalist bi-fold wallet made from full-grain leather with RFID blocking.',
        category: 'Accessories',
        stockCount: 25,
        sentimentScore: 4.0,
        demandForecast: 'Low',
        aiKeywords: ['leather', 'minimalist', 'rfid-blocking'],
      },
    ]);

    console.log('Products seeded.');

    // 3. Create Orders spanning past few months to generate active charts
    const orders = await Order.insertMany([
      {
        user: customerUser._id,
        orderItems: [
          {
            name: products[0].name,
            qty: 1,
            price: products[0].price,
            product: products[0]._id,
          },
          {
            name: products[4].name,
            qty: 2,
            price: products[4].price,
            product: products[4]._id,
          },
        ],
        totalPrice: products[0].price + products[4].price * 2,
        isPaid: true,
        paidAt: new Date('2026-02-15T14:30:00Z'),
        status: 'Delivered',
      },
      {
        user: customerUser._id,
        orderItems: [
          {
            name: products[1].name,
            qty: 1,
            price: products[1].price,
            product: products[1]._id,
          },
        ],
        totalPrice: products[1].price,
        isPaid: true,
        paidAt: new Date('2026-03-10T10:15:00Z'),
        status: 'Delivered',
      },
      {
        user: customerUser._id,
        orderItems: [
          {
            name: products[2].name,
            qty: 3,
            price: products[2].price,
            product: products[2]._id,
          },
          {
            name: products[3].name,
            qty: 1,
            price: products[3].price,
            product: products[3]._id,
          },
        ],
        totalPrice: products[2].price * 3 + products[3].price,
        isPaid: true,
        paidAt: new Date('2026-04-20T18:45:00Z'),
        status: 'Delivered',
      },
      {
        user: customerUser._id,
        orderItems: [
          {
            name: products[0].name,
            qty: 2,
            price: products[0].price,
            product: products[0]._id,
          },
        ],
        totalPrice: products[0].price * 2,
        isPaid: true,
        paidAt: new Date('2026-05-18T16:00:00Z'),
        status: 'Processing',
      },
    ]);

    console.log('Orders seeded.');

    // 4. Create initial AI Insights
    await Insight.insertMany([
      {
        title: 'Restock Action Required: Ergonomic Chairs',
        description:
          'Ergonomic Office Chair inventory has fallen to 4 units. Sales velocity has increased by 15% this month, creating high risk of out-of-stock within 5 days.',
        category: 'Inventory',
        severity: 'High',
        actionableSteps: [
          'Order at least 20 units from Supplier A',
          'Temporarily disable active promo campaigns for this SKU',
        ],
      },
      {
        title: 'Q2 Revenue Forecasting Surge',
        description:
          'Based on Q1 transaction history and trends, SmartStore is projected to increase monthly revenue by 24% entering the summer quarter.',
        category: 'Sales',
        severity: 'Medium',
        actionableSteps: [
          'Deploy summer collection marketing campaigns',
          'Initiate cart abandonment recovery automation',
        ],
      },
    ]);

    console.log('AI Insights seeded.');

    console.log('Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Insight.deleteMany();

    console.log('Data Cleared Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with data destruction: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
