import User from '../models/User.js';
import Company from '../models/Company.js';
import Category from '../models/Category.js';
import { generateToken, createTokenPayload } from '../utils/jwt.js';
import axios from 'axios';

/**
 * Get country currency from REST Countries API
 */
const getCountryCurrency = async (country) => {
  try {
    const response = await axios.get(`https://restcountries.com/v3.1/name/${country}?fields=currencies`);
    const currencies = response.data[0]?.currencies;
    if (currencies) {
      const currencyCode = Object.keys(currencies)[0];
      return currencyCode;
    }
  } catch (error) {
    console.warn('Could not fetch currency for country:', country);
  }
  return 'USD'; // Default to USD
};

/**
 * Create default expense categories for a company
 */
const createDefaultCategories = async (company, admin) => {
  const defaultCategories = [
    {
      name: 'Travel',
      description: 'Travel and accommodation expenses',
      code: 'TRAVEL',
      color: '#3B82F6',
      icon: 'Plane',
      isDefault: true
    },
    {
      name: 'Meals & Entertainment',
      description: 'Business meals and entertainment',
      code: 'MEALS',
      color: '#10B981',
      icon: 'Coffee',
      isDefault: true
    },
    {
      name: 'Office Supplies',
      description: 'Office equipment and supplies',
      code: 'SUPPLIES',
      color: '#8B5CF6',
      icon: 'Package',
      isDefault: true
    },
    {
      name: 'Transportation',
      description: 'Local transportation costs',
      code: 'TRANSPORT',
      color: '#F59E0B',
      icon: 'Car',
      isDefault: true
    },
    {
      name: 'Training',
      description: 'Training and education expenses',
      code: 'TRAINING',
      color: '#EF4444',
      icon: 'GraduationCap',
      isDefault: true
    },
    {
      name: 'Other',
      description: 'Miscellaneous expenses',
      code: 'OTHER',
      color: '#6B7280',
      icon: 'Receipt',
      isDefault: true
    }
  ];

  const categories = [];
  for (const categoryData of defaultCategories) {
    try {
      const category = new Category({
        ...categoryData,
        company: company._id,
        createdBy: admin._id
      });
      const savedCategory = await category.save();
      categories.push(savedCategory);
    } catch (error) {
      console.warn(`Could not create category ${categoryData.name}:`, error.message);
    }
  }

  return categories;
};

/**
 * Sign up new user and create company
 */
export const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      companyName,
      country
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Get currency for the country
    const currency = await getCountryCurrency(country);

    // Create company first
    const company = new Company({
      name: companyName,
      country,
      currency,
      admin: null, // Will be set after user creation
      approvalWorkflow: {
        enabled: true,
        levels: [
          {
            level: 1,
            name: 'Manager',
            rules: [{
              type: 'percentage',
              percentage: 100
            }]
          },
          {
            level: 2,
            name: 'Finance',
            rules: [{
              type: 'percentage',
              percentage: 100
            }]
          }
        ]
      }
    });

    // Create admin user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      company: null, // Will be set after company creation
      preferences: {
        currency
      }
    });

    // Save company temporarily without admin
    const savedCompany = await company.save();
    
    // Set company reference in user and save
    user.company = savedCompany._id;
    const savedUser = await user.save();

    // Update company with admin reference
    savedCompany.admin = savedUser._id;
    await savedCompany.save();

    // Create default categories
    await createDefaultCategories(savedCompany, savedUser);

    // Generate token
    const tokenPayload = createTokenPayload(savedUser);
    const token = generateToken(tokenPayload);

    // Populate company data for response
    const populatedUser = await User.findById(savedUser._id)
      .populate('company')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Company and admin user created successfully',
      data: {
        token,
        user: populatedUser,
        company: savedCompany
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with company populated
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).populate('company');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('company')
      .populate('manager', 'firstName lastName email')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      department,
      position,
      preferences
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (position) user.position = position;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    // Get updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .populate('company')
      .select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};