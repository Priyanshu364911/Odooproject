import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  validateCreateCategory,
  validateUpdateCategory
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/categories
 * @desc    Create new category (Admin only)
 * @access  Private/Admin
 */
router.post('/', requireAdmin, validateCreateCategory, createCategory);

/**
 * @route   GET /api/categories
 * @desc    Get company categories
 * @access  Private
 */
router.get('/', getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get('/:id', getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', requireAdmin, validateUpdateCategory, updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', requireAdmin, deleteCategory);

export default router;