import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Endpoints públicos que no requieren autenticación
  const publicEndpoints = [
    '/auth/register',
    '/auth/login'
  ];
  
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isPublicEndpoint) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token && authService.hasValidToken()) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Intentar refresh en errores 401 (excepto el endpoint de refresh)
        if (error.status === 401 && !req.url.includes('/auth/refresh')) {
          return authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = authService.getToken();
              if (newToken) {
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                return next(retryReq);
              }
              return throwError(() => error);
            }),
            catchError(() => {
              authService.forceLogout();
              return EMPTY;
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  return next(req);
};