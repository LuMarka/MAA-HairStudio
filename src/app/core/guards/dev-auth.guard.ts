import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const devAuthGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // En desarrollo, siempre permitir acceso para pruebas
  if (!environment.production) {
    console.log('🚧 Development mode: Auth guard bypassed');
    return of(true);
  }

  // En producción, usar el comportamiento normal de autenticación
  if (!authService.hasValidToken()) {
    router.navigate(['/login']);
    return of(false);
  }

  if (authService.isAuthenticated()) {
    return of(true);
  }

  return authService.verifyToken().pipe(
    map(response => {
      if (response.valid) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
