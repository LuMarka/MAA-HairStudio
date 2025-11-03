// src/app/auth/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { catchError, tap, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  User,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  RefreshTokenResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ConfirmResetPasswordRequest,
  AuthError
} from '../models/interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = `${environment.apiUrl}auth`;
  private readonly tokenKey = 'access_token';
  private readonly refreshTimerKey = 'refresh_timer';

  // Signals para el estado de autenticación
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  // Computed values
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isUser = computed(() => this.currentUserSignal()?.role === 'user');

  // BehaviorSubject para mantener compatibilidad con observables si es necesario
  private readonly authStateSubject = new BehaviorSubject<User | null>(null);
  readonly authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  // Métodos públicos de autenticación
  register(registerData: RegisterRequest): Observable<User> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<User>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(user => {
          console.log('Usuario registrado exitosamente:', user);
        }),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          this.setAuthData(response);
          this.scheduleTokenRefresh(response.expiresIn);
        }),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  logout(): void {
    this.clearAuthData();
    this.clearRefreshTimer();
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<ProfileResponse> {
    this.setLoading(true);

    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile`)
      .pipe(
        tap(response => {
          this.setUser(response.user);
        }),
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<ChangePasswordResponse>(`${this.apiUrl}/change-password`, passwordData)
      .pipe(
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, {})
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          // Asumir 1 hora de expiración si no se proporciona
          this.scheduleTokenRefresh('3600s');
        }),
        catchError(error => {
          this.logout();
          return this.handleError(error);
        })
      );
  }

  verifyToken(): Observable<VerifyTokenResponse> {
    return this.http.get<VerifyTokenResponse>(`${this.apiUrl}/verify`)
      .pipe(
        tap(response => {
          if (response.valid) {
            this.setUser(response.user);
            this.scheduleTokenRefresh(response.expiresIn);
          } else {
            this.logout();
          }
        }),
        catchError(error => {
          this.logout();
          return this.handleError(error);
        })
      );
  }

  resetPassword(email: string): Observable<ResetPasswordResponse> {
    this.setLoading(true);
    this.clearError();

    const resetData: ResetPasswordRequest = { email };

    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, resetData)
      .pipe(
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  confirmResetPassword(resetData: ConfirmResetPasswordRequest): Observable<ChangePasswordResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/confirm-reset-password`, resetData)
      .pipe(
        catchError(error => this.handleError(error)),
        tap(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // Métodos privados
  private initializeAuth(): void {
    const token = this.getToken();
    if (token && this.hasValidToken()) {
      this.verifyToken().pipe(take(1)).subscribe({
        error: () => this.logout()
      });
    } else if (token) {
      this.logout();
    }
  }

  private setAuthData(loginResponse: LoginResponse): void {
    this.setToken(loginResponse.access_token);
    this.setUser(loginResponse.user);
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private setUser(user: User): void {
    this.currentUserSignal.set(user);
    this.authStateSubject.next(user);
  }

  private setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUserSignal.set(null);
    this.authStateSubject.next(null);
    this.clearError();
  }

  private scheduleTokenRefresh(expiresIn: string): void {
    this.clearRefreshTimer();

    const expirationMs = this.parseExpirationTime(expiresIn);
    // Refrescar 5 minutos antes de que expire
    const refreshTime = Math.max(expirationMs - 300000, 60000);

    const refreshTimer = timer(refreshTime).pipe(
      switchMap(() => this.refreshToken()),
      take(1)
    ).subscribe({
      error: () => this.logout()
    });

    if (typeof window !== 'undefined') {
      (window as any)[this.refreshTimerKey] = refreshTimer;
    }
  }

  private clearRefreshTimer(): void {
    if (typeof window !== 'undefined') {
      const timer = (window as any)[this.refreshTimerKey];
      if (timer) {
        timer.unsubscribe();
        delete (window as any)[this.refreshTimerKey];
      }
    }
  }

  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd]?)/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };

    return value * (multipliers[unit] || 1000);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      const authError = error.error as AuthError;
      errorMessage = authError?.message || `Error ${error.status}: ${error.statusText}`;
    }

    this.errorSignal.set(errorMessage);
    console.error('Error en AuthService:', error);

    return throwError(() => new Error(errorMessage));
  }
}

