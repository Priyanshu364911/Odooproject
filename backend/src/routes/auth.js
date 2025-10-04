import express from 'express';
import { 
  signup, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateSignup, validateLogin, validateUpdateProfile, validateChangePassword } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user and create company
 * @access  Public
 */
router.post('/signup', validateSignup, signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateUpdateProfile, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validateChangePassword, changePassword);

export default router;