# SADAT Delivery App Backend

A comprehensive Express.js backend for a delivery application with PostgreSQL database and Prisma ORM.

## 🚀 Features

- **Multi-role Authentication**: Users, Vendors, and Captains with JWT tokens
- **Order Management**: Complete order lifecycle from creation to delivery
- **Real-time Status Updates**: Track order status through the delivery process
- **Profile Management**: User, vendor, and captain profile management
- **Statistics & Analytics**: Comprehensive statistics for all user types
- **Search & Filtering**: Advanced search capabilities for vendors and captains
- **Pagination**: Efficient data pagination for all list endpoints
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Robust error handling with detailed error messages
- **BigInt Serialization**: Proper handling of PostgreSQL BigInt types for JavaScript

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Compression**: Compression middleware

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd SADAT_DELIVERY
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sadat_delivery"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 5. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Swagger UI
Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3000/api-docs`

The Swagger UI provides:
- Interactive API testing interface
- Complete endpoint documentation
- Request/response schemas
- Authentication support
- Try-it-out functionality

### Manual API Testing

### Authentication Endpoints

#### User Authentication
- `POST /api/auth/signup/user` - User registration
- `POST /api/auth/login/user` - User login

#### Vendor Authentication
- `POST /api/auth/signup/vendor` - Vendor registration
- `POST /api/auth/login/vendor` - Vendor login

#### Captain Authentication
- `POST /api/auth/signup/captain` - Captain registration
- `POST /api/auth/login/captain` - Captain login

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/orders` - Get user orders
- `GET /api/users/stats` - Get user statistics
- `DELETE /api/users/account` - Delete user account

### Vendor Endpoints
- `GET /api/vendors/` - Get all vendors (public)
- `GET /api/vendors/search` - Search vendors (public)
- `GET /api/vendors/profile` - Get vendor profile
- `PUT /api/vendors/profile` - Update vendor profile
- `PUT /api/vendors/status` - Update vendor status
- `GET /api/vendors/orders` - Get vendor orders
- `GET /api/vendors/stats` - Get vendor statistics

### Captain Endpoints
- `GET /api/captains/available` - Get available captains (public)
- `GET /api/captains/search` - Search captains by location (public)
- `GET /api/captains/profile` - Get captain profile
- `PUT /api/captains/profile` - Update captain profile
- `PUT /api/captains/status` - Update captain availability
- `PUT /api/captains/location` - Update captain location
- `GET /api/captains/orders` - Get captain orders
- `GET /api/captains/stats` - Get captain statistics

### Order Endpoints
- `GET /api/orders/available` - Get available orders for captains (public)
- `GET /api/orders/stats` - Get order statistics (public)
- `GET /api/orders/:id` - Get order by ID (public)

#### User Order Operations
- `POST /api/orders/create-by-user` - Create order by user
- `GET /api/orders/user/orders` - Get user orders
- `PUT /api/orders/:id/user-approve` - User approve order
- `DELETE /api/orders/:id` - Delete order (user only)

#### Vendor Order Operations
- `POST /api/orders/create-by-vendor` - Create order by vendor
- `GET /api/orders/vendor/orders` - Get vendor orders
- `PUT /api/orders/:id/vendor-counter-offer` - Vendor counter offer
- `PUT /api/orders/:id/vendor-reject` - Vendor reject order

#### Captain Order Operations
- `GET /api/orders/captain/orders` - Get captain orders
- `PUT /api/orders/:id/captain-approve` - Captain accept order
- `PUT /api/orders/:id/start-delivery` - Start delivery
- `PUT /api/orders/:id/finalize` - Mark order as delivered

### Menu Endpoints

#### Vendor Menu Operations (Protected)
- `POST /api/menus` - Create a new menu item (photo only)
- `GET /api/menus` - Get vendor's menu items
- `GET /api/menus/stats` - Get menu statistics
- `PUT /api/menus/:id` - Update menu item photo
- `DELETE /api/menus/:id` - Delete menu item

#### Public Menu Endpoints
- `GET /api/menus/:id` - Get menu item by ID
- `GET /api/menus/vendor/:vendorId` - Get public vendor menu (for customers)

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application uses 6 main models:

1. **User** - Customer accounts
2. **Vendor** - Restaurant/shop accounts
3. **Captain** - Delivery driver accounts
4. **Order** - Delivery orders
5. **Menu** - Vendor menu items with photo storage
6. **Complain** - Order complaints

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Sanitization**: Protection against XSS attacks

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure
```
src/
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Main server file
```

## 🐛 Error Handling

The application includes comprehensive error handling:
- Prisma database errors
- JWT authentication errors
- Validation errors
- Custom business logic errors

All errors return consistent JSON responses with appropriate HTTP status codes.

## 📈 Performance Features

- **Compression**: Response compression for better performance
- **Pagination**: Efficient data pagination
- **Selective Queries**: Optimized database queries with selective field loading
- **Connection Pooling**: Prisma connection pooling for database efficiency

## 🔄 BigInt Handling

The application properly handles PostgreSQL BigInt types by:
- Converting BigInt to strings in JSON responses
- Using BigInt for database operations
- Maintaining data integrity across the application

## 🚀 Deployment

### Environment Variables
Make sure to set all required environment variables in production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret key for JWT
- `NODE_ENV` - Set to "production"
- `PORT` - Server port

### Database Migration
```bash
npm run db:migrate
```

### Start Production Server
```bash
npm start
```

## 🧪 Testing

### Running Individual Tests

```bash
# Run happy order flow test
npm run test:happy

# Run vendor initiated order flow test
npm run test:vendor

# Run special order flow test (with system vendor)
npm run test:special
```

### Running All Tests with Timing Statistics

```bash
# Run comprehensive tests with detailed timing
npm run test:comprehensive

# Run all tests with summary timing
npm run test:all
```

### Test Timing Features

All tests now include comprehensive timing statistics:
- Operation-level timing for each API call
- Overall test duration tracking
- Performance statistics including average operation times
- Identification of slowest operations
- Detailed timing logs in test result files

### Test Result Files

- `test_results.log` - Happy order flow test logs
- `test_vendor_initiated_order_results.log` - Vendor initiated order flow test logs
- `test_special_order_results.log` - Special order flow test logs

Each log file includes detailed timing information for all operations performed during the test.

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team. 