import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'hasValidToken',
      'refreshToken',
      'forceLogout'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('public endpoints', () => {
    it('should NOT add Authorization header for /auth/login', () => {
      authServiceSpy.getToken.and.returnValue('some-token');
      authServiceSpy.hasValidToken.and.returnValue(true);

      http.post(`${baseUrl}auth/login`, {}).subscribe();

      const req = httpMock.expectOne(`${baseUrl}auth/login`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should NOT add Authorization header for /auth/register', () => {
      authServiceSpy.getToken.and.returnValue('some-token');
      authServiceSpy.hasValidToken.and.returnValue(true);

      http.post(`${baseUrl}auth/register`, {}).subscribe();

      const req = httpMock.expectOne(`${baseUrl}auth/register`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('authenticated requests', () => {
    it('should add Bearer token to protected endpoints', () => {
      authServiceSpy.getToken.and.returnValue('my-token-123');
      authServiceSpy.hasValidToken.and.returnValue(true);

      http.get(`${baseUrl}products`).subscribe();

      const req = httpMock.expectOne(`${baseUrl}products`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-token-123');
      req.flush({});
    });

    it('should NOT add token when no token exists', () => {
      authServiceSpy.getToken.and.returnValue(null);
      authServiceSpy.hasValidToken.and.returnValue(false);

      http.get(`${baseUrl}products`).subscribe();

      const req = httpMock.expectOne(`${baseUrl}products`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should NOT add token when token is invalid', () => {
      authServiceSpy.getToken.and.returnValue('expired-token');
      authServiceSpy.hasValidToken.and.returnValue(false);

      http.get(`${baseUrl}products`).subscribe();

      const req = httpMock.expectOne(`${baseUrl}products`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('token refresh on 401', () => {
    it('should attempt refresh on 401 error', () => {
      authServiceSpy.getToken.and.returnValues('old-token', 'new-token');
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.refreshToken.and.returnValue(of({ access_token: 'new-token' } as any));

      http.get(`${baseUrl}cart`).subscribe();

      // First request gets 401
      const req1 = httpMock.expectOne(`${baseUrl}cart`);
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      // After refresh, retry request should be sent
      const req2 = httpMock.expectOne(`${baseUrl}cart`);
      expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
      req2.flush({ data: 'success' });
    });

    it('should force logout when refresh fails', () => {
      authServiceSpy.getToken.and.returnValue('old-token');
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

      http.get(`${baseUrl}cart`).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${baseUrl}cart`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.forceLogout).toHaveBeenCalled();
    });

    it('should NOT refresh for /auth/refresh endpoint', () => {
      authServiceSpy.getToken.and.returnValue('old-token');
      authServiceSpy.hasValidToken.and.returnValue(true);

      http.post(`${baseUrl}auth/refresh`, {}).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${baseUrl}auth/refresh`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });

    it('should propagate non-401 errors without refresh', () => {
      authServiceSpy.getToken.and.returnValue('my-token');
      authServiceSpy.hasValidToken.and.returnValue(true);

      let receivedError: HttpErrorResponse | undefined;

      http.get(`${baseUrl}products`).subscribe({
        error: (err) => receivedError = err
      });

      httpMock.expectOne(`${baseUrl}products`).flush(
        { message: 'Not found' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(receivedError?.status).toBe(404);
      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });
  });
});
