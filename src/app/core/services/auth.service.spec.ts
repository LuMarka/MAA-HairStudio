import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import type { LoginResponse, VerifyTokenResponse, User } from '../models/interfaces/auth.interface';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const authUrl = `${environment.apiUrl}auth`;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: 'admin-1',
    role: 'admin'
  };

  const mockLoginResponse: LoginResponse = {
    access_token: 'mock-token-123',
    user: mockUser,
    expiresIn: '3600s'
  };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start unauthenticated', () => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentUser()).toBeNull();
      expect(service.isAdmin()).toBeFalse();
      expect(service.isUser()).toBeFalse();
    });

    it('should start without loading', () => {
      expect(service.isLoading()).toBeFalse();
    });

    it('should start without errors', () => {
      expect(service.error()).toBeNull();
    });
  });

  describe('register', () => {
    it('should call POST /auth/register', () => {
      const registerData = { email: 'new@test.com', password: 'Pass123!', name: 'New User' };

      service.register(registerData).subscribe();

      const req = httpMock.expectOne(`${authUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockUser);
    });

    it('should set loading during request', () => {
      service.register({ email: 'a@b.com', password: 'x', name: 'x' }).subscribe();

      expect(service.isLoading()).toBeTrue();

      httpMock.expectOne(`${authUrl}/register`).flush(mockUser);

      expect(service.isLoading()).toBeFalse();
    });

    it('should handle registration errors', () => {
      service.register({ email: 'dup@test.com', password: 'x', name: 'x' }).subscribe({
        error: (err) => expect(err.message).toBeTruthy()
      });

      httpMock.expectOne(`${authUrl}/register`).flush(
        { message: 'Ya existe un usuario con este correo electrónico', statusCode: 409 },
        { status: 409, statusText: 'Conflict' }
      );

      expect(service.error()).toContain('correo electrónico');
    });
  });

  describe('login', () => {
    it('should call POST /auth/login and store auth data', () => {
      service.login({ email: 'test@example.com', password: 'password' }).subscribe();

      const req = httpMock.expectOne(`${authUrl}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getToken()).toBe('mock-token-123');
    });

    it('should navigate to / for regular users after login', () => {
      service.login({ email: 'test@example.com', password: 'password' }).subscribe();

      httpMock.expectOne(`${authUrl}/login`).flush(mockLoginResponse);

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to /admin for admin users after login', () => {
      const adminLoginResponse: LoginResponse = {
        ...mockLoginResponse,
        user: mockAdminUser
      };

      service.login({ email: 'admin@example.com', password: 'password' }).subscribe();

      httpMock.expectOne(`${authUrl}/login`).flush(adminLoginResponse);

      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should set isAdmin for admin users', () => {
      service.login({ email: 'admin@example.com', password: 'password' }).subscribe();

      httpMock.expectOne(`${authUrl}/login`).flush({
        ...mockLoginResponse,
        user: mockAdminUser
      });

      expect(service.isAdmin()).toBeTrue();
      expect(service.isUser()).toBeFalse();
    });

    it('should handle login errors with 401', () => {
      service.login({ email: 'wrong@test.com', password: 'wrong' }).subscribe({
        error: () => {}
      });

      httpMock.expectOne(`${authUrl}/login`).flush(
        { message: 'Credenciales incorrectas', statusCode: 401 },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(service.error()).toBe('Credenciales incorrectas');
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getProfile', () => {
    it('should call GET /auth/profile and update user', () => {
      service.getProfile().subscribe();

      const req = httpMock.expectOne(`${authUrl}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', user: mockUser });

      expect(service.currentUser()).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should call POST /auth/refresh and update token', () => {
      service.refreshToken().subscribe();

      const req = httpMock.expectOne(`${authUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush({ access_token: 'new-token-456' });

      expect(service.getToken()).toBe('new-token-456');
    });

    it('should force logout on refresh failure', () => {
      service.refreshToken().subscribe({ error: () => {} });

      httpMock.expectOne(`${authUrl}/refresh`).flush(
        { message: 'Invalid refresh' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(service.isAuthenticated()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('verifyToken', () => {
    it('should call GET /auth/verify and update state on valid token', () => {
      const verifyResponse: VerifyTokenResponse = {
        valid: true,
        user: mockUser,
        expiresIn: '3600s'
      };

      service.verifyToken().subscribe();

      const req = httpMock.expectOne(`${authUrl}/verify`);
      expect(req.request.method).toBe('GET');
      req.flush(verifyResponse);

      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should clear auth data on invalid verify response', () => {
      service.verifyToken().subscribe();

      httpMock.expectOne(`${authUrl}/verify`).flush({ valid: false, user: null, expiresIn: '' });

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should call POST /auth/logout and clear state', () => {
      // First login
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockLoginResponse);

      expect(service.isAuthenticated()).toBeTrue();

      // Then logout
      service.logout().subscribe();
      httpMock.expectOne(`${authUrl}/logout`).flush({ message: 'ok' });

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token management', () => {
    it('should report hasValidToken as false when no token', () => {
      expect(service.hasValidToken()).toBeFalse();
    });

    it('should report isCurrentlyAuthenticated as false when no user', () => {
      expect(service.isCurrentlyAuthenticated()).toBeFalse();
    });

    it('should persist token in localStorage after login', () => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockLoginResponse);

      expect(localStorage.getItem('maa_access_token')).toBe('mock-token-123');
      expect(localStorage.getItem('maa_user_data')).toBeTruthy();
      expect(localStorage.getItem('maa_token_expiry')).toBeTruthy();
    });

    it('should clear all auth data from localStorage on logout', () => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockLoginResponse);

      service.logout().subscribe();
      httpMock.expectOne(`${authUrl}/logout`).flush({ message: 'ok' });

      expect(localStorage.getItem('maa_access_token')).toBeNull();
      expect(localStorage.getItem('maa_user_data')).toBeNull();
      expect(localStorage.getItem('maa_token_expiry')).toBeNull();
    });
  });

  describe('forceLogout', () => {
    it('should clear state and redirect without server call', () => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      httpMock.expectOne(`${authUrl}/login`).flush(mockLoginResponse);

      service.forceLogout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('error handling', () => {
    it('should clear error on clearError()', () => {
      service.login({ email: 'x', password: 'x' }).subscribe({ error: () => {} });
      httpMock.expectOne(`${authUrl}/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(service.error()).toBeTruthy();

      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('should set error on setError()', () => {
      service.setError('Custom error');
      expect(service.error()).toBe('Custom error');
    });

    it('should handle 500 server errors', () => {
      service.login({ email: 'x', password: 'x' }).subscribe({ error: () => {} });
      httpMock.expectOne(`${authUrl}/login`).flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe('Error interno del servidor');
    });
  });

  describe('session restoration', () => {
    it('should restore session from localStorage on init', () => {
      // Simulate stored session before creating a fresh TestBed
      const futureExpiry = Date.now() + 3600000;
      localStorage.setItem('maa_access_token', 'stored-token');
      localStorage.setItem('maa_user_data', JSON.stringify(mockUser));
      localStorage.setItem('maa_token_expiry', futureExpiry.toString());

      // Recreate TestBed to trigger initializeAuth with stored data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: Router, useValue: router }
        ]
      });

      const freshService = TestBed.inject(AuthService);

      expect(freshService.currentUser()).toEqual(mockUser);
      expect(freshService.isAuthenticated()).toBeTrue();
    });

    it('should clear expired session data on init', () => {
      const pastExpiry = Date.now() - 100000;
      localStorage.setItem('maa_access_token', 'old-token');
      localStorage.setItem('maa_user_data', JSON.stringify(mockUser));
      localStorage.setItem('maa_token_expiry', pastExpiry.toString());

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: Router, useValue: router }
        ]
      });

      const freshService = TestBed.inject(AuthService);

      expect(freshService.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('maa_access_token')).toBeNull();
    });
  });
});
