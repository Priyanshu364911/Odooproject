import Category from '../models/Category.js';
import mongoose from 'mongoose';

/**
 * Create new category (Admin only)
 */
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      color,
      icon,
      settings
    } = req.body;

    // Check if category with same name or code already exists in company
    const existingCategory = await Category.findOne({
      $or: [
        { name: name, company: req.user.company },
        { code: code || name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10), company: req.user.company }
      ],
      isActive: true
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or code already exists'
      });
    }

    // Create category
    const category = new Category({
      name,
      description,
      code,
      color,
      icon,
      settings,
      company: req.user.company,
      createdBy: req.user.id
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

/**
 * Get company categories
 */
export const getCategories = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const categories = await Category.find({
      company: req.user.company,
      isActive: isActive !== 'false'
    })
    .populate('createdBy', 'firstName lastName')
    .sort('name');

    res.json({
      success: true,
      data: {
        categories,
        count: categories.length
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      company: req.user.company
    }).populate('createdBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

/**
 * Update category (Admin only)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findOne({
      _id: id,
      company: req.user.company
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if updated name/code conflicts with existing category
    if (updates.name || updates.code) {
      const conflictQuery = {
        _id: { $ne: id },
        company: req.user.company,
        isActive: true
      };

      if (updates.name) {
        conflictQuery.$or = [{ name: updates.name }];
      }
      if (updates.code) {
        conflictQuery.$or = conflictQuery.$or || [];
        conflictQuery.$or.push({ code: updates.code });
      }

      const conflicting = await Category.findOne(conflictQuery);
      if (conflicting) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name or code already exists'
        });
      }
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'settings') {
          category.settings = { ...category.settings, ...updates.settings };
        } else {
          category[key] = updates[key];
        }
      }
    });

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

/**
 * Delete category (Admin only) - Soft delete
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      company: req.user.company
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default category'
      });
    }

    // Check if category is being used by any expenses
    const expenseCount = await mongoose.model('Expense').countDocuments({
      category: id,
      isActive: true
    });

    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${expenseCount} expense(s)`
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};