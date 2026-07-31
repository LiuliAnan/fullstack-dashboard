export interface User {
  id: number;
  email: string;
  createdAt?: string;
}

// 用户列表项（联表 user + user_profile 的结果）
export interface UserListItem {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt?: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Editor' | 'User';
export type UserStatus = 'active' | 'banned' | 'pending';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;

// 公司
export interface Company {
  company_code: string;
  company_name: string;
  level: number;
  country: string;
  city: string;
  founded_year: number;
  annual_revenue: number;
  employees: number;
  parent_company: string | null;
  parent_company_name?: string | null;
  profit_efficiency?: number;
}

export interface SignUpDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}