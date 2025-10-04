import Joi from 'joi';

/**
 * Validation middleware wrapper
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    next();
  };
};

// Auth validation schemas
const signupSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  companyName: Joi.string().trim().min(2).max(100).required(),
  country: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().max(20).optional().allow(''),
  department: Joi.string().trim().max(100).optional().allow(''),
  position: Joi.string().trim().max(100).optional().allow('')
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().lowercase(),
  phone: Joi.string().trim().max(20).allow(''),
  department: Joi.string().trim().max(100).allow(''),
  position: Joi.string().trim().max(100).allow(''),
  preferences: Joi.object({
    currency: Joi.string().length(3),
    notifications: Joi.object({
      email: Joi.boolean(),
      expenseApproval: Joi.boolean(),
      statusUpdates: Joi.boolean()
    })
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

// User management validation schemas
const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'employee').default('employee'),
  manager: Joi.string().hex().length(24), // MongoDB ObjectId
  department: Joi.string().trim().max(100),
  position: Joi.string().trim().max(100)
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  role: Joi.string().valid('admin', 'manager', 'employee'),
  manager: Joi.string().hex().length(24).allow(null),
  department: Joi.string().trim().max(100),
  position: Joi.string().trim().max(100),
  isActive: Joi.boolean()
});

// Expense validation schemas
const createExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(1000),
  amount: Joi.number().positive().max(1000000).required(),
  currency: Joi.string().length(3).default('USD'),
  category: Joi.string().hex().length(24).required(),
  expenseDate: Joi.date().max('now').required(),
  merchant: Joi.object({
    name: Joi.string().trim().max(100),
    location: Joi.string().trim().max(200)
  }),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'company_card').default('credit_card'),
  tags: Joi.array().items(Joi.string().trim().max(50))
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(1000),
  amount: Joi.number().positive().max(1000000),
  currency: Joi.string().length(3),
  category: Joi.string().hex().length(24),
  expenseDate: Joi.date().max('now'),
  merchant: Joi.object({
    name: Joi.string().trim().max(100),
    location: Joi.string().trim().max(200)
  }),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'company_card'),
  tags: Joi.array().items(Joi.string().trim().max(50))
});

const approveExpenseSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  comments: Joi.string().trim().max(500)
});

// Category validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500),
  code: Joi.string().trim().uppercase().max(10),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  icon: Joi.string().trim().max(50).default('Receipt'),
  settings: Joi.object({
    requireApproval: Joi.boolean().default(true),
    maxAmount: Joi.number().positive(),
    requireReceipt: Joi.boolean().default(true)
  })
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  icon: Joi.string().trim().max(50),
  settings: Joi.object({
    requireApproval: Joi.boolean(),
    maxAmount: Joi.number().positive(),
    requireReceipt: Joi.boolean()
  }),
  isActive: Joi.boolean()
});

// Query parameter validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('createdAt', '-createdAt', 'amount', '-amount', 'expenseDate', '-expenseDate'),
  status: Joi.string().valid('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed'),
  category: Joi.string().hex().length(24),
  fromDate: Joi.date(),
  toDate: Joi.date(),
  search: Joi.string().trim().max(100)
});

// Export validation middlewares
export const validateSignup = validate(signupSchema);
export const validateLogin = validate(loginSchema);
export const validateUpdateProfile = validate(updateProfileSchema);
export const validateChangePassword = validate(changePasswordSchema);

export const validateCreateUser = validate(createUserSchema);
export const validateUpdateUser = validate(updateUserSchema);

export const validateCreateExpense = validate(createExpenseSchema);
export const validateUpdateExpense = validate(updateExpenseSchema);
export const validateApproveExpense = validate(approveExpenseSchema);

export const validateCreateCategory = validate(createCategorySchema);
export const validateUpdateCategory = validate(updateCategorySchema);

export const validatePagination = validate(paginationSchema, 'query');