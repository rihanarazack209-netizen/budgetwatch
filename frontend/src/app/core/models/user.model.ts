export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_officer' | 'department_head';
  department?: { _id: string; name: string; code: string };
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
