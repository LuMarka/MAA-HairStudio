// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Tipos mínimos: adáptalos a tu backend */
export interface User {
  id?: string | number;
  name?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: User;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/** Servicio de autenticación */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = '/api/auth'; // Ajusta la URL si hace falta
  private readonly KEY_TOKEN = 'auth_token';
  private readonly KEY_REFRESH = 'auth_refresh';
  private readonly KEY_USER = 'auth_user';
  private readonly storage = typeof window !== 'undefined' ? window.localStorage : null; // por defecto localStorage

  /** BehaviorSubject con el usuario actual (null si no hay) */
  private _currentUser$ = new BehaviorSubject<User | null>(null);
  public currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  /** Carga desde storage al iniciar el servicio */
  private loadFromStorage(): void {
    try {
      const raw = this.storage?.getItem(this.KEY_USER);
      if (raw) {
        const user: User = JSON.parse(raw);
        this._currentUser$.next(user);
      } else {
        this._currentUser$.next(null);
      }
    } catch (err) {
      console.warn('AuthService: error leyendo storage', err);
      this._currentUser$.next(null);
    }
  }

  /**
   * Iniciar sesión
   * - devuelve una Promise que resuelve con el objeto { token, user } (útil para await en componentes)
   * - guarda tokens y user en localStorage
   */
  async login(email: string, password: string, remember = true): Promise<{ token: string; user?: User }> {
    try {
      const obs$ = this.http.post<LoginResponse>(`${this.base}/login`, { email, password }).pipe(
        catchError((err) => {
          // Re-lanzar el error para catch en componentes
          throw err;
        })
      );

      const res = await firstValueFrom(obs$);

      if (!res || !res.token) {
        throw new Error('Respuesta inválida del servidor');
      }

      this.saveAuth(res.token, res.refreshToken, res.user, remember);

      return { token: res.token, user: res.user };
    } catch (err: any) {
      // Puedes mapear errores aquí si quieres mensajes más legibles
      throw err;
    }
  }

  /**
   * Registro
   * - devuelve Promise con el user (si el backend lo retorna) o la respuesta completa
   */
  async register(payload: RegisterPayload): Promise<any> {
    try {
      const obs$ = this.http.post(`${this.base}/register`, payload).pipe(
        catchError((err) => { throw err; })
      );
      const res = await firstValueFrom(obs$);
      return res;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Refresh token (si tu backend implementa refresh)
   * - actualiza token en storage y mantiene currentUser
   */
  async refreshToken(): Promise<string | null> {
    const refresh = this.storage?.getItem(this.KEY_REFRESH);
    if (!refresh) return null;
    try {
      const obs$ = this.http.post<{ token: string }>(`${this.base}/refresh`, { refreshToken: refresh }).pipe(
        catchError((err) => { throw err; })
      );
      const res = await firstValueFrom(obs$);
      if (res?.token) {
        // mantiene el mismo user almacenado
        const rawUser = this.storage?.getItem(this.KEY_USER);
        this.saveAuth(res.token, refresh ?? undefined, rawUser ? JSON.parse(rawUser) : undefined, true);
        return res.token;
      }
      return null;
    } catch (err) {
      // si falla el refresh, hacemos logout silencioso
      this.logout();
      return null;
    }
  }

  /** Logout: limpia storage y BehaviorSubject */
  logout(redirect = '/auth/login'): void {
    try {
      this.storage?.removeItem(this.KEY_TOKEN);
      this.storage?.removeItem(this.KEY_REFRESH);
      this.storage?.removeItem(this.KEY_USER);
      this._currentUser$.next(null);
      // Si usás router dentro de un guard o interceptor, cuidado con bucles
      this.router.navigate([redirect]);
    } catch (err) {
      console.warn('AuthService.logout error', err);
    }
  }

  /** Guarda token, refresh y user; si remember=false usa sessionStorage */
  private saveAuth(token: string, refreshToken?: string, user?: User, remember = true): void {
    try {
      const targetStorage = remember ? localStorage : sessionStorage;

      targetStorage.setItem(this.KEY_TOKEN, token);
      if (refreshToken) targetStorage.setItem(this.KEY_REFRESH, refreshToken);
      if (user) targetStorage.setItem(this.KEY_USER, JSON.stringify(user));

      // SI querés un uso más estricto, podrías en vez de usar localStorage guardar solo en cookies HttpOnly desde el backend.
      this._currentUser$.next(user ?? null);
    } catch (err) {
      console.warn('AuthService.saveAuth error', err);
    }
  }

  /** Devuelve el token actual buscando en localStorage y sessionStorage */
  get token(): string | null {
    return localStorage.getItem(this.KEY_TOKEN) ?? sessionStorage.getItem(this.KEY_TOKEN);
  }

  /** Devuelve si el usuario está autenticado (y token no expirado si es JWT) */
  isAuthenticated(): boolean {
    const t = this.token;
    if (!t) return false;

    // Try to decode JWT and check exp
    const exp = this.getTokenExpiration(t);
    if (!exp) return true; // no es JWT o no tiene exp: asumimos válido
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  }

  /** Helper: parsea JWT (si no es JWT devuelve null) y retorna exp en segundos (UNIX) */
  private getTokenExpiration(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(this.padBase64(parts[1])));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }

  /** Base64 padding helper para evitar errores con atob */
  private padBase64(b64: string): string {
    return b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
  }

  /** Getter del usuario actual (sync) */
  get currentUser(): User | null {
    return this._currentUser$.value;
  }

  /** Para llamadas internas: headers con Authorization (útil en casos puntuales) */
  getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.token;
    if (!token) return { headers: new HttpHeaders() };
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }
}

