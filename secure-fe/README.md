# SecuroSense - AI-Powered QA & Call Analysis Platform

SecuroSense is an advanced Call Quality Assurance (QA) and Analysis platform designed to help organizations improve their customer interactions. It leverages AI to transcribe calls, analyze sentiment, scoring compliance against customizable QA templates, and provide actionable insights.

## 🚀 Features

- **Multi-Tenant Architecture**: Supports multiple Organizations with strict data isolation.
- **Role-Based Access Control (RBAC)**:
    - **Super Admin**: System-wide control, manages all organizations and global settings.
    - **Business Admin**: Manages their specific Organization, Teams, and Users.
    - **QA Manager / Team Lead / Agent**: Specialized roles for operational workflows.
- **AI Call Analysis**: Automated transcription, sentiment analysis, topic detection, and compliance scoring (Pass/Fail) based on QA parameters.
- **QA Template Management**:
    - **Global Parameters**: Library of standard QA criteria managed by Super Admin.
    - **Private Parameters**: Organization-specific criteria managed by Business Admins.
    - **Dynamic Templates**: Create mixed templates using both global and private parameters.
- **Team Management**: Organize users into teams and assign specific QA templates to tracking performance.
- **Dashboard & Analytics**: Visualization of call metrics, agent performance, and compliance trends.
- **PDF Reporting**: Generate detailed PDF reports for individual call analyses.

## 🛠 Tech Stack

- **Frontend**: Angular 19+ (Standalone Components, TailwindCSS)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini (Configurable)
- **Authentication**: JWT-based Auth
- **Documentation**: Swagger UI

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v13 or higher running locally or accessible via URL
- **Google AI API Key**: For Gemini integration

---

## ⚙️ Usage & Installation

### 1. Database Setup
Create a PostgreSQL database for the project:
```bash
# Terminal command (if postgres is installed locally)
createdb mvp_db

# OR run SQL via a client (pgAdmin, DBeaver)
CREATE DATABASE mvp_db;
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

**Environment Configuration (.env)**
Create a `.env` file in the `backend/` directory with the following content:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mvp_db?schema=public"
PORT=3000
JWT_SECRET="your_strong_jwt_secret"
JWT_REFRESH_SECRET="your_strong_refresh_secret"
GOOGLE_AI_KEY="your_google_gemini_api_key"
```

**Initialize Database & Seed Data**
This runs the migrations and creates default roles/users.
```bash
# In backend/ directory
npx prisma migrate reset --force
npm run seed
```

**Start Backend Server**
```bash
npm run dev
```
Server runs on: `http://localhost:3000`
Swagger Docs: `http://localhost:3000/api-docs`

### 3. Frontend Setup
Open a new terminal, navigate to the project root:
```bash
npm install
ng serve
```
Application runs on: `http://localhost:4200`

---

## 🔑 Default Credentials

After running the seed script, the following default accounts are available:

### Platform Super Admin
*System Owner - Has access to everything globally.*
- **Email:** `superadmin@securosense.com`
- **Password:** `password123`

---

## 📖 User Guide

### QA Parameter System
The system uses a hybrid parameter model:
1.  **Global Parameters**: Created by **Super Admin**. Visible to ALL organizations. Useful for standard compliance checks (e.g., "Greeting", "Closing").
2.  **Private Parameters**: Created by **Business Admin**. Visible ONLY to their organization. Useful for specific scripts or business rules.

**Workflow:**
1.  **Super Admin** populates the Global Library.
2.  **Business Admin** logs in, views Global params, and adds any Organization-specific Private params.
3.  **Business Admin** creates a **QA Template** selecting a mix of Global and Private parameters.
4.  **Business Admin** assigns the Template to a **Team**.
5.  All calls analyzed for agents in that Team will use the assigned Template's criteria.

---

## 🧪 Running Tests

```bash
# Frontend Tests
ng test

# Backend Tests (if available)
cd backend && npm test
```
