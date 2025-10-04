# Expense Management Platform - Setup Guide

This guide will help you set up and run the complete expense management platform with both frontend and backend.

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from https://nodejs.org/
   - Verify installation: `node --version`

2. **MongoDB** (Community Edition)
   - Download from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud version)
   - Verify installation: `mongod --version`

3. **Git** (optional, for version control)
   - Download from https://git-scm.com/

## Project Structure

```
odoohack/
├── frontend/          # React + TypeScript frontend
├── backend/           # Node.js + Express backend
├── README.md         # Original project documentation
└── SETUP_GUIDE.md    # This setup guide
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
The backend uses a `.env` file for configuration. Update the following variables in `backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration - Update this to your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/expense-management

# JWT Configuration - Change this to a secure secret in production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# External APIs (Optional)
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
EXCHANGE_RATE_BASE_URL=https://v6.exchangerate-api.com/v6

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# Start MongoDB as a service, or manually run:
mongod
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
# Or manually run:
mongod
```

### 5. Start Backend Server
```bash
npm run dev
```

The backend should now be running on http://localhost:3000

You should see output similar to:
```
🚀 Expense Management API Server
📍 Environment: development
🌐 Port: 3000
🔗 URL: http://localhost:3000
📚 Health Check: http://localhost:3000/health
```

### 6. Test Backend API
Open http://localhost:3000/health in your browser. You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd ../frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
The frontend uses a `.env` file. The configuration is already set in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=ExpenseFlow
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

The frontend should now be running on http://localhost:5173

## Testing the Application

### 1. Access the Application
Open your browser and go to http://localhost:5173

### 2. Create Your First Account
Since this is the first time running the application:

1. You'll be redirected to the login page
2. Click on "Sign up" (you'll need to create this link or go directly to signup)
3. Fill in the signup form with:
   - First Name: Your first name
   - Last Name: Your last name  
   - Email: your.email@example.com
   - Password: (minimum 6 characters)
   - Company Name: Your company name
   - Country: Select your country

4. Click "Sign Up"

This will:
- Create your user account as an admin
- Create your company
- Set up default expense categories
- Log you in automatically
- Redirect you to the dashboard

### 3. Explore the Features

**Dashboard:**
- View expense statistics
- Quick actions for submitting expenses
- Recent expenses list

**Submit New Expense:**
- Go to `/expenses/new`
- Fill out expense details
- Upload receipt images (if Cloudinary is configured)
- Submit for approval

**View Expenses:**
- Go to `/expenses`
- See all your submitted expenses
- Filter by status, category, date range

**Approvals (for managers/admins):**
- Go to `/approvals`  
- Review and approve/reject team expenses

**Profile:**
- Go to `/profile`
- Update your profile information
- Change password

## API Endpoints

The backend provides the following main API endpoints:

### Authentication
- `POST /api/auth/signup` - Create account and company
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile

### Expenses  
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get user's expenses
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/approve` - Approve/reject expense

### Users (Admin only)
- `POST /api/users` - Create new user
- `GET /api/users` - Get company users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Categories
- `GET /api/categories` - Get expense categories
- `POST /api/categories` - Create category (Admin only)

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
- Make sure MongoDB is installed and running
- Check if the connection string in `.env` is correct

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change the PORT in `.env` to a different value (e.g., 3001)
- Or stop the process using port 3000

### Frontend Issues

**API Connection Error:**
- Make sure the backend is running on http://localhost:3000
- Check the `VITE_API_BASE_URL` in frontend `.env`

**CORS Error:**
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Common Issues

**Authentication Not Working:**
- Check if JWT_SECRET is set in backend `.env`
- Clear browser localStorage and try again

**File Upload Not Working:**
- File uploads require Cloudinary configuration
- You can still create expenses without receipts

## Production Deployment

For production deployment:

1. Update environment variables for production
2. Use a production MongoDB database
3. Configure Cloudinary for file uploads
4. Set up proper HTTPS certificates
5. Use PM2 or similar for backend process management
6. Build frontend for production: `npm run build`
7. Serve frontend build files with a web server (Nginx, Apache)

## Support

If you encounter any issues:

1. Check the console logs in both backend and frontend
2. Verify all environment variables are set correctly
3. Make sure all dependencies are installed
4. Ensure MongoDB is running and accessible

## Features Overview

This expense management platform includes:

✅ **User Authentication & Authorization**
- JWT-based authentication
- Role-based access (Admin, Manager, Employee)
- Company-based multi-tenancy

✅ **Expense Management**
- Create, read, update, delete expenses
- File upload for receipts (with Cloudinary)
- Multi-currency support with conversion
- Automatic expense numbering

✅ **Approval Workflows**
- Multi-level approval system
- Manager → Finance → Director approval chain
- Conditional approval rules
- Comments and audit trail

✅ **User Management**
- Admin can create and manage users
- Manager-employee relationships
- Team member visibility

✅ **Categories & Organization**
- Predefined expense categories
- Custom category creation (Admin)
- Category-based filtering and reporting

✅ **Dashboard & Reporting**
- Expense statistics and summaries
- Status tracking
- Category breakdown

The platform is built with modern technologies:
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB, JWT
- **File Storage:** Cloudinary integration
- **Security:** Helmet, CORS, rate limiting, input validation