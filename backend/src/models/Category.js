import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: 'Receipt'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  settings: {
    requireApproval: {
      type: Boolean,
      default: true
    },
    maxAmount: {
      type: Number,
      min: 0
    },
    requireReceipt: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique category code per company
categorySchema.index({ company: 1, code: 1 }, { unique: true });
categorySchema.index({ company: 1, isActive: 1 });

// Pre-save middleware to generate category code if not provided
categorySchema.pre('save', function(next) {
  if (!this.code && this.name) {
    // Generate code from name (e.g., "Travel Expenses" -> "TRAVEL_EXP")
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 10);
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;