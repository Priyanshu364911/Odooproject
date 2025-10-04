import Expense from '../models/Expense.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import axios from 'axios';

/**
 * Get exchange rate for currency conversion
 */
const getExchangeRate = async (from, to) => {
  if (from === to) return 1;
  
  try {
    // Use a simpler approach for exchange rates
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`
    );
    
    if (response.data.result === 'success') {
      return response.data.conversion_rate;
    }
    
    // Fallback to a basic rate if API fails
    console.warn('Exchange rate API returned error:', response.data);
    return 1;
  } catch (error) {
    console.warn('Exchange rate API error:', error.message);
    return 1;
  }
};

/**
 * Convert amount to company base currency
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
  return {
    amount: amount * exchangeRate,
    currency: toCurrency,
    exchangeRate,
    convertedAt: new Date()
  };
};

/**
 * Set up approval workflow for expense
 */
const setupApprovalWorkflow = async (expense, company) => {
  const approvals = [];
  
  if (company.approvalWorkflow?.enabled && company.approvalWorkflow.levels?.length > 0) {
    // Get user's manager and other approvers based on workflow levels
    const user = await User.findById(expense.submittedBy).populate('manager');
    
    for (const level of company.approvalWorkflow.levels) {
      let approvers = [];
      
      // Determine approvers based on rules
      for (const rule of level.rules) {
        if (rule.type === 'specific_approver' && rule.specificApprovers?.length > 0) {
          approvers = rule.specificApprovers;
        } else if (rule.type === 'percentage') {
          // For percentage rules, we need to get managers/finance team
          if (level.name === 'Manager' && user.manager) {
            approvers = [user.manager._id];
          } else if (level.name === 'Finance') {
            // Get users with finance/admin role
            const financeUsers = await User.find({
              company: company._id,
              role: { $in: ['admin'] },
              isActive: true
            }).limit(1);
            approvers = financeUsers.map(u => u._id);
          }
        }
      }
      
      // Add approvals for this level
      approvers.forEach(approverId => {
        approvals.push({
          approver: approverId,
          level: level.level,
          status: 'pending'
        });
      });
    }
  }
  
  return approvals;
};

/**
 * Create new expense
 */
export const createExpense = async (req, res) => {
  try {
    console.log('=== CREATE EXPENSE START ===');
    console.log('Received expense data:', req.body);
    console.log('Received files:', req.files?.length || 0);
    console.log('User:', req.user?.id);
    console.log('User company:', req.user?.company);

    const {
      title,
      description,
      amount,
      currency = 'USD',
      category,
      expenseDate,
      merchant,
      paymentMethod,
      tags
    } = req.body;

    // Basic validation
    if (!title || !amount || !category || !expenseDate) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, amount, category, expenseDate'
      });
    }

    console.log('Step 1: Basic validation passed');

    // Verify category exists and belongs to user's company
    console.log('Step 2: Checking category:', category);
    const categoryDoc = await Category.findOne({
      _id: category,
      company: req.user.company,
      isActive: true
    });

    if (!categoryDoc) {
      console.log('Category not found or inactive');
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive category'
      });
    }

    console.log('Step 3: Category found:', categoryDoc.name);

    // Get company details
    console.log('Step 4: Getting company details');
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      console.log('Company not found');
      return res.status(400).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.log('Step 5: Company found:', company.name);

    // Skip currency conversion for now to isolate issues
    console.log('Step 6: Generating expense number');
    
    // Generate expense number manually
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last expense number for this month
    const lastExpense = await Expense
      .findOne({
        company: req.user.company,
        expenseNumber: new RegExp(`^EXP-${year}${month}`)
      })
      .sort({ expenseNumber: -1 });
    
    let sequence = 1;
    if (lastExpense) {
      const lastSequence = parseInt(lastExpense.expenseNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const expenseNumber = `EXP-${year}${month}-${String(sequence).padStart(4, '0')}`;
    console.log('Generated expense number:', expenseNumber);

    console.log('Step 7: Creating expense object');

    // Create expense with generated expense number
    const expense = new Expense({
      expenseNumber,
      title,
      description: description || '',
      amount: parseFloat(amount),
      currency,
      convertedAmount: null, // Skip conversion for now
      category,
      expenseDate: new Date(expenseDate),
      submittedBy: req.user.id,
      company: req.user.company,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || 'credit_card',
      tags: tags || [],
      receipts: req.uploadedFiles || [],
      status: 'submitted',
      approvals: [], // Skip approval workflow for now
      currentApprovalLevel: 0
    });

    console.log('Step 8: Saving expense to database');
    await expense.save();

    console.log('Step 9: Expense saved successfully, ID:', expense._id);

    // Simple response without complex population
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        expense: {
          _id: expense._id,
          title: expense.title,
          amount: expense.amount,
          status: expense.status
        }
      }
    });

    console.log('=== CREATE EXPENSE SUCCESS ===');

  } catch (error) {
    console.error('=== CREATE EXPENSE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    res.status(500).json({
      success: false,
      message: 'Error creating expense',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get user's expenses with filtering and pagination
 */
export const getUserExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
      category,
      fromDate,
      toDate,
      search
    } = req.query;

    // Build query
    const query = {
      submittedBy: req.user.id,
      isActive: true
    };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (fromDate || toDate) {
      query.expenseDate = {};
      if (fromDate) query.expenseDate.$gte = new Date(fromDate);
      if (toDate) query.expenseDate.$lte = new Date(toDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .populate('category', 'name code color icon')
      .populate('approvals.approver', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: expenses.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get user expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      $or: [
        { submittedBy: req.user.id },
        { 'approvals.approver': req.user.id }
      ],
      isActive: true
    })
    .populate('category', 'name code color icon')
    .populate('submittedBy', 'firstName lastName email department')
    .populate('approvals.approver', 'firstName lastName email role');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        expense
      }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
      error: error.message
    });
  }
};

/**
 * Update expense (only if not approved)
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const expense = await Expense.findOne({
      _id: id,
      submittedBy: req.user.id,
      status: { $in: ['draft', 'rejected'] },
      isActive: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or cannot be modified'
      });
    }

    // Verify category if being updated
    if (updates.category) {
      const categoryDoc = await Category.findOne({
        _id: updates.category,
        company: req.user.company,
        isActive: true
      });

      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Handle currency conversion if amount or currency changed
    if (updates.amount || updates.currency) {
      const company = await Company.findById(req.user.company);
      const newCurrency = updates.currency || expense.currency;
      const newAmount = updates.amount || expense.amount;
      
      if (newCurrency !== company.currency) {
        expense.convertedAmount = await convertCurrency(newAmount, newCurrency, company.currency);
      } else {
        expense.convertedAmount = null;
      }
    }

    // Add new receipts if uploaded
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      expense.receipts.push(...req.uploadedFiles);
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'receipts') {
        expense[key] = updates[key];
      }
    });

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('category', 'name code color icon')
      .populate('submittedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        expense: updatedExpense
      }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
};

/**
 * Delete expense
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      submittedBy: req.user.id,
      status: { $in: ['draft', 'rejected'] },
      isActive: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or cannot be deleted'
      });
    }

    // Delete receipts from Cloudinary
    for (const receipt of expense.receipts) {
      try {
        await deleteFromCloudinary(receipt.publicId);
      } catch (error) {
        console.warn('Error deleting receipt from Cloudinary:', error.message);
      }
    }

    // Soft delete
    expense.isActive = false;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
};

/**
 * Get expenses pending approval for current user
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {
      'approvals.approver': req.user.id,
      'approvals.status': 'pending',
      isActive: true
    };

    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .populate('category', 'name code color icon')
      .populate('submittedBy', 'firstName lastName email department')
      .populate('approvals.approver', 'firstName lastName email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: expenses.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

/**
 * Approve or reject expense
 */
export const processApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;

    const expense = await Expense.findOne({
      _id: id,
      'approvals.approver': req.user.id,
      'approvals.status': 'pending',
      isActive: true
    }).populate('approvals.approver');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you are not authorized to approve'
      });
    }

    // Update the specific approval
    const approvalIndex = expense.approvals.findIndex(
      approval => 
        approval.approver._id.toString() === req.user.id.toString() && 
        approval.status === 'pending'
    );

    if (approvalIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No pending approval found for this user'
      });
    }

    expense.approvals[approvalIndex].status = action === 'approve' ? 'approved' : 'rejected';
    expense.approvals[approvalIndex].comments = comments;
    expense.approvals[approvalIndex].approvedAt = new Date();

    // Check if all approvals at current level are processed
    const currentLevelApprovals = expense.approvals.filter(
      approval => approval.level === expense.currentApprovalLevel
    );
    
    const currentLevelApproved = currentLevelApprovals.filter(
      approval => approval.status === 'approved'
    );
    
    const currentLevelRejected = currentLevelApprovals.filter(
      approval => approval.status === 'rejected'
    );

    // If rejected, mark expense as rejected
    if (action === 'reject') {
      expense.status = 'rejected';
    } 
    // If all current level approvals are approved, move to next level
    else if (currentLevelApproved.length === currentLevelApprovals.length) {
      const nextLevel = expense.currentApprovalLevel + 1;
      const nextLevelApprovals = expense.approvals.filter(
        approval => approval.level === nextLevel
      );
      
      if (nextLevelApprovals.length > 0) {
        expense.currentApprovalLevel = nextLevel;
      } else {
        expense.status = 'approved';
      }
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('category', 'name code color icon')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvals.approver', 'firstName lastName email role');

    res.json({
      success: true,
      message: `Expense ${action}d successfully`,
      data: {
        expense: updatedExpense
      }
    });

  } catch (error) {
    console.error('Process approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing approval',
      error: error.message
    });
  }
};

/**
 * Get expense statistics
 */
export const getExpenseStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
        break;
      case 'year':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1)
          }
        };
        break;
    }

    const baseQuery = {
      submittedBy: req.user.id,
      isActive: true,
      ...dateFilter
    };

    // Get statistics
    const [totalExpenses, pendingCount, approvedCount, rejectedCount, totalAmount] = await Promise.all([
      Expense.countDocuments(baseQuery),
      Expense.countDocuments({ ...baseQuery, status: 'pending_approval' }),
      Expense.countDocuments({ ...baseQuery, status: 'approved' }),
      Expense.countDocuments({ ...baseQuery, status: 'rejected' }),
      Expense.aggregate([
        { $match: { ...baseQuery, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get category breakdown
    const categoryStats = await Expense.aggregate([
      { $match: baseQuery },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 }, 
        amount: { $sum: '$amount' } 
      }},
      { $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }},
      { $unwind: '$category' },
      { $sort: { amount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          pendingApproval: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          totalAmount: totalAmount[0]?.total || 0
        },
        categoryBreakdown: categoryStats
      }
    });

  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense statistics',
      error: error.message
    });
  }
};