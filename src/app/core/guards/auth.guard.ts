import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, permitir acceso
  if (authService.isCurrentlyAuthenticated()) {
    return true;
  }

  // Si hay token válido pero no usuario cargado, verificar con servidor
  if (authService.hasValidToken()) {
    return authService.verifyToken().pipe(
      map(() => authService.isCurrentlyAuthenticated()),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  // Sin token válido, redirigir a login
  router.navigate(['/login']);
  return false;
};