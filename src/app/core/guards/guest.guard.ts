import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir según el rol
  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    const redirectPath = user?.role === 'admin' ? '/admin' : '/';
    router.navigate([redirectPath]);
    return of(false);
  }

  // Si hay un token, verificar su validez
  if (authService.hasValidToken()) {
    return authService.verifyToken().pipe(
      map(response => {
        if (response.valid) {
          // Token válido, redirigir según rol
          const redirectPath = response.user.role === 'admin' ? '/admin' : '/';
          router.navigate([redirectPath]);
          return false;
        }
        // Token inválido, permitir acceso a login
        return true;
      }),
      catchError(() => {
        // Error en verificación, permitir acceso a login
        return of(true);
      })
    );
  }

  // No hay token, permitir acceso a login
  return of(true);
};
