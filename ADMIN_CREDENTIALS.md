# ShreeJewels Admin Login Credentials

## 🔐 Admin Account Details

```
Email:    admin@shreejewels.com
Password: Admin@123456
Role:     Superadmin
```

---

## 🌐 Access URLs

| Page | URL |
|------|-----|
| **Frontend** | http://localhost:3000 |
| **Admin Login** | http://localhost:3000/auth/login?redirect=/admin |
| **Admin Dashboard** | http://localhost:3000/admin |
| **Backend API** | http://localhost:4000/api |

---

## 🚀 How to Login

### Step 1: Go to Admin Login Page
- Navigate to: `http://localhost:3000/auth/login?redirect=/admin`
- Or click "Sign In" → Select "Sign In" tab

### Step 2: Enter Credentials
- **Email:** `admin@shreejewels.com`
- **Password:** `Admin@123456`

### Step 3: Access Admin Dashboard
- After successful login, you'll be redirected to: `http://localhost:3000/admin`
- You can now manage:
  - ✅ Products
  - ✅ Categories
  - ✅ Banners
  - ✅ Coupons
  - ✅ Orders
  - ✅ Users

---

## 📋 Available Admin Features

### Products Management
- Add/Edit/Delete products
- Upload images via Cloudinary
- Set pricing and discounts
- Manage product tags

### Categories Management
- Create product categories
- Set category hierarchy
- Enable/Disable categories

### Banners Management
- Create promotional banners
- Upload banner images
- Set banner links and text
- Manage hero banners

### Coupons Management
- Create discount coupons
- Set coupon values and expiry
- Track coupon usage

### Orders Management
- View all customer orders
- Track order status
- Process refunds

### Users Management
- View all registered customers
- View admin users
- Manage user permissions

---

## 🔄 Additional Customer Accounts

You can also create customer accounts by:

### Option 1: Register via Frontend
- Go to `http://localhost:3000/auth/login`
- Click "Register" tab
- Fill in: Name, Email, Password
- Click "Create Account"

### Option 2: Google Login
- Click "Sign up with Google" button
- Account auto-created on first login

---

## 🛠️ Resetting Admin Password

If you need to reset the admin password, you can:

### Method 1: Update .env and Re-run Script
```bash
# Edit backend/.env
ADMIN_PASSWORD=YourNewPassword123

# Run create-admin script
cd backend
node scripts/create-admin.js
```

### Method 2: Update Seed Script
```bash
# Edit backend/.env
ADMIN_PASSWORD=YourNewPassword123

# Run seed
cd backend
npm run seed
```

---

## 📊 Database & Environment

### Environment File Location
- **Backend:** `/backend/.env`

### Key Configuration Variables
```properties
ADMIN_EMAIL=admin@shreejewels.com
ADMIN_PASSWORD=Admin@123456
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=your_client_id
RAZORPAY_KEY_ID=your_key_id
```

### Database Connection
- **Type:** PostgreSQL (Neon Cloud)
- **Connection:** Already configured in `.env`

---

## ✅ Login Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check email and password are correct |
| "Account deactivated" | Contact database administrator |
| "Admin access only" | Ensure user role is 'superadmin' |
| "Not found" | Run seed script: `npm run seed` |
| Can't connect to backend | Ensure backend server is running on port 4000 |

---

## 🔗 API Endpoints

### Authentication Endpoints
```
POST /api/auth/login           - Customer/Admin login
POST /api/auth/login/customer  - Customer login
POST /api/auth/register        - Customer registration
POST /api/auth/google          - Google OAuth login
POST /api/auth/logout          - Logout
GET  /api/auth/me              - Get current user
PUT  /api/auth/profile         - Update profile
```

---

## 📝 Notes

- Default password is: `Admin@123456`
- Admin account role is: `superadmin`
- Database is seeded with product categories on first run
- JWT tokens expire after 30 days
- All passwords are hashed with bcryptjs (salt rounds: 12)

---

**Last Updated:** 21 May 2026
**Status:** ✅ Ready for Development
