export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_officer' | 'department_head';
  department?: { _id: string; name: string; code: string };
  departmentId?: any;
  lastLogin?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Budget {
  _id: string;
  budgetCode: string;
  financialYear: string;
  departmentId: { _id: string; name: string; code: string } | string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed' | 'suspended';
  notes?: string;
  createdBy?: { name: string };
  createdAt: string;
}

export interface BudgetSummary {
  totalAllocated: number;
  totalSpent: number;
  avgUtilization: number;
  totalBudgets: number;
}

export interface BudgetFilter {
  financialYear?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headUserId?: { name: string; email: string };
  isActive: boolean;
  totalAllocated?: number;
  totalSpent?: number;
  utilization?: number;
  activeBudgets?: number;
  createdAt?: string;
}

export interface Expenditure {
  _id: string;
  transactionId: string;
  budgetId: { _id: string; budgetCode: string; financialYear: string; allocatedAmount?: number } | string;
  departmentId: { _id: string; name: string; code: string } | string;
  amount: number;
  expenseCategory: string;
  description: string;
  date: string;
  supportingDocument?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: { name: string };
  approvedAt?: string;
  rejectionReason?: string;
  createdBy?: { name: string };
  createdAt: string;
}

export interface Alert {
  _id: string;
  alertCode: string;
  departmentId: { _id: string; name: string; code: string };
  budgetId: { _id: string; budgetCode: string; financialYear: string; allocatedAmount: number; spentAmount: number };
  alertType: 'under_utilization' | 'overspending' | 'spending_spike' | 'threshold_breach' | 'inactivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: { name: string };
  resolvedAt?: string;
  createdAt: string;
}

export interface AlertStats {
  summary: { total: number; unread: number; unresolved: number; critical: number; high: number };
  byType: { _id: string; count: number }[];
}

export interface DashboardStats {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  activeBudgets: number;
  activeDepartments: number;
  totalAlerts: number;
  criticalAlerts: number;
  pendingExpenditures: number;
  recentTransactions: Expenditure[];
  recentAlerts: Alert[];
  monthlyTrend: { _id: { year: number; month: number }; total: number; count: number }[];
}

export interface DepartmentUtilization {
  _id: string;
  departmentName: string;
  departmentCode: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  budgetCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { total: number; page: number; pages: number };
}
