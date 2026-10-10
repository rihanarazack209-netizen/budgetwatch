# AI-Based Budget Utilization Monitoring System (BudgetWatch)

A centralized digital platform designed for government ministries, audit bodies (such as the **Comptroller and Auditor General of India - CAG**), and enterprise organizations to track budget allocation, operational expenditures, and utilization velocity in real time using analytical rule engines and anomaly detection.

---

## 🏛️ Project Overview & Architecture

### **Technology Stack: MEAN**
* **MongoDB:** Schemas with virtual fields for real-time utilization rates, audit logging, and threshold settings.
* **Express.js & Node.js:** Secure RESTful API, JWT role-based access control (RBAC), automatic daily cron jobs, and document upload handling.
* **Angular 17 (Standalone):** Reactive forms, Angular Material design, Chart.js / ng2-charts visual dashboards, and export generators.

```
UNIFIED PROJECTT 1/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── models/          # User, Department, Budget, Expenditure, Alert, AuditLog, Settings
│   │   ├── controllers/     # Auth, Department, Budget, Expenditure, Alert, Monitoring, Report, Admin
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/      # JWT auth, role authorization, automated audit logging
│   │   └── utils/           # Rule-based AI anomaly engine & realistic database seeder
│   ├── uploads/             # Supporting document voucher repository
│   ├── server.js            # Express server & cron scheduler
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/        # Models, services, guards, interceptors
    │   │   ├── layout/      # Enterprise sidebar and top header
    │   │   └── pages/       # 7 interconnected functional modules:
    │   │       ├── login/
    │   │       ├── dashboard/
    │   │       ├── budget-management/
    │   │       ├── expenditure/
    │   │       ├── monitoring/
    │   │       ├── alerts/
    │   │       ├── reports/
    │   │       └── admin/
    │   └── styles.scss      # Indian Government Finance design system
    └── package.json
```

---

## 🚀 Key Functional Modules

1. **Dashboard & Executive Analytics (`/dashboard`)**
   - High-level KPIs: Total Budget Allocation, Total Expenditure, Overall Utilization %, Active Departments, Active Alerts, Pending Claims.
   - Interactive Visualizations: Monthly spending trends (Line Chart) and category distribution (Doughnut Chart).
   - Real-time feeds of recent transactions and critical alerts.

2. **Budget Allocation & Management (`/budgets`)**
   - Annual & scheme allocations across ministries (e.g., Samagra Shiksha, Ayushman Bharat, Bharatmala).
   - Real-time utilization calculation, balance tracking, and status management.

3. **Expenditure & Transaction Tracking (`/expenditure`)**
   - Department-wise claim submissions, expense categorization (salaries, infrastructure, operations, procurement, IT, etc.).
   - Support voucher document attachments (`.pdf`, `.jpg`, `.xlsx`, `.docx`).
   - Two-step authorization: Finance Officer & Administrator approval/rejection workflows.

4. **Real-Time Monitoring & Anomaly Detection Engine (`/monitoring`)**
   - Departmental health profiling and time-elapsed benchmark analysis.
   - Rule-based AI anomaly detection engine:
     - **Rule 1 (Under-utilization):** Flag schemes with &lt; 40% spent when &gt; 70% of fiscal period has elapsed.
     - **Rule 2 (Overspending):** Immediate critical alert when cumulative vouchers exceed allocation.
     - **Rule 3 (Spending Spike):** Detects single voucher &gt; 30% of total allocation or &gt; 3x historical average.
     - **Rule 4 (Prolonged Inactivity):** Flags idle schemes with zero voucher activity for 30+ days.
   - Manual & automated cron trigger (daily scheduled run at midnight).

5. **Alerts & Notification Center (`/alerts`)**
   - Severity categorization: Critical, High, Medium, Low.
   - Filter by alert category and resolution status.
   - Read receipts and audit resolution attribution.

6. **Statutory Reports & Dossiers (`/reports`)**
   - Dynamic departmental budget reconciliation tables.
   - Direct export to **CSV** and formatted **PDF** documents.

7. **System Administration & Governance (`/admin`)**
   - Role-Based Access Control (RBAC): `admin`, `finance_officer`, `department_head`.
   - Department registry and user credential provisioning.
   - Configurable surveillance thresholds.
   - Immutable audit trail recording user, action, target entity, timestamp, and IP address.

---

## 🔑 Default Test Credentials

All pre-seeded accounts come pre-configured with authentic departmental data:

| Role | Email | Password | Department |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@budgetwatch.gov.in` | `Admin@123` | Headquarters / CAG Audit |
| **Finance Officer** | `priya.sharma@budgetwatch.gov.in` | `User@123` | Ministry of Education |
| **Finance Officer** | `arjun.mehta@budgetwatch.gov.in` | `User@123` | Ministry of Health & Family Welfare |
| **Department Head** | `sunita.patel@budgetwatch.gov.in` | `User@123` | Ministry of Education |
| **Department Head** | `vikram.singh@budgetwatch.gov.in` | `User@123` | Ministry of Health & Family Welfare |
| **Department Head** | `meena.gupta@budgetwatch.gov.in` | `User@123` | Ministry of Road Transport & Highways |

---

## 🛠️ Setup & Running Locally

### 1. Backend Setup
```bash
cd backend
npm install
# Seed the database with realistic Indian government ministries and vouchers:
npm run seed
# Start the API server:
npm start
```
*API will be active at:* `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
# Start development server:
npm start
```
*Application will be active at:* `http://localhost:4200`

---

## ☁️ Deployment Guidelines

- **Backend:** Ready for deployment to **Render**, **Railway**, or **AWS EC2** (configure `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` in environment variables).
- **Frontend:** Build output in `frontend/dist/frontend/browser` is pre-configured for static hosting on **Vercel**, **Netlify**, or **AWS S3 / CloudFront**.
