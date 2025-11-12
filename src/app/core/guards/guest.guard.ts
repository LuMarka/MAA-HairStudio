import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Si está autenticado, redirigir según el rol
  if (authService.isCurrentlyAuthenticated()) {
    const user = authService.currentUser();
    const redirectPath = user?.role === 'admin' ? '/admin' : '/';
    router.navigate([redirectPath]);
    return false;
  }

  // Si hay token pero no usuario cargado, verificar con servidor
  if (authService.hasValidToken() && !authService.currentUser()) {
    return authService.verifyToken().pipe(
      map(() => {
        const user = authService.currentUser();
        if (user) {
          const redirectPath = user.role === 'admin' ? '/admin' : '/';
          router.navigate([redirectPath]);
          return false;
        }
        return true;
      }),
      catchError(() => of(true))
    );
  }

  return true;
};