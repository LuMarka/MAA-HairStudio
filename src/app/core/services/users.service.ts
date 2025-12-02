import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ForgotPasswordDto, User, ForgotPasswordResponse, VerifyResetCodeDto, ApiResponse, CleanCodesResponse, ResetPasswordDto, UpdatePasswordDto, UpdateRoleDto, UpdateUserDto, UserOrdersResponse, UserProfile, UsersResponse, UserStatistics, UserStats, UserSummary, VerifyCodeResponse } from '../models/interfaces/users.interface';


@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}users`;

  // ========== SIGNALS - Estado interno ==========
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _currentUser$ = new BehaviorSubject<User | null>(null);

  // ========== COMPUTED - Estado público ==========
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly currentUser = computed(() => this._currentUser$.value);

  // ========== MÉTODOS PÚBLICOS - ENDPOINTS SIN AUTENTICACIÓN ==========

  /**
   * Solicita un código de recuperación de contraseña
   *
   * @param data - Email del usuario
   * @returns Observable con la respuesta
   */
  forgotPassword(data: ForgotPasswordDto): Observable<ForgotPasswordResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, data).pipe(
      tap((response) => {
        console.log('✅ Código de recuperación enviado:', response.message);
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, 'solicitar código de recuperación')
      ),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Verifica si un código de recuperación es válido
   *
   * @param data - Código de 6 dígitos
   * @returns Observable con la respuesta
   */
  verifyResetCode(data: VerifyResetCodeDto): Observable<VerifyCodeResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/verify-reset-code`, data).pipe(
      tap((response) => {
        console.log('✅ Código verificado:', response.valid);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'verificar código')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Resetea la contraseña usando un código de recuperación
   *
   * @param data - Código y nueva contraseña
   * @returns Observable con la respuesta
   */
  resetPassword(data: ResetPasswordDto): Observable<ApiResponse<null>> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/reset-password`, data).pipe(
      tap((response) => {
        console.log('✅ Contraseña actualizada:', response.message);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'resetear contraseña')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // ========== MÉTODOS PÚBLICOS - USUARIO AUTENTICADO ==========

  /**
   * Obtiene el perfil completo del usuario autenticado
   *
   * @returns Observable con perfil y estadísticas
   */
  getMyProfile(): Observable<UserProfile> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<UserProfile>(`${this.apiUrl}/me/profile`).pipe(
      tap((profile) => {
        this._currentUser$.next(profile.user);
        console.log('✅ Perfil cargado:', profile.user.name);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar perfil')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene las órdenes del usuario autenticado
   *
   * @param page - Número de página
   * @param limit - Items por página
   * @returns Observable con órdenes paginadas
   */
  getMyOrders(page = 1, limit = 10): Observable<UserOrdersResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<UserOrdersResponse>(`${this.apiUrl}/me/orders`, { params }).pipe(
      tap((response) => {
        console.log(`✅ Órdenes cargadas: ${response.orders.data.length} de ${response.orders.total}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar órdenes')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Elimina la cuenta del usuario autenticado
   *
   * @returns Observable con la respuesta
   */
  deleteMyAccount(): Observable<ApiResponse<null>> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        this._currentUser$.next(null);
        console.log('✅ Cuenta eliminada:', response.message);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'eliminar cuenta')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // ========== MÉTODOS PÚBLICOS - ADMINISTRADOR ==========

  /**
   * Limpia códigos de recuperación expirados (solo admin)
   *
   * @returns Observable con cantidad de códigos limpiados
   */
  cleanExpiredCodes(): Observable<CleanCodesResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.post<CleanCodesResponse>(`${this.apiUrl}/admin/clean-expired-codes`, {}).pipe(
      tap((response) => {
        console.log(`✅ Códigos limpiados: ${response.cleaned}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'limpiar códigos expirados')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Lista todos los usuarios (admin/custom)
   *
   * @param page - Número de página
   * @param limit - Items por página
   * @returns Observable con usuarios paginados
   */
  getAllUsers(page = 1, limit = 10): Observable<UsersResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<UsersResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        console.log(`✅ Usuarios cargados: ${response.data.length} de ${response.total}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'listar usuarios')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene un usuario por ID
   *
   * @param userId - UUID del usuario
   * @returns Observable con el usuario
   */
  getUserById(userId: string): Observable<User> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
      tap((user) => {
        console.log('✅ Usuario cargado:', user.name);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar usuario')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene las órdenes de un usuario específico
   *
   * @param userId - UUID del usuario
   * @param page - Número de página
   * @param limit - Items por página
   * @returns Observable con órdenes del usuario
   */
  getUserOrders(userId: string, page = 1, limit = 10): Observable<UserOrdersResponse> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<UserOrdersResponse>(`${this.apiUrl}/${userId}/orders`, { params }).pipe(
      tap((response) => {
        console.log(`✅ Órdenes del usuario cargadas: ${response.orders.data.length}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar órdenes del usuario')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene estadísticas completas de un usuario
   *
   * @param userId - UUID del usuario
   * @returns Observable con estadísticas
   */
  getUserStatistics(userId: string): Observable<UserStatistics> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<UserStatistics>(`${this.apiUrl}/${userId}/statistics`).pipe(
      tap((stats) => {
        console.log(`✅ Estadísticas cargadas: ${stats.totalOrders} órdenes`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar estadísticas')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene resumen de usuario (admin/custom)
   *
   * @param userId - UUID del usuario
   * @returns Observable con resumen
   */
  getUserSummary(userId: string): Observable<UserSummary> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<UserSummary>(`${this.apiUrl}/${userId}/summary`).pipe(
      tap((summary) => {
        console.log(`✅ Resumen cargado: ${summary.name}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar resumen de usuario')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Obtiene estadísticas simples de un usuario
   *
   * @param userId - UUID del usuario
   * @returns Observable con estadísticas básicas
   */
  getUserStats(userId: string): Observable<UserStats> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.get<UserStats>(`${this.apiUrl}/${userId}/stats`).pipe(
      tap((stats) => {
        console.log(`✅ Stats cargadas: Total gastado $${stats.totalSpent}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'cargar stats')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Actualiza el rol de un usuario (admin)
   *
   * @param identifier - UUID o email del usuario
   * @param data - Nuevo rol
   * @returns Observable con usuario actualizado
   */
  updateUserRole(identifier: string, data: UpdateRoleDto): Observable<User> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<User>(`${this.apiUrl}/${identifier}/role`, data).pipe(
      tap((user) => {
        console.log(`✅ Rol actualizado: ${user.name} ahora es ${user.role}`);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar rol')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Actualiza datos de un usuario
   *
   * @param userId - UUID del usuario
   * @param data - Datos a actualizar
   * @returns Observable con usuario actualizado
   */
  updateUser(userId: string, data: UpdateUserDto): Observable<User> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<User>(`${this.apiUrl}/${userId}`, data).pipe(
      tap((user) => {
        console.log(`✅ Usuario actualizado: ${user.name}`);

        // Si es el usuario actual, actualizar el estado
        if (this._currentUser$.value?.id === userId) {
          this._currentUser$.next(user);
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar usuario')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Actualiza la contraseña de un usuario (admin)
   *
   * @param userId - UUID del usuario
   * @param data - Nueva contraseña
   * @returns Observable con la respuesta
   */
  updateUserPassword(userId: string, data: UpdatePasswordDto): Observable<ApiResponse<null>> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${userId}/password`, data).pipe(
      tap((response) => {
        console.log('✅ Contraseña actualizada:', response.message);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'actualizar contraseña')),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Elimina un usuario (admin)
   *
   * @param userId - UUID del usuario
   * @returns Observable con la respuesta
   */
  deleteUser(userId: string): Observable<ApiResponse<null>> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${userId}`).pipe(
      tap((response) => {
        console.log('✅ Usuario eliminado:', response.message);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'eliminar usuario')),
      finalize(() => this._isLoading.set(false))
    );
  }

  // ========== MÉTODOS PRIVADOS - Manejo de errores ==========

  /**
   * Maneja errores HTTP de forma centralizada
   *
   * @param error - Error HTTP
   * @param action - Acción que se estaba realizando
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse, action: string): Observable<never> {
    let errorMessage = `Error al ${action}`;

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `${errorMessage}. Código: ${error.status}`;
    }

    this._errorMessage.set(errorMessage);
    console.error(`❌ ${errorMessage}`, error);

    return throwError(() => error);
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this._errorMessage.set(null);
  }
}
