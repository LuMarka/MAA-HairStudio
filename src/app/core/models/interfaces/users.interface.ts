// ========== INTERFACES ==========

/**
 * Usuario básico
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'custom';
  createdAt: string;
  updatedAt: string;
}

/**
 * Estadísticas de usuario
 */
export interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  ordersByStatus: Record<string, number>;
  monthlyOrdersCount: Array<{ month: string; count: number }>;
  favoriteProducts: Array<{
    id: string;
    name: string;
    purchaseCount: number;
  }>;
}

/**
 * Perfil completo de usuario
 */
export interface UserProfile {
  user: User;
  statistics: UserStatistics;
}

/**
 * Resumen de usuario para admin
 */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'custom';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  memberSince: string;
}

/**
 * Estadísticas simples
 */
export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

/**
 * Respuesta paginada de usuarios
 */
export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Respuesta de órdenes de usuario
 */
export interface UserOrdersResponse {
  user: User;
  orders: {
    data: Array<{
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * DTOs para operaciones
 */
export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyResetCodeDto {
  code: string;
}

export interface ResetPasswordDto {
  code: string;
  newPassword: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface UpdateRoleDto {
  role: 'user' | 'admin' | 'custom';
}

export interface UpdatePasswordDto {
  newPassword: string;
}

/**
 * Respuestas de la API
 */
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  success?: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  expiresInMinutes: number;
}

export interface VerifyCodeResponse {
  valid: boolean;
  email?: string;
  expiresAt?: string;
}

export interface CleanCodesResponse {
  cleaned: number;
}
