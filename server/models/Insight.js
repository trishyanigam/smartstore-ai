import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Inventory', 'Sales', 'Marketing', 'Customer'],
      default: 'Sales',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    actionableSteps: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Insight = mongoose.model('Insight', insightSchema);

export default Insight;
