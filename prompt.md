need a website like https://www.liliorigin.com/ this for a cliet named shreejewels features they need Customer google login 
Admin panel for client to add or remove products 
Banners editable 
Custom Promo codes 

Payment gateway with razor pay and frontend should be like lilliorgin and the categerious are demo products client has make it two section first WESTERN 

EARRINGS 
. anti tarnish 
. combo sets
. Korean Earrings 
. Hoops
. Office wear studs

CHAINS
. anti tarnish 
. Fancy chains

RINGS
 
BRACELETS

CLUTCHES 
. Daily wear
. Party wear
. fancy hair pins

Rubber bands
. Scrunchies 
. Party wear 
. Combos
 
HAIR ACCESSORIES 
. Clips 
. Hair stickers
. Hair flowers
. Flower clips and 2.TRADITIONAL  / INDO WESTERN 

NECKLACE 
. diamond 
. Antic
. Victorian 
. Rajwadi kundan
. Jadau kundan
. Kundan
. Moissanite 
. A.D. stone
. Mehandi polish
. Chowkars
. 1 gram gold sets
. 3/ 4 sets
. Simple chains

LONG SETS

BLACK BEADS

BEADS CHAINS
 
MOTI CHAINS 

BANGLES

. kankanalu 
. Daily wear bangles
. Stone bangles
. Diamond bangles
. Antic bangles
 
EARRINGS 

. Buttalu
. Statement earrings 
. Chandbalis 
. INDO western earrings 
. Studs
. Changeables 
. Earrings with cuffs 
. Cuffs
. Bugadis

OTHERS 

HIP BELT

NOSE PINS

CHEMPASARALU 

ANKLETS

BRACELETS 

SAREE PINS

LOCKETS / PENDANT WITH EARRINGS 

TIKAS

SURYAVANKA & CHANDRAVANKA

JADA BILLALU

KIDS ACCESSORIES
 
KUMKUM BOXES adjust categious according keep only important okay right next the client should add or delete products categerious in the admin panel and next add some required features for admin panel as well start from backend and go to front end dont break take access be creative and one thing add price filter in the products section chat gpt given  prompt for use case : You are a senior full-stack engineer and system architect.

Your task is to design and generate a complete, production-ready eCommerce platform for a jewelry brand named **ShreeJewels**.

The design inspiration should be similar in *feel* (not copied) to premium jewelry eCommerce websites like Lili Origin — clean, minimal, high-end, mobile-first, and conversion-optimized.

---

## 🎯 CORE GOAL

Build a scalable, modern jewelry eCommerce platform with:

* Dynamic categories (admin-controlled)
* Full admin dashboard
* Google login for customers
* Razorpay payment integration
* Promo code system
* Banner management
* Advanced product filtering (including price filter)
* High-end frontend UI

---

## ⚙️ TECH STACK (STRICT)

Frontend:

* Next.js (App Router)
* Tailwind CSS
* Framer Motion

Backend:

* Node.js + Express

Database:

* MongoDB (Mongoose)

Auth:

* JWT + Google OAuth

Storage:

* Cloudinary (for images)

Payments:

* Razorpay integration

---

## 🧠 ARCHITECTURE REQUIREMENTS

Follow a clean modular architecture:

* /app (frontend pages)
* /components (UI components)
* /lib (helpers, configs)
* /models (MongoDB schemas)
* /api (backend routes)
* /admin (admin panel frontend)

Use reusable components and scalable folder structure.

---

## 🔐 AUTHENTICATION

Customer:

* Google login (mandatory)
* Optional email login
* JWT-based sessions
* Wishlist + order history

Admin:

* Secure login
* Role-based access (admin/superadmin)
* Protected routes

---

## 🗄️ DATABASE DESIGN

Create schemas for:

Users:

* name
* email
* googleId
* role

Products:

* title
* description
* price
* discountPrice
* category
* subCategory
* images[]
* stock
* tags (anti tarnish, korean, etc.)
* createdAt

Categories (IMPORTANT: dynamic):

* name
* parentCategory (nullable)
* image
* isActive
* order (for sorting)

Orders:

* userId
* products[]
* totalAmount
* paymentStatus
* orderStatus
* address
* createdAt

Coupons:

* code
* discountType (% or flat)
* value
* expiry
* usageLimit

Banners:

* title
* image
* link
* isActive
* position (homepage/category)

---

## 🧰 ADMIN PANEL FEATURES

Build a complete admin dashboard with:

Dashboard:

* Revenue stats
* Orders overview
* Top products

Product Management:

* Add/edit/delete products
* Upload multiple images
* Assign category & tags

Category Management:

* Add/edit/delete categories
* Nested categories
* Enable/disable
* Reorder categories

Banner Management:

* Upload/edit banners
* Assign to homepage or category

Coupon System:

* Create promo codes
* Set discount type, expiry, usage limit

Orders:

* View all orders
* Update status (pending/shipped/delivered)

Users:

* View customers and their orders

---

## 🛍️ CATEGORY STRUCTURE (INITIAL SEED DATA)

Create initial categories but ensure they are editable via admin.

Main Categories:

1. WESTERN

* Earrings (Anti Tarnish, Combo Sets, Korean, Hoops, Office Wear)
* Chains (Anti Tarnish, Fancy)
* Rings
* Bracelets
* Clutches (Daily, Party)
* Hair Accessories (Clips, Scrunchies, Pins)

2. TRADITIONAL / INDO-WESTERN

* Necklace (Kundan, Victorian, Moissanite, AD Stone, Chokers)
* Long Sets
* Bangles (Daily, Stone, Antique)
* Earrings (Chandbali, Studs, Statement)
* Others (Anklets, Nose Pins, Hip Belts, Tikas)

---

## 🎨 FRONTEND REQUIREMENTS

Design a premium UI:

Homepage:

* Hero banner (dynamic)
* Featured categories
* Best sellers
* Promotional sections

Product Listing Page:

* Filters:

  * Price range (MANDATORY)
  * Category
  * Tags
* Sorting options
* Grid layout

Product Page:

* Image gallery with zoom
* Pricing + discount
* Add to cart / buy now
* Related products

Cart & Checkout:

* Coupon apply
* Address form
* Razorpay integration
* Order confirmation

---

## 👤 USER FEATURES

* Google login
* Wishlist
* Order tracking
* Profile management

---

## ⚡ EXTRA FEATURES

* Smart search with suggestions
* Recently viewed products
* Mobile-first design
* SEO optimization (SSR)
* WhatsApp support button
* Analytics integration (Google Analytics)

---

## 🚀 OUTPUT REQUIREMENTS

Generate:

1. Full folder structure
2. Backend API routes
3. MongoDB models
4. Authentication logic
5. Admin panel pages
6. Frontend pages
7. Razorpay integration code
8. Sample UI components
9. Seed data for categories

---

## ⚠️ IMPORTANT RULES

* Do NOT hardcode categories — everything must be dynamic
* Keep code modular and production-ready
* Use clean naming conventions
* Ensure responsiveness
* Avoid unnecessary complexity
* Focus on real-world deployment readiness

---

## 🧠 EXECUTION STYLE

* Think like a senior engineer
* Prioritize scalability and maintainability
* Write clean, readable code
* Add comments where necessary

---

Now start building the project step-by-step:

1. Folder structure
2. Backend setup
3. Database models
4. APIs
5. Admin panel
6. Frontend
7. Final integration

Do not skip steps. Be complete and precise.
