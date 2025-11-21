// Interfaces de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Interfaces para Registro
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface RegisterResponse extends User {}

// Interfaces para Login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  expiresIn: string;
}

// Interfaces para Perfil
export interface ProfileResponse {
  message: string;
  user: User;
}

// Interfaces para Cambio de Contraseña
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// Interfaces para Token
export interface RefreshTokenResponse {
  access_token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user: User;
  expiresIn: string;
}

// Interfaces para Logout
export interface LogoutResponse {
  message: string;
}

// Interface para Errores de API
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Estado de Autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}