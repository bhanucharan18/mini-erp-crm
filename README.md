# Mini ERP + CRM

A full-stack **Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM)** web application designed to manage customers, products, inventory, and challans through a centralized dashboard.

The project is being developed using modern web technologies with a focus on secure authentication, role-based access, and scalable application architecture.

---

## 🚀 Features

### 🔐 Authentication

* Secure user login
* JWT-based authentication
* Password hashing using bcrypt
* JWT token stored in browser local storage
* Protected dashboard routes
* Logged-in user information display
* Logout functionality

### 📊 Dashboard

* ERP and CRM overview
* User welcome section
* Logged-in user email and role
* Sidebar-based navigation
* Centralized management interface

### 👥 Customer Management

* View customers
* Add new customers
* Edit customer information
* Delete customers

### 📦 Product Management

* Product management
* Product information tracking
* Product listing

### 🏭 Inventory Management

* Inventory tracking
* Stock management
* Product availability monitoring

### 📄 Challan Management

* Challan management
* Customer and product-related records
* Challan tracking

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* React Router
* Axios
* Vite

### Backend

* Node.js
* Express.js
* TypeScript
* JWT Authentication
* bcryptjs
* CORS

### Database

* PostgreSQL
* Prisma ORM

### Development Tools

* Git
* GitHub
* VS Code
* npm

---

## 📁 Project Structure

```text
mini-erp-crm/
│
├── backend/
│   ├── src/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Customers.tsx
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
└── README.md
```

---

## 🔑 Authentication Flow

```text
User
  │
  ▼
Login Page
  │
  │ Email + Password
  ▼
Backend Authentication API
  │
  ▼
Verify Credentials
  │
  ▼
Generate JWT
  │
  ▼
Store JWT in Local Storage
  │
  ▼
Protected Dashboard
  │
  ▼
Fetch Logged-in User
```

---

## 📌 Current Application Flow

```text
Login
  │
  ▼
Dashboard
  │
  ├── Dashboard
  │
  ├── Customers
  │
  ├── Products
  │
  ├── Inventory
  │
  └── Challans
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mini-erp-crm.git
```

Navigate to the project:

```bash
cd mini-erp-crm
```

---

## 🖥️ Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

## ⚙️ Backend Setup

Open a new terminal and navigate to:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL="your_postgresql_database_url"

JWT_SECRET="your_secret_key"

PORT=5000
```

> Never upload your `.env` file or secret keys to GitHub.

Add `.env` to `.gitignore`:

```text
.env
node_modules
dist
```

---

## 🔗 API Endpoints

### Authentication

```text
POST /api/auth/login
```

Used to authenticate users and generate a JWT token.

```text
GET /api/auth/me
```

Used to retrieve the currently authenticated user's information.

### Customers

Planned endpoints:

```text
GET    /api/customers
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

---

## 🛡️ Security

The application uses:

* JWT authentication
* Password hashing with bcryptjs
* Protected frontend routes
* Authentication middleware
* Environment variables for sensitive configuration
* CORS configuration

---

## 📈 Future Improvements

* [ ] Complete Customer CRUD operations
* [ ] Product management
* [ ] Inventory management
* [ ] Challan generation
* [ ] Role-based access control
* [ ] Admin and employee dashboards
* [ ] Search and filtering
* [ ] Pagination
* [ ] Dashboard analytics
* [ ] Reports and data visualization
* [ ] PDF invoice and challan generation
* [ ] Improved responsive UI
* [ ] Deployment to production

---

## 🎯 Project Goal

The goal of this project is to develop a practical, scalable ERP + CRM platform that helps businesses manage their daily operations, customer relationships, products, inventory, and business documentation from a single application.

The project also serves as a hands-on full-stack development project covering frontend development, backend API design, authentication, database management, and secure application architecture.

---

## 👨‍💻 Author

**Bhanu Charan**

Computer Science Engineering (Cybersecurity) Student

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
