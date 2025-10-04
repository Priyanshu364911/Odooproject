import mongoose from 'mongoose';

const approvalRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['percentage', 'specific_approver', 'hybrid'],
    required: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  specificApprovers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  conditions: {
    minAmount: Number,
    maxAmount: Number,
    categories: [String]
  }
});

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvalWorkflow: {
    enabled: {
      type: Boolean,
      default: true
    },
    levels: [{
      level: Number,
      name: String, // Manager, Finance, Director
      rules: [approvalRuleSchema]
    }]
  },
  settings: {
    requireReceiptForExpenses: {
      type: Boolean,
      default: true
    },
    autoApprovalLimit: {
      type: Number,
      default: 0
    },
    allowMultiCurrency: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
companySchema.index({ admin: 1 });
companySchema.index({ name: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;