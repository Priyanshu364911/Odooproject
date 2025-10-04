import express from 'express';
import {
  createExpense,
  getUserExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getPendingApprovals,
  processApproval,
  getExpenseStats
} from '../controllers/expenseController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadReceipts } from '../middleware/upload.js';
import {
  validateCreateExpense,
  validateUpdateExpense,
  validateApproveExpense,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/expenses
 * @desc    Create new expense
 * @access  Private
 */
router.post('/', uploadReceipts, validateCreateExpense, createExpense);

/**
 * @route   GET /api/expenses
 * @desc    Get user's expenses with filtering and pagination
 * @access  Private
 */
router.get('/', validatePagination, getUserExpenses);

/**
 * @route   GET /api/expenses/stats
 * @desc    Get expense statistics
 * @access  Private
 */
router.get('/stats', getExpenseStats);

/**
 * @route   GET /api/expenses/approvals
 * @desc    Get expenses pending approval for current user
 * @access  Private
 */
router.get('/approvals', validatePagination, getPendingApprovals);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', getExpenseById);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense (only if not approved)
 * @access  Private
 */
router.put('/:id', uploadReceipts, validateUpdateExpense, updateExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Private
 */
router.delete('/:id', deleteExpense);

/**
 * @route   POST /api/expenses/:id/approve
 * @desc    Approve or reject expense
 * @access  Private
 */
router.post('/:id/approve', validateApproveExpense, processApproval);

export default router;