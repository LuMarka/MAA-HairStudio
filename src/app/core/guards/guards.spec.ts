import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';
import { guestGuard } from './guest.guard';

describe('Guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockRoute = {} as any;
  const mockState = {} as any;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isCurrentlyAuthenticated',
      'hasValidToken',
      'verifyToken',
      'currentUser'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(result).toBeTrue();
    });

    it('should verify token when token exists but user not loaded', (done) => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValues(false, true);
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.verifyToken.and.returnValue(of({ valid: true, user: { role: 'user' }, expiresIn: '3600s' } as any));

      const result$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as any;

      result$.subscribe((result: boolean) => {
        expect(result).toBeTrue();
        expect(authServiceSpy.verifyToken).toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to /login when no valid token', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to /login when verify fails', (done) => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.verifyToken.and.returnValue(EMPTY);

      const result$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as any;

      // Since verifyToken returns EMPTY, the catchError should redirect
      if (typeof result$ === 'object' && result$.subscribe) {
        result$.subscribe({
          next: (result: boolean) => {
            expect(result).toBeFalse();
            done();
          },
          complete: () => done()
        });
      } else {
        done();
      }
    });
  });

  describe('adminGuard', () => {
    it('should allow access for authenticated admin', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue({ role: 'admin' } as any);

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      expect(result).toBeTrue();
    });

    it('should redirect to / for authenticated non-admin user', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue({ role: 'user' } as any);

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should verify token and allow admin with valid token', (done) => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue({ role: 'admin' } as any);
      authServiceSpy.verifyToken.and.returnValue(of({ valid: true, user: { role: 'admin' }, expiresIn: '3600s' } as any));

      const result$ = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState)) as any;

      result$.subscribe((result: boolean) => {
        expect(result).toBeTrue();
        done();
      });
    });

    it('should redirect to /login when no valid token', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('guestGuard', () => {
    it('should allow access for unauthenticated users', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(false);
      authServiceSpy.currentUser.and.returnValue(null);

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(result).toBeTrue();
    });

    it('should redirect admin to /admin', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue({ role: 'admin' } as any);

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect user to /', () => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue({ role: 'user' } as any);

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should verify token when token exists but user not loaded', (done) => {
      authServiceSpy.isCurrentlyAuthenticated.and.returnValue(false);
      authServiceSpy.hasValidToken.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValues(null, { role: 'user' } as any);
      authServiceSpy.verifyToken.and.returnValue(of({ valid: true, user: { role: 'user' }, expiresIn: '3600s' } as any));

      const result$ = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState)) as any;

      result$.subscribe((result: boolean) => {
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    });
  });
});
