import express from 'express';
import {
  createUser,
  getCompanyUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getTeamMembers,
  getAvailableManagers,
  getUserStats
} from '../controllers/userController.js';
import { authenticate, requireAdmin, requireManagerOrAdmin } from '../middleware/auth.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/users
 * @desc    Create new user (Admin only)
 * @access  Private/Admin
 */
router.post('/', requireAdmin, validateCreateUser, createUser);

/**
 * @route   GET /api/users
 * @desc    Get company users (Admin/Manager)
 * @access  Private/Admin/Manager
 */
router.get('/', requireManagerOrAdmin, validatePagination, getCompanyUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/stats', requireAdmin, getUserStats);

/**
 * @route   GET /api/users/team
 * @desc    Get team members (for managers)
 * @access  Private/Manager
 */
router.get('/team', getTeamMembers);

/**
 * @route   GET /api/users/managers
 * @desc    Get available managers for assignment
 * @access  Private/Admin
 */
router.get('/managers', requireAdmin, getAvailableManagers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin/Manager
 */
router.get('/:id', requireManagerOrAdmin, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', requireAdmin, validateUpdateUser, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', requireAdmin, deactivateUser);

export default router;