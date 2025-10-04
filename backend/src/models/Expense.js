import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  filename: String,
  size: Number,
  mimetype: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const approvalSchema = new mongoose.Schema({
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  comments: String,
  approvedAt: Date,
  level: {
    type: Number,
    required: true
  }
});

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  // Amount converted to company's base currency
  convertedAmount: {
    amount: Number,
    currency: String,
    exchangeRate: Number,
    convertedAt: Date
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  receipts: [receiptSchema],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed'],
    default: 'draft'
  },
  approvals: [approvalSchema],
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  tags: [String],
  merchant: {
    name: String,
    location: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'company_card'],
    default: 'credit_card'
  },
  reimbursement: {
    status: {
      type: String,
      enum: ['pending', 'processed', 'completed'],
      default: 'pending'
    },
    method: String,
    referenceNumber: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    ocrProcessed: {
      type: Boolean,
      default: false
    },
    ocrData: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ submittedBy: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ expenseNumber: 1 });

// Compound indexes
expenseSchema.index({ company: 1, submittedBy: 1, status: 1 });
expenseSchema.index({ company: 1, expenseDate: -1 });

// Pre-save middleware to generate expense number
expenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last expense number for this month
    const lastExpense = await mongoose.model('Expense')
      .findOne({
        company: this.company,
        expenseNumber: new RegExp(`^EXP-${year}${month}`)
      })
      .sort({ expenseNumber: -1 });
    
    let sequence = 1;
    if (lastExpense) {
      const lastSequence = parseInt(lastExpense.expenseNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.expenseNumber = `EXP-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Virtual for total receipt files
expenseSchema.virtual('receiptCount').get(function() {
  return this.receipts ? this.receipts.length : 0;
});

// Virtual for approval progress
expenseSchema.virtual('approvalProgress').get(function() {
  if (!this.approvals || this.approvals.length === 0) return 0;
  
  const approvedCount = this.approvals.filter(approval => approval.status === 'approved').length;
  return Math.round((approvedCount / this.approvals.length) * 100);
});

// Method to check if expense can be approved by a user
expenseSchema.methods.canApprove = function(userId, userRole) {
  // Admin can approve any expense
  if (userRole === 'admin') return true;
  
  // Check if user is in the current approval level
  const currentLevelApproval = this.approvals.find(
    approval => approval.level === this.currentApprovalLevel && 
    approval.approver.toString() === userId.toString()
  );
  
  return currentLevelApproval && currentLevelApproval.status === 'pending';
};

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;