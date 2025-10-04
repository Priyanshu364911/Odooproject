# Expense Management System 💼

A modern, automated expense management solution that streamlines reimbursement processes with intelligent approval workflows and OCR receipt scanning.


## 🚀 Overview

Companies often struggle with **manual expense reimbursement processes** that are time-consuming, error-prone, and lack transparency. Our solution provides:

- **Automated approval workflows** with multi-level sequencing
- **Flexible conditional rules** for smart approvals
- **OCR receipt scanning** for effortless expense submission
- **Multi-currency support** with real-time conversions
- **Role-based access control** for secure operations

## ✨ Features

### 🔐 Authentication & User Management
- **Auto-company creation** on first signup with country-based currency
- **Role-based access** (Admin, Manager, Employee)
- **Manager-employee relationships** for approval chains

### 💰 Expense Submission
- **Multi-currency expense claims**
- **Category-based organization**
- **Real-time status tracking**
- **Receipt upload with OCR** (auto-fill expense details)

### 📊 Approval Workflows
- **Sequential multi-level approvals** (Manager → Finance → Director)
- **Conditional approval rules**:
  - Percentage-based (60% of approvers)
  - Specific approver rules (CFO auto-approval)
  - Hybrid combinations
- **Flexible rule engine** supporting complex scenarios

### 👥 Role-Based Permissions
| Role | Capabilities |
|------|-------------|
| **Admin** | Company setup, user management, rule configuration, override approvals |
| **Manager** | Team expense approval, visibility in company currency, escalation |
| **Employee** | Expense submission, personal history, status tracking |

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation
- **Tesseract.js** for OCR processing

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Joi** for validation

### External APIs
- **Currency Data**: `restcountries.com`
- **Exchange Rates**: `exchangerate-api.com`
- **Cloud Storage**: AWS S3 (for receipt storage)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Priyanshu364911/Odooproject.git
cd Odooproject
```

2. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

3. **Frontend Setup**
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Environment Setup

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/expense-management
JWT_SECRET=your-jwt-secret
CLOUDINARY_URL=your-cloudinary-url
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Expense Management
```

## 📁 Project Structure

```
expense-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # Auth and app contexts
│   │   ├── utils/         # Helper functions
│   │   └── types/         # TypeScript definitions
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── package.json
├── shared/                # Shared types and utilities
└── README.md
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Company and admin creation
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user

### Expense Endpoints
- `POST /api/expenses` - Submit new expense
- `GET /api/expenses` - Get user's expenses
- `GET /api/expenses/approvals` - Get pending approvals
- `PUT /api/expenses/:id/approve` - Approve/reject expense

### User Management
- `POST /api/users` - Create users (Admin only)
- `GET /api/users/team` - Get team members

[View Full API Documentation](./API_DOCUMENTATION.md)

## 🎨 UI/UX Design

### Design System
- **Colors**: White background, green accents, deep black text
- **Typography**: Inter font family
- **Components**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React icon library

### Key Screens
- **Dashboard**: Expense overview and quick actions
- **Expense Submission**: Form with OCR receipt upload
- **Approval Center**: Pending requests with bulk actions
- **Admin Panel**: User management and rule configuration

## 🚢 Deployment

### Production Build
```bash
# Build both client and server
npm run build

# Start production server
npm start
```

### Docker Deployment
```dockerfile
# Use provided Dockerfile
docker-compose up --build
```

### Environment-specific Configs
- **Development**: Hot-reload, debug tools
- **Staging**: Pre-production testing
- **Production**: Optimized builds, CDN assets


### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- OCR technology powered by Tesseract.js
- Currency data from RestCountries API
- Exchange rates from ExchangeRate-API
- Icons by Lucide React

---
