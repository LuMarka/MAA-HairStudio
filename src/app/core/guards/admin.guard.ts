import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasValidToken()) {
    router.navigate(['/login']);
    return of(false);
  }

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return of(true);
  }

  return authService.verifyToken().pipe(
    map(response => {
      if (response.valid && response.user.role === 'admin') {
        return true;
      }

      // Si es un usuario válido pero no admin, redirigir al home
      if (response.valid) {
        router.navigate(['/']);
        return false;
      }

      // Si no es válido, redirigir al login
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
