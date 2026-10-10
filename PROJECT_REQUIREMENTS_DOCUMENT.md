# Project Requirements Document (PRD)
## AI-Based Budget Utilization Monitoring System (BudgetWatch)

**Collaborating Organizations:** [Unified Mentor](https://www.unifiedmentor.com/) | [CAG of India Reference](https://www.cag.gov.in/) | [Open Budget Portal](https://www.internationalbudget.org/)  
**Version:** 1.0.0 (Production Release)  
**Architecture:** MEAN Stack (MongoDB, Express.js, Angular 17, Node.js)

---

### 1. Executive Summary & Problem Statement
Government departments, public sector undertakings (PSUs), and enterprise organizations manage substantial annual budgets allocated across multiple schemes, ministries, and operational units. Traditional monitoring methods depend on periodic manual reporting, spreadsheets, or disconnected financial systems. This leads to:
- Lack of real-time visibility into budget utilization velocity.
- Delayed identification of under-utilized funds (often discovered only at the close of the financial cycle).
- Risk of fund leakage, overspending, and irregular transaction spikes.
- Manual data entry delays and limited auditability across inter-departmental flows.

**BudgetWatch** solves this by establishing a centralized digital platform that continuously evaluates approved budget allocation versus actual expenditures, automatically flagging anomalies and enforcing accountability across roles.

---

### 2. Primary & Secondary Objectives
#### Primary Objectives:
1. **Real-time Digital Tracking:** Monitor budget allocation and expenditures in Indian Rupees (INR) across ministries.
2. **Dynamic Utilization Calculation:** Real-time computation of utilization rates and remaining balances.
3. **Automated Anomaly Detection:** Rule-based surveillance engine for under-spending, budget overruns, transaction spikes, and idle funds.
4. **Transparency & Role Accountability:** Strict Role-Based Access Control (Admin, Finance Officer, Department Head).

#### Secondary Objectives:
1. Enable data-backed financial decision-making.
2. Eliminate spreadsheet reliance through digital voucher records and document attachments.
3. Provide visual KPI dashboards and downloadable reports (CSV & PDF).

---

### 3. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 Angular 17 Client Tier                      │
│   (Standalone Components, Material Design, Chart.js Visuals)│
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTPS / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  Node.js / Express Tier                     │
│  ├── JWT Authentication & Role Authorization (RBAC)         │
│  ├── Anomaly Detection Engine (4 Algorithmic Rules)         │
│  ├── Multer Voucher Document Management                     │
│  ├── Node-Cron Scheduled Auditing (Midnight Runs)           │
│  └── PDFKit & XLSX Export Generators                        │
└──────────────────────────────▲──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                    MongoDB Database                         │
│  (Users, Departments, Budgets, Expenditures, Alerts, Logs)  │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Functional Specification & Page Implementations

The application delivers **8 interconnected functional modules**:

| # | Page / Module | Route | Access Level | Description |
|---|---|---|---|---|
| 1 | **Authentication** | `/login` | Public | Secure credential access with institutional branding and quick-switch demo roles. |
| 2 | **Executive Dashboard** | `/dashboard` | All Authenticated | High-level KPIs, 6-month spending velocity curve, expense categories doughnut chart, and quick-action transaction/alert feeds. |
| 3 | **Budget Management** | `/budgets` | Admin, Finance Officer, Dept Head | Scheme creation, fiscal allocation, balance tracking, utilization progress bars, status updates. |
| 4 | **Expenditure Tracking** | `/expenditure` | Admin, Finance Officer, Dept Head | Voucher submission, category tagging, document attachments, and two-step approval/rejection workflows. |
| 5 | **Monitoring & Detection** | `/monitoring` | All Authenticated | Department risk profiling, FY elapsed time indicators, and manual trigger for the analytical engine. |
| 6 | **Alerts Center** | `/alerts` | All Authenticated | Severity-tiered warnings (Critical, High, Medium, Low), read status tracking, and audit resolution notes. |
| 7 | **Audit Reports** | `/reports` | All Authenticated | Departmental accounts reconciliation tables, visual allocation vs. expenditure bars, and one-click PDF/CSV exports. |
| 8 | **Admin Governance** | `/admin` | Admin Only | User provisioning, ministry registration, threshold adjustments, and immutable cryptographic audit trails. |

---

### 5. Anomaly Detection Engine Specification

The surveillance engine evaluates four explicit governance rules:

1. **Under-Utilization Rule:**  
   $$\text{Triggered when: } \text{Utilization Rate} < 40\% \quad \text{AND} \quad \text{Time Elapsed} \ge 70\%$$
   *Purpose:* Prevents year-end fiscal lapse and flags stagnant developmental initiatives.

2. **Budget Overrun / Overspending Rule:**  
   $$\text{Triggered when: } \text{Cumulative Expenditures} > \text{Allocated Amount}$$
   *Purpose:* Immediate critical warning and halts further transaction approvals.

3. **Spending Spike Rule:**  
   $$\text{Triggered when: } \text{Transaction Amount} \ge 30\% \text{ of Total Budget} \quad \text{OR} \quad \text{Amount} \ge 3 \times \overline{\text{Historical Average}}$$
   *Purpose:* Detects unbudgeted procurement surges or potential fund diversion.

4. **Prolonged Inactivity Rule:**  
   $$\text{Triggered when: } \text{No Transactions for } \ge 30\text{ days while Utilization } < 90\%$$
   *Purpose:* Highlights dormant allocations needing re-deployment to priority schemes.

---

### 6. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Administrator | Finance Officer | Department Head |
|---|:---:|:---:|:---:|
| View Dashboard & Analytics | ✅ | ✅ | ✅ (Own Dept) |
| Create / Allocate Budget | ✅ | ✅ | ❌ |
| Record Expenditure | ✅ | ✅ | ❌ |
| Approve / Reject Expenditure | ✅ | ✅ | ❌ |
| Run Anomaly Detection Engine | ✅ | ✅ | ❌ |
| Mark / Resolve Alerts | ✅ | ✅ | ❌ |
| Export PDF / CSV Reports | ✅ | ✅ | ✅ |
| Manage Users & Departments | ✅ | ❌ | ❌ |
| Configure Engine Thresholds | ✅ | ❌ | ❌ |
| Access Audit Trail Logs | ✅ | ❌ | ❌ |

---

### 7. Non-Functional & Security Requirements
- **Security:** Passwords encrypted using `bcrypt` (10 salt rounds); API secured using stateless JWT with authorization guards; HTTP headers protected via `helmet`; API rate limiting via `express-rate-limit`.
- **Accuracy:** All computations rounded and formatted to 2 decimal places with strict balance verification before transaction writes.
- **Data Integrity:** MongoDB transactional virtuals prevent desynchronization between expenditure sums and budget balances.
- **Portability:** Built for one-click cloud deployment on Render/Railway (Backend) and Vercel/Netlify (Frontend).
