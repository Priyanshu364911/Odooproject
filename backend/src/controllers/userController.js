import User from '../models/User.js';
import Company from '../models/Company.js';
import Category from '../models/Category.js';

/**
 * Create new user (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'employee',
      manager,
      department,
      position
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Verify manager exists if provided
    if (manager) {
      const managerDoc = await User.findOne({
        _id: manager,
        company: req.user.company,
        role: { $in: ['admin', 'manager'] },
        isActive: true
      });

      if (!managerDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager selected'
        });
      }
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      company: req.user.company,
      manager,
      department,
      position,
      preferences: {
        currency: req.user.company.currency
      }
    });

    await user.save();

    // Get user with populated fields for response
    const populatedUser = await User.findById(user._id)
      .populate('company', 'name currency')
      .populate('manager', 'firstName lastName email')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: populatedUser
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

/**
 * Get company users (Admin/Manager)
 */
export const getCompanyUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'firstName',
      role,
      department,
      search,
      isActive = true
    } = req.query;

    // Build query
    const query = {
      company: req.user.company,
      isActive: isActive !== 'false'
    };

    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Managers can only see their team members (unless they're also admin)
    if (req.user.role === 'manager' && !req.user.role.includes('admin')) {
      query.$or = [
        { _id: req.user.id }, // Include themselves
        { manager: req.user.id } // Include their team members
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .populate('manager', 'firstName lastName email')
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: users.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id, company: req.user.company };

    // Managers can only see their team members (unless they're admin)
    if (req.user.role === 'manager') {
      query = {
        _id: id,
        company: req.user.company,
        $or: [
          { _id: req.user.id }, // Themselves
          { manager: req.user.id } // Their team members
        ]
      };
    }

    const user = await User.findOne(query)
      .populate('company', 'name currency')
      .populate('manager', 'firstName lastName email role')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findOne({
      _id: id,
      company: req.user.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow updating own role unless super admin
    if (user._id.toString() === req.user.id.toString() && updates.role) {
      delete updates.role;
    }

    // Verify manager if being updated
    if (updates.manager) {
      const managerDoc = await User.findOne({
        _id: updates.manager,
        company: req.user.company,
        role: { $in: ['admin', 'manager'] },
        isActive: true
      });

      if (!managerDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager selected'
        });
      }
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();

    // Get updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .populate('company', 'name currency')
      .populate('manager', 'firstName lastName email')
      .select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Deactivate user (Admin only)
 */
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      company: req.user.company
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating self
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

/**
 * Get team members (for managers)
 */
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await User.find({
      manager: req.user.id,
      company: req.user.company,
      isActive: true
    })
    .select('firstName lastName email role department position lastLogin')
    .sort('firstName lastName');

    res.json({
      success: true,
      data: {
        teamMembers,
        count: teamMembers.length
      }
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
};

/**
 * Get available managers for assignment
 */
export const getAvailableManagers = async (req, res) => {
  try {
    const managers = await User.find({
      company: req.user.company,
      role: { $in: ['admin', 'manager'] },
      isActive: true
    })
    .select('firstName lastName email role department')
    .sort('firstName lastName');

    res.json({
      success: true,
      data: {
        managers
      }
    });

  } catch (error) {
    console.error('Get available managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching managers',
      error: error.message
    });
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminCount,
      managerCount,
      employeeCount,
      departmentStats
    ] = await Promise.all([
      User.countDocuments({ company: req.user.company }),
      User.countDocuments({ company: req.user.company, isActive: true }),
      User.countDocuments({ company: req.user.company, role: 'admin', isActive: true }),
      User.countDocuments({ company: req.user.company, role: 'manager', isActive: true }),
      User.countDocuments({ company: req.user.company, role: 'employee', isActive: true }),
      User.aggregate([
        { $match: { company: req.user.company._id, isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers
        },
        roleDistribution: {
          admin: adminCount,
          manager: managerCount,
          employee: employeeCount
        },
        departmentBreakdown: departmentStats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};