import axios, { AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  company: {
    _id: string;
    name: string;
    currency: string;
  };
  manager?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  department?: string;
  position?: string;
  isActive: boolean;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  code: string;
  color: string;
  icon: string;
  isDefault: boolean;
  settings: {
    requireApproval: boolean;
    maxAmount?: number;
    requireReceipt: boolean;
  };
  isActive: boolean;
  company: string;
  createdBy: string;
}

export interface Expense {
  _id: string;
  expenseNumber: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  convertedAmount?: {
    amount: number;
    currency: string;
    exchangeRate: number;
    convertedAt: Date;
  };
  category: Category;
  expenseDate: Date;
  submittedBy: User;
  company: string;
  receipts: Array<{
    url: string;
    publicId: string;
    filename: string;
    size: number;
    mimetype: string;
  }>;
  status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'reimbursed';
  approvals: Array<{
    approver: User;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    approvedAt?: Date;
    level: number;
  }>;
  currentApprovalLevel: number;
  tags?: string[];
  merchant?: {
    name: string;
    location: string;
  };
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'company_card';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category: string;
  expenseDate: Date | string;
  merchant?: {
    name: string;
    location: string;
  };
  paymentMethod?: string;
  tags?: string[];
}

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<{ success: boolean; data: { categories: Category[] } }> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: { category: Category } }> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: Partial<Category>): Promise<{ success: boolean; data: { category: Category } }> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Category>): Promise<{ success: boolean; data: { category: Category } }> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Expenses API
export const expensesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    status?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    data: {
      expenses: Expense[];
      pagination: {
        current: number;
        total: number;
        count: number;
        totalCount: number;
      };
    };
  }> => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: { expense: Expense } }> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseRequest, receipts?: File[]): Promise<{ success: boolean; data: { expense: Expense } }> => {
    const formData = new FormData();
    
    // Add expense data
    Object.keys(data).forEach(key => {
      const value = data[key as keyof CreateExpenseRequest];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add receipts
    if (receipts && receipts.length > 0) {
      receipts.forEach(file => {
        formData.append('receipts', file);
      });
    }

    const response = await api.post('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateExpenseRequest>, receipts?: File[]): Promise<{ success: boolean; data: { expense: Expense } }> => {
    const formData = new FormData();
    
    // Add expense data
    Object.keys(data).forEach(key => {
      const value = data[key as keyof CreateExpenseRequest];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add receipts
    if (receipts && receipts.length > 0) {
      receipts.forEach(file => {
        formData.append('receipts', file);
      });
    }

    const response = await api.put(`/expenses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getPendingApprovals: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{
    success: boolean;
    data: {
      expenses: Expense[];
      pagination: {
        current: number;
        total: number;
        count: number;
        totalCount: number;
      };
    };
  }> => {
    const response = await api.get('/expenses/approvals', { params });
    return response.data;
  },

  processApproval: async (id: string, data: { action: 'approve' | 'reject'; comments?: string }): Promise<{ success: boolean; data: { expense: Expense } }> => {
    const response = await api.post(`/expenses/${id}/approve`, data);
    return response.data;
  },

  getStats: async (params?: { period?: 'week' | 'month' | 'year' }): Promise<{
    success: boolean;
    data: {
      summary: {
        totalExpenses: number;
        pendingApproval: number;
        approved: number;
        rejected: number;
        totalAmount: number;
      };
      categoryBreakdown: Array<{
        _id: string;
        count: number;
        amount: number;
        category: Category;
      }>;
    };
  }> => {
    const response = await api.get('/expenses/stats', { params });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    role?: string;
    department?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    data: {
      users: User[];
      pagination: {
        current: number;
        total: number;
        count: number;
        totalCount: number;
      };
    };
  }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    manager?: string;
    department?: string;
    position?: string;
  }): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getTeamMembers: async (): Promise<{ success: boolean; data: { teamMembers: User[]; count: number } }> => {
    const response = await api.get('/users/team');
    return response.data;
  },

  getManagers: async (): Promise<{ success: boolean; data: { managers: User[] } }> => {
    const response = await api.get('/users/managers');
    return response.data;
  },

  getStats: async (): Promise<{
    success: boolean;
    data: {
      summary: {
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
      };
      roleDistribution: {
        admin: number;
        manager: number;
        employee: number;
      };
      departmentBreakdown: Array<{
        _id: string;
        count: number;
      }>;
    };
  }> => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

export default api;