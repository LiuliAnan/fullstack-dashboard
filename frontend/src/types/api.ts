export interface User {
  id: number;
  email: string;
  createdAt?: string;
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