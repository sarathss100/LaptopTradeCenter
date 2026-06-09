# LaptopTradeCenter - E-commerce Platform

A full-featured e-commerce platform for buying and selling laptops with integrated payment systems, inventory management, and admin dashboard.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Authentication & Security](#authentication--security)
- [Usage](#usage)
- [Default Test Credentials](#default-test-credentials)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

LaptopTradeCenter is a comprehensive Node.js + Express-based e-commerce application that allows users to browse, search, and purchase laptops. It includes an admin panel for managing products, customers, orders, and generating sales reports.

## ✨ Features

### User Features
- User registration and authentication (Email/Password & Google OAuth)
- Product browsing and searching with filters
- Shopping cart management
- Wishlist functionality
- Secure checkout and payment integration (PayPal)
- Order tracking and history
- User profile management
- Address book management
- Coupon and discount code application
- OTP-based login and password reset
- Wallet/balance management

### Admin Features
- Dashboard with sales overview
- Product management (Add, Edit, Delete)
- Category and brand management
- Customer management and blocking
- Order management and status tracking
- Coupon and discount management
- Banner page management
- Sales reports and analytics
- Admin authentication with JWT tokens

### Security Features
- JWT-based authentication (Access & Refresh tokens)
- Password hashing with bcrypt
- Session management with MongoDB store
- CSRF protection
- HTTP-only secure cookies
- Input validation and sanitization
- Email verification with OTP

## 🛠️ Tech Stack

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- Nodemailer for email services
- Multer for file uploads

**Frontend:**
- EJS templating engine
- Tailwind CSS for styling
- JavaScript (vanilla & fetch API)
- PostCSS for CSS processing

**External Services:**
- Google OAuth 2.0 for authentication
- PayPal for payment processing

**Development Tools:**
- Nodemon for auto-reloading
- Dotenv for environment management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sarathss100/LaptopTradeCenter.git
   cd LaptopTradeCenter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env  # (if available, or create manually)
   ```

4. **Configure environment variables** (see [Environment Configuration](#environment-configuration))

5. **Start the application:**
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`

### Build CSS (if needed)
```bash
npm run build:css
```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/laptoptradecenter
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laptoptradecenter

# Server
PORT=3000
NODE_ENV=development

# JWT Secrets (use strong random strings)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
SESSION_SECRET=your_session_secret_here

# Email Configuration (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_SERVICE=gmail

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
LaptopTradeCenter/
├── auth/                          # Authentication middleware
│   ├── adminAuthentication.mjs     # Admin JWT verification
│   ├── userAuthentication.mjs      # User JWT verification
│   └── googleAuthentication.mjs    # Google OAuth strategy
├── config/                        # Configuration files
│   ├── config.mjs                 # General config
│   └── paypalConfig.mjs           # PayPal SDK config
├── controllers/                   # Business logic controllers
│   ├── admincontroller.mjs        # Admin controller
│   ├── usercontroller.mjs         # User controller
│   ├── productSearch.mjs          # Product search logic
│   ├── admin_modules/             # Admin-specific controllers
│   └── user_modules/              # User-specific controllers
├── models/                        # Mongoose schemas
│   ├── userCredentialsModel.mjs
│   ├── productDetailsModel.mjs
│   ├── orderModel.mjs
│   └── ...
├── routes/                        # Express routes
│   ├── admin.mjs                  # Admin routes
│   └── user.mjs                   # User routes
├── services/                      # Utility services
│   ├── authenticateUser.mjs       # Auth service
│   └── paypal.mjs                 # PayPal service
├── utils/                         # Utility functions
│   └── db.mjs                     # Database connection
├── views/                         # EJS templates
│   ├── admin/                     # Admin pages
│   ├── user/                      # User pages
│   └── components/                # Reusable components
├── public/                        # Static assets
│   ├── images/
│   └── stylesheet/
├── app.js                         # Entry point
└── package.json                   # Dependencies
```

## 🛣️ API Routes

### User Routes
- `GET /` - Home page
- `GET /loginPage` - Login page
- `POST /loginForm` - Login form submission
- `GET /signUpPage` - Registration page
- `POST /signUpForm` - Registration form submission
- `GET /productDetailPage/:id` - Product details
- `GET /cartPage` - Shopping cart
- `GET /wishListPage` - Wishlist
- `POST /chekOutPage` - Checkout
- `GET /userProfilePage` - User profile
- `GET /logOut` - Logout

### Admin Routes (Protected)
- `GET /admin/loginPage` - Admin login
- `POST /admin/loginForm` - Admin login submission
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/productsPage` - Products management
- `POST /admin/addProduct` - Add product
- `GET /admin/customersPage` - Customers list
- `GET /admin/ordersPage` - Orders list
- `GET /admin/couponsPage` - Coupons management

## 💾 Database Models

### User Credentials
- Email, Password (hashed), Phone Number
- Name, Address, Profile Picture
- Blocked Status, Account Deletion Status
- Google ID, Referral Code
- OTP and Expiration

### Product Details
- Name, Description, Price
- Brand, Category
- Stock Quantity, Rating
- Images (URLs/buffers)

### Order
- User ID, Products, Quantity
- Order Status, Total Price
- Delivery Address
- Payment Method, Status

### Coupon
- Code, Discount Percentage/Amount
- Expiry Date, Usage Limit
- Active/Inactive Status

## 🔐 Authentication & Security

### Password Security
- Passwords hashed using bcrypt (salt rounds: 10)
- Never stored in plain text
- Client-side validation + Server-side validation

### JWT Tokens
- **Access Token**: 2-minute expiration (for API requests)
- **Refresh Token**: Long-lived (for getting new access tokens)
- Tokens stored in HTTP-only secure cookies
- CORS and CSRF protection enabled

### Session Management
- MongoDB session store (`connect-mongo`)
- 24-hour session expiration
- Automatic cleanup of expired sessions
- Secure cookie settings (HttpOnly, Secure in production)

## 📝 Usage

### Creating a New User
1. Navigate to `/signUpPage`
2. Fill in email, password, and other details
3. Submit to create account
4. Login with credentials

### Adding a Product (Admin)
1. Login to admin panel at `/admin/loginPage`
2. Navigate to Products Management
3. Click "Add Product"
4. Fill in product details (name, price, category, brand, images)
5. Submit

### Placing an Order (User)
1. Browse products on home page or use search
2. Add items to cart
3. Apply coupon if available
4. Proceed to checkout
5. Select payment method (PayPal or Wallet)
6. Complete payment

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access if using Atlas

### JWT Token Errors
- Clear browser cookies
- Check token secrets in `.env`
- Verify token hasn't expired

### Email/OTP Issues
- Check Nodemailer configuration
- Verify email credentials in `.env`
- Check spam folder for emails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👤 Author

**Sarath S S**
- GitHub: [@sarathss100](https://github.com/sarathss100)
- Project: [LaptopTradeCenter](https://github.com/sarathss100/LaptopTradeCenter)

## 📞 Support

For issues and questions, please create an issue on GitHub or contact the author.

---

**Last Updated:** June 2024  
**Version:** 1.0.0