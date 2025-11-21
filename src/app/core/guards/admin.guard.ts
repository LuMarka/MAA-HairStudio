import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado y es admin
  if (authService.isCurrentlyAuthenticated()) {
    const user = authService.currentUser();
    
    if (user?.role === 'admin') {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  }

  // Si hay token válido pero no usuario cargado, verificar con servidor
  if (authService.hasValidToken()) {
    return authService.verifyToken().pipe(
      map(() => {
        const user = authService.currentUser();
        if (user?.role === 'admin') {
          return true;
        } else {
          router.navigate(['/']);
          return false;
        }
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return false;
};