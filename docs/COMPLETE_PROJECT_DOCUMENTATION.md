# BajajMisMern Project - Complete Detailed Documentation

**Project Name:** Bajaj MIS MERN Project  
**Technology Stack:** Node.js + Express + React + Vite + MSSQL  
**Last Updated:** March 8, 2026  
**Status:** Active Development with Microservices Architecture

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Microservices Structure](#microservices-structure)
8. [Database Design](#database-design)
9. [API Documentation](#api-documentation)
10. [Frontend Pages & Components](#frontend-pages--components)
11. [Deployment & Configuration](#deployment--configuration)
12. [Project Structure](#project-structure)
13. [Running the Project](#running-the-project)
14. [Development Workflow](#development-workflow)
15. [Known Issues & Limitations](#known-issues--limitations)
16. [Migration Status](#migration-status)
17. [Future Roadmap](#future-roadmap)

---

## Executive Summary

BajajMisMern is a comprehensive full-stack web application built with the MERN (MongoDB, Express, React, Node.js) stack paradigm, adapted for MSSQL database backend. The application manages MIS (Management Information System) workflows for Bajaj, a major Indian company.

**Key Highlights:**
- **Modular Architecture**: Organized into dedicated microservices for different business domains
- **Modern Frontend**: React 19 with Vite build tool, lazy-loaded routes for optimal performance
- **Backend Service Mesh**: Express.js with modular controllers, services, and repositories
- **Legacy Integration**: Supports fallback to legacy .NET APIs during migration
- **Enterprise Scale**: 333+ endpoints serving complex MIS operations
- **Production Ready**: Both frontend and backend are buildable and deployable

---

## Project Overview

### Business Purpose

BajajMisMern serves as the backbone for organizational MIS workflows including:
- Inventory and Distillery management
- Report generation and tracking
- User and account management
- Survey and feedback collection
- Lab operations management
- WhatsApp integration for notifications
- Tracking and logistics operations
- Dashboard analytics and KPI visualization

### High-Level Goals

1. **Modernization**: Migrate from legacy .NET architecture to cloud-ready microservices
2. **Scalability**: Handle enterprise-scale data and concurrent users
3. **Maintainability**: Clean, modular code structure for team collaboration
4. **Performance**: Optimized frontend with lazy loading and code splitting
5. **Flexibility**: Support gradual migration from legacy assets
6. **Integration**: Connect with WhatsApp, SMS, and legacy systems

---

## Technology Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 14+ | JavaScript execution environment |
| Framework | Express.js | 4.x | HTTP server & routing |
| Database | MSSQL Server | 2019+ | Primary data store |
| ORM/Query | mssql/msnodesqlv8 | 9.x / 8.x | Database connectivity |
| Validation | Zod | 4.3.6+ | Schema validation |
| Auth | JWT | Built-in | Token-based authentication |
| Logging | Built-in | - | Request/error logging via console/files |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 19.2.0 | Component-based UI |
| Build Tool | Vite | 7.3.1 | Lightning-fast dev server & bundler |
| Routing | React Router | 7.13.1 | Client-side routing |
| HTTP Client | Axios | 1.13.5 | API requests |
| Styling | Tailwind CSS | 4.2.1 | Utility-first CSS framework |
| Charts | Recharts | 3.7.0 | Data visualization |
| Maps | Leaflet | 1.9.4 | Geographic mapping |
| Icons | Lucide React | 0.575.0 | SVG icon library |
| Notifications | React Hot Toast | 2.6.0 | Toast notifications |

### DevOps & Tools
| Tool | Purpose |
|------|---------|
| Docker | Containerization (services) |
| docker-compose | Multi-container orchestration |
| npm | Package management |
| ESLint | Code linting |

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│                  (React + Tailwind)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   VITE DEV SERVER                           │
│              (localhost:5173)                               │
│         ┌─────────────────────────────┐                     │
│         │  Lazy Route Loading          │                    │
│         │  Code Splitting (Vendor)     │                    │
│         │  API Proxy -> /api           │                    │
│         └──────────────┬────────────────┘                    │
│                        │                                     │
│         Routes: /account, /main, /dashboard,                │
│         /report, /lab, /survey, /tracking ...               │
└────────────────────┬────────────────────────────────────────┘
                     │ /api proxy
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  EXPRESS BACKEND                            │
│              (localhost:5000)                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          API GATEWAY LAYER (app.js)                │    │
│  │  ├─ Auth Middleware (JWT validation)              │    │
│  │  ├─ Error Handling Middleware                      │    │
│  │  ├─ Validation Middleware                          │    │
│  │  ├─ Health Check Route (/api/health)              │    │
│  │  └─ Request Logging                                │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                    │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │      MICROSERVICES REGISTRY (modules)               │  │
│  ├─ /api/account -> Auth Module                        │  │
│  ├─ /api/user-management -> User Module               │  │
│  ├─ /api/dashboard -> Dashboard Module                │  │
│  ├─ /api/report -> Report Module                      │  │
│  ├─ /api/survey-service -> Survey Module              │  │
│  ├─ /api/tracking -> Tracking Module                  │  │
│  ├─ /api/distillery -> Distillery Module              │  │
│  ├─ /api/lab -> Lab Module                            │  │
│  └─ /api/whats-app -> WhatsApp Module                 │  │
│  └────────────────────────────────────────────────────┘  │
│                        │                                   │
│  ┌────────────────────▼────────────────────────────────┐  │
│  │      CONTROLLER -> SERVICE -> REPOSITORY            │  │
│  │   (Layered Architecture per Module)                 │  │
│  │                                                      │  │
│  │  Each Module Contains:                              │  │
│  │  ├─ controller.js (HTTP handlers)                  │  │
│  │  ├─ service.js (business logic)                    │  │
│  │  ├─ repository.js (data access)                    │  │
│  │  ├─ validation.js (input validation)               │  │
│  │  └─ routes.js (endpoint definitions)               │  │
│  └────────────────────────────────────────────────────┘  │
│                        │                                   │
│  ┌────────────────────▼────────────────────────────────┐  │
│  │      CORE UTILITIES & HELPERS                       │  │
│  ├─ Response Standardization                          │  │
│  ├─ Error Handling Objects                            │  │
│  ├─ Query Execution Helpers                           │  │
│  └─ Legacy Fallback Service (for migration)           │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Queries
                     │
┌────────────────────▼────────────────────────────────────────┐
│           MSSQL DATABASE LAYER                             │
│                                                             │
│  ├─ SQL_CONN_2021 (Season 2021)                           │
│  ├─ SQL_CONN_2122 (Season 2122)                           │
│  ├─ SQL_CONN_2526 (Current Season - 2526)                │
│  ├─ Stored Procedures (legacy fallback)                  │
│  └─ Direct SQL Queries (modern endpoints)                │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Design Patterns

1. **Layered Architecture**: Controller → Service → Repository
2. **Registry Pattern**: Centralized microservice registration and mounting
3. **Repository Pattern**: Data access abstraction
4. **Service Locator**: Dependency injection via shared services
5. **Error Handler Pattern**: Consistent error response across API
6. **Lazy Loading Pattern**: Route-level code splitting in frontend
7. **Legacy Fallback Pattern**: Graceful migration from legacy APIs

---

## Backend Architecture

### Backend Directory Structure

```
backend/
├── server.js                      # Main entry point, server initialization
├── start.js                       # Alternative start script
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment variable template
├── services/                      # MICROSERVICES CONTAINERS
│   ├── api-gateway/              # API Gateway service
│   ├── auth-service/             # Authentication service
│   ├── dashboard-service/        # Dashboard service
│   ├── distillery-service/       # Distillery operations
│   ├── lab-service/              # Lab operations
│   ├── report-service/           # Report generation
│   ├── survey-service/           # Survey management
│   ├── tracking-service/         # Tracking operations
│   ├── user-service/             # User management
│   ├── whatsapp-service/         # WhatsApp integration
│   └── docker-compose.yml        # Docker composition for all services
```

### Module Structure (Each Microservice)

Each microservice follows this pattern:

```
service-name/
├── controller.js          # HTTP request handlers
├── service.js             # Business logic
├── repository.js          # Database operations
├── validation.js          # Input/schema validation
├── routes.js              # Route definitions
├── index.js               # Module exports
├── package.json           # Service-specific dependencies
├── .env.example           # Service environment config
└── README.md              # Service documentation
```

### Core Components

#### 1. **server.js** - Server Initialization
```javascript
// Key responsibilities:
- Load environment variables
- Initialize database connection
- Start Express server
- Handle port fallback mechanism
- Global error handler setup
```

#### 2. **Database Connection (sqlserver.js)**
Supports dual connection modes:

**Mode 1: Direct Connection Strings (Preferred)**
```env
SQL_CONN_2021=Server=...;Database=...;
SQL_CONN_2122=Server=...;Database=...;
SQL_CONN_2526=Server=...;Database=...;
SQL_CONN_DEFAULT=Server=...;Database=...;
```

**Mode 2: Configuration-based (Legacy)**
```env
DB_SERVER=sql-server.local
DB_INSTANCE=MSSQLSERVER
DB_NAME=BajajDB
DB_USE_WINDOWS_AUTH=true
DB_USER=sa
DB_PASSWORD=***
```

#### 3. **Middleware Stack**
- **Auth Middleware**: JWT validation, user context injection
- **Error Middleware**: Global error catching, response standardization
- **Validation Middleware**: Request schema validation using Zod
- **CORS Middleware**: Cross-origin request handling
- **Logging Middleware**: Request/response logging

#### 4. **Response Standardization**
```javascript
// Success Response
{
  success: true,
  message: "Operation completed",
  data: { /* business data */ }
}

// Error Response
{
  success: false,
  message: "Error description",
  error: {
    code: "ERROR_CODE",
    details: "Additional info"
  }
}
```

---

## Frontend Architecture

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── main.jsx                   # React DOM mount & initialization
│   ├── App.jsx                    # Main router configuration
│   ├── vite.config.js             # Vite build configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── eslint.config.js           # ESLint configuration
│   │
│   ├── microservices/             # API SERVICE LAYER
│   │   └── api.service.js         # Centralized Axios client
│   │                              # Domain-specific API services
│   │
│   ├── components/                # REUSABLE UI COMPONENTS
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── DataTable.jsx
│   │   ├── Modal.jsx
│   │   ├── Forms/
│   │   └── Charts/
│   │
│   ├── pages/                     # PAGE COMPONENTS (LAZY LOADED)
│   │   ├── Login.jsx              # Authentication
│   │   ├── Dashboard.jsx          # Home dashboard
│   │   │
│   │   ├── account/               # Account management
│   │   │   ├── AccountCreate.jsx
│   │   │   └── AccountList.jsx
│   │   │
│   │   ├── main/                  # Main/Dashboard views
│   │   │   ├── MainDashboard.jsx
│   │   │   ├── MISReports.jsx
│   │   │   └── ... (15+ pages)
│   │   │
│   │   ├── report/                # Reports module (29+ pages)
│   │   │   ├── ReportDashboard.jsx
│   │   │   ├── RoyaltyReport.jsx
│   │   │   ├── PropertyReport.jsx
│   │   │   └── ...
│   │   │
│   │   ├── account-reports/       # Account-specific reports (13+ pages)
│   │   ├── new-report/            # New report creation (6+ pages)
│   │   ├── report-new/            # Report variations (9+ pages)
│   │   │
│   │   ├── lab/                   # Lab operations (33+ pages)
│   │   │   ├── LabDashboard.jsx
│   │   │   ├── TestEntry.jsx
│   │   │   ├── ResultAnalysis.jsx
│   │   │   └── ...
│   │   │
│   │   ├── distillery/            # Distillery operations (4+ pages)
│   │   ├── survey/                # Survey management
│   │   ├── survey-report/         # Survey reports (13+ pages)
│   │   ├── tracking/              # Tracking module (10+ pages)
│   │   ├── user-management/       # User management (10+ pages)
│   │   ├── whatsapp/              # WhatsApp integration (12+ pages)
│   │   │
│   │   └── layout/
│   │       └── Layout.jsx         # Main layout wrapper
│   │
│   ├── styles/                    # GLOBAL STYLES
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── variables.css
│   │
│   ├── assets/                    # STATIC ASSETS
│   │   ├── images/
│   │   ├── icons/
│   │   └── logos/
│   │
│   └── .env.example               # Environment template
│
├── public/                        # Static files served as-is
├── node_modules/                  # Dependencies
├── package.json                   # Dependencies & scripts
└── package-lock.json              # Lock file
```

### Frontend Routing Configuration

```javascript
// App.jsx - Route Structure with Lazy Loading
const routes = [
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: "dashboard", element: lazy(() => import("@/pages/Dashboard")) },
      { 
        path: "main/*", 
        element: lazy(() => import("@/pages/main/MainLayout")),
        children: [/* 15+ route variants */]
      },
      {
        path: "report/*",
        element: lazy(() => import("@/pages/report/ReportLayout")),
        children: [/* 29+ route variants */]
      },
      {
        path: "lab/*",
        element: lazy(() => import("@/pages/lab/LabLayout")),
        children: [/* 33+ route variants */]
      },
      // ... other domains
    ]
  }
]
```

### API Service Layer (api.service.js)

Provides centralized API client configuration:

```javascript
// Features:
- Base URL resolution from environment
- Axios instance with interceptors
- Automatic JWT token injection
- 401 error handling (logout + redirect to /login)
- Domain-specific service objects

// Exported Services:
export const authService = { login(), logout(), validateToken() }
export const reportService = { getReports(), generateReport(), downloadReport() }
export const dashboardService = { getDashboardData(), getKPIs() }
export const trackingService = { getTracking(), updateTracking() }
export const labService = { getTests(), submitResults() }
export const distilleryService = { getInventory(), recordProduction() }
export const surveyService = { getSurveys(), submitResponse() }
export const userManagementService = { getUsers(), createUser(), updateUser() }
export const whatsappService = { sendMessage(), getStatus() }
```

### Vite Configuration Details

```javascript
// Frontend Build Optimization
- API Proxy: /api -> http://localhost:5000
- Manual chunks: vendor-react, vendor-charts, vendor-http, vendor-icons, vendor-misc
- Route-level lazy loading for individual pages
- CSS/JS minification in production
- Source maps for debugging
```

---

## Microservices Structure

### 8 Core Microservices

#### 1. **Authentication Service (auth-service)**
- **Responsibility**: User login, token generation, session management
- **Key Endpoints**:
  - `POST /api/account/login` - User authentication
  - `POST /api/account/logout` - Session termination
  - `GET /api/account/validate-token` - Token validation
- **Database**: User credentials, tokens, session logs
- **Layer**: Controller → Service → Repository

#### 2. **User Management Service (user-service)**
- **Responsibility**: User CRUD, role assignment, permissions
- **Key Endpoints**:
  - `GET /api/user-management/users` - List users
  - `POST /api/user-management/users` - Create user
  - `PUT /api/user-management/users/:id` - Update user
  - `GET /api/user-management/roles` - List roles
- **Database**: Users, roles, permissions, user-types
- **Pages**: 10+ user management pages

#### 3. **Dashboard Service (dashboard-service)**
- **Responsibility**: KPI aggregation, analytics, summaries
- **Key Endpoints**:
  - `GET /api/dashboard/metrics` - Dashboard metrics
  - `GET /api/dashboard/charts` - Chart data
- **Database**: Aggregated views, cache tables
- **Pages**: Main dashboard with 15+ variations

#### 4. **Report Service (report-service)**
- **Responsibility**: Report generation, filtering, exporting
- **Key Endpoints**:
  - `GET /api/report/list` - Report listing
  - `POST /api/report/generate` - Generate report
  - `GET /api/report/:id/export` - Export as PDF/Excel
- **Database**: Report definitions, report data, export history
- **Pages**: 29+ report pages + 13 account reports + 6 new report variants

#### 5. **Tracking Service (tracking-service)**
- **Responsibility**: Location tracking, routing, delivery status
- **Key Endpoints**:
  - `GET /api/tracking/live-location` - Current location
  - `GET /api/tracking/route` - Route information
  - `POST /api/tracking/update` - Status update
- **Database**: GPS coordinates, route data, delivery logs
- **Pages**: 10+ tracking pages with maps and real-time updates

#### 6. **Distillery Service (distillery-service)**
- **Responsibility**: Production, inventory, quality control
- **Key Endpoints**:
  - `GET /api/distillery/inventory` - Current stock
  - `POST /api/distillery/production` - Record production
- **Database**: Production logs, inventory, quality records
- **Pages**: 4+ distillery operation pages

#### 7. **Lab Service (lab-service)**
- **Responsibility**: Test management, result analysis, reporting
- **Key Endpoints**:
  - `GET /api/lab/tests` - List tests
  - `POST /api/lab/results` - Submit test results
- **Database**: Test definitions, results, analysis data
- **Pages**: 33+ lab operation pages

#### 8. **Survey Service (survey-service)**
- **Responsibility**: Survey creation, distribution, analysis
- **Key Endpoints**:
  - `GET /api/survey-service/surveys` - List surveys
  - `POST /api/survey-service/response` - Submit response
- **Database**: Survey definitions, responses, analytics
- **Pages**: 1 survey page + 13 survey report pages

#### 9. **WhatsApp Service (whatsapp-service)**
- **Responsibility**: Message distribution, notification delivery
- **Key Endpoints**:
  - `POST /api/whats-app/send` - Send message
  - `GET /api/whats-app/status` - Message status
- **Database**: Message queue, delivery logs, templates
- **Pages**: 12+ WhatsApp integration pages

---

## Database Design

### Connection Architecture

```
Application
    ↓
Connection String Selection
    ├─ By Season: SQL_CONN_2021, SQL_CONN_2122, ..., SQL_CONN_2526
    └─ By Config: DB_SERVER + DB_NAME + DB_USER/DB_WINDOWS_AUTH
    ↓
Query Executor (src/core/db/query-executor.js)
    ├─ Connection pooling
    ├─ Query execution
    ├─ Timeout handling (DEFAULT: 30s)
    └─ Error transformation
    ↓
MSSQL Database Server
```

### Key Database Tables (Inferred from API)

| Table | Purpose | Microservice |
|-------|---------|--------------|
| Users | User accounts & authentication | Auth Service |
| Roles | Role definitions & permissions | User Service |
| Dashboard_Metrics | KPI aggregations | Dashboard Service |
| Reports | Report definitions & data | Report Service |
| Tracking_GPS | Location tracking data | Tracking Service |
| Distillery_Production | Production logs & inventory | Distillery Service |
| Lab_Tests | Test definitions & results | Lab Service |
| Surveys | Survey templates & responses | Survey Service |
| WhatsApp_Queue | Message queue & logs | WhatsApp Service |

### SQL Connection Configuration

```env
# Season-based connections
SQL_CONN_2021=Server=sql-prod.local;Database=Bajaj_2021;User Id=sa;Password=***;
SQL_CONN_2122=Server=sql-prod.local;Database=Bajaj_2122;User Id=sa;Password=***;
SQL_CONN_2526=Server=sql-prod.local;Database=Bajaj_2526;User Id=sa;Password=***;
SQL_CONN_DEFAULT=Server=sql-prod.local;Database=Bajaj_Current;User Id=sa;Password=***;

# Alternative: Server-based configuration
DB_SERVER=sql-prod.local
DB_INSTANCE=MSSQLSERVER
DB_NAME=Bajaj_Current
DB_USE_WINDOWS_AUTH=true|false
DB_USER=sa
DB_PASSWORD=***

# Query configuration
SQL_REQUEST_TIMEOUT_MS=30000
SQL_CONNECTION_TIMEOUT_MS=15000
```

---

## API Documentation

### API Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.bajaj.company/api`

### Core Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

Where JWT_TOKEN is obtained from `/api/account/login`.

### Comprehensive Endpoint Groups

#### 1. Account & Authentication (`/api/account/*`)
```
POST   /api/account/login
POST   /api/account/logout
GET    /api/account/validate-token
POST   /api/account/change-password
GET    /api/account/profile
PUT    /api/account/profile
```

#### 2. User Management (`/api/user-management/*`)
```
GET    /api/user-management/users
POST   /api/user-management/users
PUT    /api/user-management/users/:id
DELETE /api/user-management/users/:id
GET    /api/user-management/roles
GET    /api/user-management/user-types
POST   /api/user-management/user-code-changed
```

#### 3. Dashboard (`/api/dashboard/*`)
```
GET    /api/dashboard/metrics
GET    /api/dashboard/charts/:chartId
GET    /api/dashboard/summary
GET    /api/dashboard/kpi/:kpiId
```

#### 4. Reports (`/api/report/*`)
```
GET    /api/report/list
GET    /api/report/:id
POST   /api/report/generate
GET    /api/report/:id/export?format=pdf|excel
POST   /api/account-reports/transfer-received-unit
GET    /api/account-reports/summary
```

#### 5. Tracking (`/api/tracking/*`)
```
GET    /api/tracking/live-location
GET    /api/tracking/route/:id
GET    /api/tracking/unit-wise-officer
GET    /api/tracking/tracking-report
POST   /api/tracking/update-location
```

#### 6. Distillery (`/api/distillery/*`)
```
GET    /api/distillery/inventory
POST   /api/distillery/production
GET    /api/distillery/quality-report
```

#### 7. Lab (`/api/lab/*`)
```
GET    /api/lab/tests
POST   /api/lab/results
GET    /api/lab/:id/analysis
```

#### 8. Survey (`/api/survey-service/*`)
```
GET    /api/survey-service/surveys
POST   /api/survey-service/response
GET    /api/survey-report/analytics
```

#### 9. WhatsApp (`/api/whats-app/*`)
```
POST   /api/whats-app/send
GET    /api/whats-app/status/:messageId
GET    /api/whats-app/templates
```

#### 10. Health Check
```
GET    /api/health
Returns: { status: "ok", timestamp: "ISO-8601", uptime: "seconds" }
```

### Response Format Examples

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "users": [...],
    "total": 100,
    "page": 1
  }
}
```

**Error Response (400/500)**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Email is required"
  }
}
```

---

## Frontend Pages & Components

### Page Organization Summary

| Module | Pages | Purpose |
|--------|-------|---------|
| **Account** | 2 | Login, account settings |
| **Dashboard** | 1 | Main overview & KPIs |
| **Main** | 15+ | Primary MIS views |
| **Report** | 29+ | Comprehensive reporting |
| **Account Reports** | 13+ | Account-specific analytics |
| **New Report** | 6+ | Report creation workflows |
| **Report New** | 9+ | Alternative report views |
| **Lab** | 33+ | Lab operations & testing |
| **Distillery** | 4+ | Production management |
| **Survey** | 1+ | Survey collection |
| **Survey Report** | 13+ | Survey analytics |
| **Tracking** | 10+ | Location & delivery tracking |
| **User Management** | 10+ | User admin panel |
| **WhatsApp** | 12+ | Messaging operations |
| **TOTAL** | **200+** | Comprehensive coverage |

### Key Components

**Shared Components**
- `Header.jsx` - Top navigation bar
- `Sidebar.jsx` - Left navigation menu
- `Layout.jsx` - Main layout wrapper
- `LoadingSpinner.jsx` - Loading indicator
- `DataTable.jsx` - Reusable table component
- `Modal.jsx` - Dialog/modal boxes
- `Form.jsx` - Form wrapper with validation
- `Charts/LineChart.jsx` - Chart wrapper using Recharts
- `Map.jsx` - Map component using Leaflet

**Feature-Specific Components**
- Lab: TestForm, ResultEntry, AnalysisChart
- Report: ReportFilter, ExportButton, PrintLayout
- Tracking: LiveMap, RouteViewer, DeliveryStatus
- Dashboard: MetricCard, KPIChart, StatusWidget

---

## Deployment & Configuration

### Environment Configuration

#### Backend (.env)
```env
# Server configuration
NODE_ENV=development|production
PORT=5000
DEFAULT_SEASON=2526

# Database
SQL_CONN_2526=Server=...;Database=...;User Id=sa;Password=***;
SQL_CONN_DEFAULT=Server=...;Database=...;User Id=sa;Password=***;
SQL_REQUEST_TIMEOUT_MS=30000
SQL_CONNECTION_TIMEOUT_MS=15000
SKIP_DB_CONNECT=false

# Legacy support
ENABLE_LEGACY_SP_FALLBACK=true
LEGACY_BASE_URL=http://legacy-api.local

# JWT & Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/logs/bajaj-mis.log
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_PROXY_TARGET=http://localhost:5000

# App Configuration
VITE_APP_NAME=Bajaj ERP
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development|production
```

### Docker Deployment

**Docker Compose Structure** (`backend/services/docker-compose.yml`)
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "5000:5000"
    depends_on: [auth-service, dashboard-service, report-service]
  
  auth-service:
    build: ./auth-service
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
  
  dashboard-service:
    build: ./dashboard-service
    ports:
      - "5002:5002"
  
  # ... other services
  
  frontend:
    build: ../frontend
    ports:
      - "80:3000"
    depends_on: [api-gateway]
```

### Build & Deploy Process

**Frontend Build**
```bash
cd frontend
npm run build     # Creates dist/ folder
npm run lint      # Code quality check
```

**Backend Build**
```bash
cd backend
npm install       # Install dependencies
npm run build     # If build script exists
npm start         # Start server
```

**Production Deployment**
```bash
# Build Docker images
docker build -t bajaj-mis-backend:latest ./backend
docker build -t bajaj-mis-frontend:latest ./frontend

# Deploy using compose
docker-compose up -d

# Monitor logs
docker-compose logs -f api-gateway
```

---

## Project Structure

### Root Directory Layout

```
BajajMisMernProject/
├── backend/                                # Node.js + Express Backend
│   ├── server.js                          # Server entry point
│   ├── start.js                           # Alternative starter
│   ├── package.json                       # Backend dependencies
│   ├── .env.example                       # Environment template
│   ├── services/                          # Microservices (10 services)
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── dashboard-service/
│   │   ├── distillery-service/
│   │   ├── lab-service/
│   │   ├── report-service/
│   │   ├── survey-service/
│   │   ├── tracking-service/
│   │   ├── user-service/
│   │   ├── whatsapp-service/
│   │   └── docker-compose.yml
│   └── [LEGACY if exists:]
│       ├── src/
│       ├── config/
│       ├── routes/
│       └── controllers/
│
├── frontend/                               # React + Vite Frontend
│   ├── src/
│   │   ├── main.jsx                      # Entry point
│   │   ├── App.jsx                       # Root router
│   │   ├── vite.config.js
│   │   ├── microservices/
│   │   │   └── api.service.js           # Axios client
│   │   ├── components/                  # Reusable components
│   │   ├── pages/                       # Page components (200+)
│   │   ├── styles/                      # CSS/Tailwind configs
│   │   └── assets/                      # Images, icons
│   ├── public/
│   ├── package.json                     # Frontend dependencies
│   ├── .env.example
│   └── vite.config.js
│
├── PROJECT_DETAILED_DOCUMENTATION.txt    # Existing documentation
├── ARCHITECTURE_REFACTOR_BLUEPRINT.txt   # Architecture details
└── COMPLETE_PROJECT_DOCUMENTATION.md   # This file!
```

---

## Running the Project

### Prerequisites

- **Node.js**: v14 or higher
- **npm**: v6 or higher
- **MSSQL Server**: 2019 or higher (or skip with SKIP_DB_CONNECT=true)
- **Git**: For version control

### Development Setup

#### 1. Clone & Install Backend

```bash
cd BajajMisMernProject/backend
npm install
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Start backend
npm start
# Backend will be available at http://localhost:5000
```

#### 2. Clone & Install Frontend

```bash
cd ../frontend
npm install
cp .env.example .env

# Start frontend dev server
npm run dev
# Frontend will be available at http://localhost:5173
```

#### 3. Verify Setup

**Backend Health Check**
```bash
curl http://localhost:5000/api/health
# Expected response: { status: 'ok', ... }
```

**Frontend Access**
```
Navigate to http://localhost:5173
Login with your credentials
```

### Commands Reference

**Backend Commands**
```bash
npm start              # Start server
npm run dev           # Start with nodemon (auto-reload)
npm run lint          # Syntax check
npm run test          # Run tests (if configured)
npm run build         # Build for production
```

**Frontend Commands**
```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run lint          # ESLint check
npm run preview       # Preview production build locally
```

### Troubleshooting Startup

**Backend Won't Connect to Database**
```bash
# Check if database is reachable
ping <DB_SERVER>

# Test connection string
# Verify SQL_CONN_2526 or DB credentials

# Recover with no-database run:
export SKIP_DB_CONNECT=true
npm start
```

**Frontend Cannot Reach API**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check Vite proxy configuration in vite.config.js
# Ensure VITE_API_PROXY_TARGET is correct
```

**Port Already in Use**
```bash
# Kill process on port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>

# Backend will auto-fallback to next available port
```

---

## Development Workflow

### Adding a New Endpoint

1. **Create a new module** (if needed):
   ```bash
   mkdir backend/services/new-service
   cd backend/services/new-service
   ```

2. **Create module files**:
   ```
   new-service/
   ├── controller.js      # HTTP handlers
   ├── service.js         # Business logic
   ├── repository.js      # Database queries
   ├── validation.js      # Input validation
   ├── routes.js          # Endpoint definitions
   └── index.js           # Module exports
   ```

3. **Register in microservices registry**:
   ```javascript
   // backend/src/modules/index.js or similar
   import newServiceRoutes from '../new-service/routes.js';
   
   export const registerModuleRoutes = (app) => {
     app.use('/api/new-service', newServiceRoutes);
   };
   ```

4. **Test endpoint**:
   ```bash
   curl -X GET http://localhost:5000/api/new-service/endpoint \
        -H "Authorization: Bearer <token>"
   ```

### Adding a New Page

1. **Create page component**:
   ```javascript
   // frontend/src/pages/module/PageName.jsx
   export default function PageName() {
     const [data, setData] = useState(null);
     
     useEffect(() => {
       apiService.moduleService.getData()
         .then(setData);
     }, []);
     
     return <div>{/* page content */}</div>;
   }
   ```

2. **Add route in App.jsx**:
   ```javascript
   {
     path: "module/page",
     element: lazy(() => import("@/pages/module/PageName"))
   }
   ```

3. **Test navigation**:
   Navigate to `/module/page` in browser

### Code Style Guidelines

- **Backend**: Node.js + Express conventions, async/await
- **Frontend**: React 19 hooks, functional components, Tailwind classes
- **Database**: Parameterized queries to prevent SQL injection
- **Errors**: Consistent error response format
- **Validation**: Zod schemas for input validation

---

## Known Issues & Limitations

### Current Limitations

1. **182+ Endpoints Still Use Legacy Fallback**
   - Not all endpoints fully migrated from .NET
   - Fallback routes rely on stored procedures or legacy HTTP proxy
   - **Impact**: May see different response times for legacy endpoints
   - **Resolution**: Gradual endpoint migration to Node.js controllers

2. **Database Connectivity Sensitivity**
   - Relies on proper SQL Server configuration
   - Windows Authentication requires ODBC driver setup
   - Connection string must be exact format
   - **Impact**: Application won't run without valid DB config
   - **Workaround**: Use SKIP_DB_CONNECT=true for demo

3. **Large Controller Files**
   - Dashboard, Lab, Tracking, Report controllers are large
   - Mixed business logic and HTTP handling
   - **Impact**: Harder to maintain and test
   - **Roadmap**: Refactor into smaller services

4. **Repeated Query Logic**
   - Similar SQL patterns duplicated across modules
   - **Impact**: Maintenance burden, code duplication
   - **Solution**: Extract common repository helpers

5. **No Automated Testing**
   - Missing unit tests for services
   - Missing integration tests for API endpoints
   - **Impact**: Risk of regressions
   - **Priority**: Add test suite post-MVP

### Known Bugs

None currently documented. Please report issues to the development team.

---

## Migration Status

### Completed Phase

✅ **Frontend**
- Migrated to React 19 with Vite
- All routes implement lazy loading
- API service centralized
- Build passes with no errors

✅ **Backend Structure**
- Modular organization into 8 microservices
- Repository pattern introduced
- Response standardization in progress
- Database abstraction layer created

✅ **Microservice Layering** (Partial)
- Auth service: 100% migrated (Controller → Service → Repository)
- User management: Core APIs migrated
- Tracking: Key endpoints migrated
- Report: Partial migration
- Others: In progress or queued

### In Progress

⏳ **Remaining Endpoint Migrations**
- 163+ endpoints still rely on legacy fallback
- Routes being migrated one-by-one to modern layer
- Target: Achieve 100% Node.js implementation

⏳ **Database Optimization**
- Query performance tuning
- Index creation for heavy reports
- Connection pooling optimization

### Next Phase (Planned)

🔜 **Microservices Extraction**
- Auth service to be extracted first (already layered)
- Followed by User, Report, Tracking
- API Gateway to route between services
- Docker containerization for each service

🔜 **Testing Infrastructure**
- Unit tests for all services
- Integration tests for critical flows
- E2E tests for main user journeys

🔜 **Performance & Monitoring**
- APM integration (New Relic, DataDog)
- Log aggregation (ELK stack)
- Real-time monitoring dashboard

🔜 **CI/CD Pipeline**
- GitHub Actions or GitLab CI
- Automated testing gates
- Staging environment deployment
- Production deployment automation

---

## Future Roadmap

### Q2 2026 - Enhancement Phase

**Backend Improvements**
- Complete all endpoint migrations from legacy to Node.js
- Implement Redis caching for reports
- Add API rate limiting & throttling
- Comprehensive API documentation (Swagger/OpenAPI)

**Frontend Enhancements**
- Add dark mode support
- Implement real-time notifications (WebSocket)
- Advanced search & filtering across all modules
- Offline-first sync capabilities

**Database**
- Migrate to cloud SQL (Azure SQL or AWS RDS)
- Implement database sharding for scale
- Archive old data to cold storage

### Q3 2026 - Extraction Phase

**Microservices Extraction**
- Auth Service independent deployment
- User Service independent deployment
- API Gateway for routing
- Inter-service authentication strategy

**Infrastructure**
- Kubernetes orchestration
- Service mesh (Istio)
- Auto-scaling based on load
- Multi-region deployment

### Q4 2026 - AI & Analytics

**AI Integration**
- Predictive analytics for reports
- Anomaly detection in tracking
- Intelligent report recommendations

**Analytics**
- Real-time dashboard analytics
- Custom KPI builder
- Data export to BI tools (Tableau, Power BI)

### 2027 - Innovation

**Mobile App**
- React Native mobile application
- Offline mode for tracking
- Push notifications

**Advanced Features**
- Machine learning models for optimization
- IoT device integration
- Blockchain audit trail (optional)

---

## Project Statistics

### Code Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| API Endpoints | 333+ | Total across all microservices |
| Frontend Pages | 200+ | Route-lazy loaded components |
| Backend Modules | 8 | Auth, User, Dashboard, Report, Tracking, Distillery, Lab, Survey, WhatsApp |
| Database Tables | 50+ | Estimated based on functionality |
| Deployed Microservices | 10 | API Gateway + 9 services |
| NPM Dependencies | 50+ | Frontend + Backend combined |
| Configuration Options | 20+ | Environment variables |
| Lines of Code | 100K+ | Estimated across codebase |

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Page Load Time | < 3s | In development |
| API Response Time | < 500ms | Dependent on DB |
| Concurrent Users | 1000+ | Scalable architecture |
| Database Throughput | 100+ QPS | Needs optimization |
| Frontend Bundle Size | < 500KB | Achieved with code-splitting |
| Build Time | < 2min | Vite optimized |

---

## Support & Contact

### Getting Help

1. **Documentation**: Refer to existing files in project root
2. **Code Comments**: Check inline documentation in modules
3. **Git History**: Review commits for context
4. **Team**: Contact development team for clarifications

### Contributing

1. Create feature branch: `git checkout -b feature/module-name`
2. Follow code style guidelines
3. Test thoroughly before PR
4. Update documentation for new features

### Reporting Issues

Report bugs with:
- Descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-07 | 1.0 | Architecture refactor, microservices structure |
| 2026-02-28 | 0.9 | Frontend Vite migration, lazy loading |
| 2026-02-15 | 0.8 | Backend modular organization |
| 2026-01-01 | 0.1 | Initial MERN project setup |

---

## Document Information

- **Document Title**: Complete BajajMisMern Project Documentation
- **Created**: March 8, 2026
- **Last Updated**: March 8, 2026
- **Status**: Complete & Comprehensive
- **Audience**: Developers, Technical Leads, Project Managers
- **Revision**: 1.0

---

*For the most up-to-date information, please refer to the backend and frontend `README.md` files and inline code documentation.*

**END OF DOCUMENT**
