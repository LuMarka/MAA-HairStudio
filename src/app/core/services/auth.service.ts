import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  User,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  RefreshTokenResponse,
  VerifyTokenResponse,
  LogoutResponse,
  ApiError
} from '../models/interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // URLs de la API
  private readonly authUrl = `${environment.apiUrl}auth`;

  // Claves para almacenamiento seguro
  private readonly TOKEN_KEY = 'maa_access_token';
  private readonly USER_KEY = 'maa_user_data';
  private readonly TOKEN_EXPIRY_KEY = 'maa_token_expiry';

  // Signals para estado reactivo
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Timer para auto-renovación de token
  private refreshTimer?: ReturnType<typeof setTimeout>;

  // Computed values públicos
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isUser = computed(() => this.currentUserSignal()?.role === 'user');

  constructor() {
    this.initializeAuth();
  }

  // ========== INICIALIZACIÓN ==========

  /**
   * Inicializa la autenticación al cargar la aplicación
   * Restaura el estado desde localStorage después de refresh/F5
   */
  private initializeAuth(): void {
    const storedUser = this.getStoredUser();
    const token = this.getToken();
    const tokenExpiry = this.getTokenExpiry();

    if (storedUser && token && tokenExpiry && this.isTokenValid(tokenExpiry)) {
      // Restaurar estado válido desde localStorage
      this.currentUserSignal.set(storedUser);
      this.scheduleTokenRefresh(tokenExpiry);
    } else {
      // Limpiar datos inválidos o expirados
      this.clearAuthData();
    }
  }

  // ========== ENDPOINTS PÚBLICOS ==========

  /**
   * 1. Registrar Usuario - POST /api/v1/auth/register
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.post<RegisterResponse>(`${this.authUrl}/register`, data).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 2. Iniciar Sesión - POST /api/v1/auth/login
   */
  login(data: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.post<LoginResponse>(`${this.authUrl}/login`, data).pipe(
      tap(response => {
        this.setAuthData(response);

        // Navegar según el rol
        const redirectPath = response.user.role === 'admin' ? '/admin' : '/';
        this.router.navigate([redirectPath]);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  // ========== ENDPOINTS AUTENTICADOS ==========

  /**
   * 3. Obtener Perfil - GET /api/v1/auth/profile
   */
  getProfile(): Observable<ProfileResponse> {
    this.isLoadingSignal.set(true);

    return this.http.get<ProfileResponse>(`${this.authUrl}/profile`).pipe(
      tap(response => {
        this.currentUserSignal.set(response.user);
        this.storeUser(response.user);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 4. Cambiar Contraseña - PATCH /api/v1/auth/change-password
   */
  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    this.isLoadingSignal.set(true);
    this.clearError();

    return this.http.patch<ChangePasswordResponse>(`${this.authUrl}/change-password`, data).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * 5. Renovar Token - POST /api/v1/auth/refresh
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.authUrl}/refresh`, {}).pipe(
      tap(response => {
        this.setToken(response.access_token);
        const newExpiry = this.calculateTokenExpiry('3600s'); // Asumir 1 hora
        this.setTokenExpiry(newExpiry);
        this.scheduleTokenRefresh(newExpiry);
        console.log('Token renovado exitosamente');
      }),
      catchError(() => {
        console.error('Error renovando token, cerrando sesión');
        this.forceLogout();
        return throwError(() => new Error('No se pudo renovar la sesión'));
      })
    );
  }

  /**
   * 6. Verificar Token - GET /api/v1/auth/verify
   */
  verifyToken(): Observable<VerifyTokenResponse> {
    return this.http.get<VerifyTokenResponse>(`${this.authUrl}/verify`).pipe(
      tap(response => {
        if (response.valid && response.user) {
          this.currentUserSignal.set(response.user);
          this.storeUser(response.user);
          const newExpiry = this.calculateTokenExpiry(response.expiresIn);
          this.setTokenExpiry(newExpiry);
          this.scheduleTokenRefresh(newExpiry);
        } else {
          this.clearAuthData();
        }
      }),
      catchError(() => {
        this.clearAuthData();
        return EMPTY;
      })
    );
  }

  /**
   * 7. Cerrar Sesión - POST /api/v1/auth/logout
   */
  logout(): Observable<LogoutResponse> {
    this.clearRefreshTimer();

    return this.http.post<LogoutResponse>(`${this.authUrl}/logout`, {}).pipe(
      catchError(() => EMPTY),
      finalize(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      })
    );
  }

  // ========== MÉTODOS UTILITARIOS ==========

  /**
   * Obtiene el token desde localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verifica si hay un token válido
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    const expiry = this.getTokenExpiry();

    if (!token || !expiry) return false;
    return this.isTokenValid(expiry);
  }

  /**
   * Verifica el estado actual de autenticación
   */
  isCurrentlyAuthenticated(): boolean {
    const user = this.currentUserSignal();
    const token = this.getToken();
    const expiry = this.getTokenExpiry();

    return !!(user && token && expiry && this.isTokenValid(expiry));
  }

  /**
   * Limpia mensajes de error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Establece un mensaje de error
   */
  setError(error: string): void {
    this.errorSignal.set(error);
  }

  /**
   * Fuerza el logout sin llamar al servidor
   */
  forceLogout(): void {
    this.clearRefreshTimer();
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  // ========== MÉTODOS PRIVADOS ==========

  private setAuthData(loginResponse: LoginResponse): void {
    const expiry = this.calculateTokenExpiry(loginResponse.expiresIn);

    this.setToken(loginResponse.access_token);
    this.currentUserSignal.set(loginResponse.user);
    this.setTokenExpiry(expiry);
    this.storeUser(loginResponse.user);
    this.scheduleTokenRefresh(expiry);
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private storeUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setTokenExpiry(expiry: number): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
    }
  }

  private getTokenExpiry(): number | null {
    if (typeof window === 'undefined') return null;

    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }

  private isTokenValid(expiry: number): boolean {
    const currentTime = Date.now();
    return expiry > currentTime + 60000; // Válido si faltan más de 1 minuto
  }

  private calculateTokenExpiry(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd]?)/);
    if (!match) return Date.now() + 3600000; // Default 1 hora

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };

    return Date.now() + (value * (multipliers[unit] || 1000));
  }

  private scheduleTokenRefresh(expiryTime: number): void {
    this.clearRefreshTimer();

    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refrescar 5 minutos antes de que expire, mínimo 1 minuto
    const refreshTime = Math.max(timeUntilExpiry - 300000, 60000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          error: () => this.forceLogout()
        });
      }, refreshTime);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }

    this.currentUserSignal.set(null);
    this.clearError();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const apiError = error.error as ApiError;

      switch (error.status) {
        case 400:
          errorMessage = apiError?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Credenciales incorrectas';
          break;
        case 403:
          errorMessage = 'No tienes permisos para esta acción';
          break;
        case 409:
          errorMessage = apiError?.message || 'Ya existe un usuario con este correo electrónico';
          break;
        case 422:
          errorMessage = apiError?.message || 'Datos de validación incorrectos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = apiError?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.errorSignal.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
