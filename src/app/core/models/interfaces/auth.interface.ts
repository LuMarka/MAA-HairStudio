export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  expiresIn: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user: User;
  expiresIn: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
  error?: string;
}
