# GaramDoodh Backend API

A comprehensive backend API for GaramDoodh - Fresh Boiled Milk Delivery service built with Node.js, Express, MongoDB, and Razorpay payment integration.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with role-based access
- **Product Management** - CRUD operations for milk products
- **Order Management** - Complete order lifecycle management
- **Payment Gateway** - Razorpay integration for online payments
- **Admin Dashboard** - Analytics and management tools
- **Customer Types** - Support for college students and outsiders
- **Hostel Management** - College hostel delivery system
- **Email Notifications** - Order confirmations and updates
- **Security** - Helmet, CORS, rate limiting, input validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Razorpay account for payments
- Gmail account for email notifications

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd garamdoodh-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/garamdoodh

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # Razorpay Configuration
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Frontend URL
   FRONTEND_URL=http://localhost:5500

   # Admin Configuration
   ADMIN_EMAIL=admin@garamdoodh.com
   ADMIN_PASSWORD=admin123
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Initialize Admin User**
   ```bash
   # Make a POST request to initialize admin
   curl -X POST http://localhost:3000/api/admin/init
   ```

6. **Seed Products**
   ```bash
   node seeders/productSeeder.js
   ```

7. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/admin/:id/status` - Update order status (Admin)

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/cod-confirm` - Confirm COD order
- `GET /api/payments/razorpay-key` - Get Razorpay key

### Admin
- `POST /api/admin/init` - Initialize admin user
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/analytics` - Get analytics data

## 🔧 Razorpay Setup

1. **Create Razorpay Account**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Sign up and complete KYC

2. **Get API Keys**
   - Go to Settings > API Keys
   - Copy Key ID and Key Secret
   - Add to your `.env` file

3. **Test Mode**
   - Use test keys for development
   - Switch to live keys for production

## 📧 Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. **Use App Password** in `EMAIL_PASS` environment variable

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  role: String (customer/admin),
  customerType: String (college/outsider),
  hostel: String (for college students),
  address: Object,
  isActive: Boolean
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  quantity: String (100ml, 250ml, etc.),
  price: Number,
  image: String,
  category: String,
  stock: Number,
  featured: Boolean,
  nutritionalInfo: Object
}
```

### Order Model
```javascript
{
  orderNumber: String (auto-generated),
  user: ObjectId,
  items: [Object],
  customerType: String,
  hostel: String,
  deliveryAddress: Object,
  contactInfo: Object,
  pricing: Object,
  payment: Object,
  status: String,
  deliveryDate: Date,
  deliveryTime: String
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Input Validation** - express-validator for data validation
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configured for frontend domain
- **Helmet** - Security headers
- **Environment Variables** - Sensitive data protection

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "garamdoodh-api"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

- **Health Check**: `GET /api/health`
- **Logs**: Check console output for errors
- **Database**: Monitor MongoDB performance
- **Payments**: Check Razorpay dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email admin@garamdoodh.com or create an issue in the repository.

---

**GaramDoodh** - Fresh Boiled Milk Delivered to Your Doorstep! 🥛"# milk_project" 
