import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  private users: any[] = [];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Extraer la URL base
    const urlParts = request.url.split('/');
    const endpoint = urlParts[urlParts.length - 1];

    // Mock para registro
    if (request.url.includes('/api/auth/register') && request.method === 'POST') {
      const user = request.body;

      // Validar si el email ya existe
      const existingUser = this.users.find(u => u.email === user.email);
      if (existingUser) {
        return this.error('El email ya está registrado', 400);
      }

      // Agregar ID y guardar
      const newUser = {
        ...user,
        id: Date.now().toString(),
        roles: ['user']
      };
      delete newUser.password; // No guardar la contraseña

      this.users.push(newUser);

      return of(new HttpResponse({
        status: 200,
        body: { message: 'Usuario registrado exitosamente' }
      })).pipe(delay(500)); // Simular latencia de red
    }

    // Mock para login
    if (request.url.includes('/api/auth/login') && request.method === 'POST') {
      const { email, password } = request.body;

      // Buscar usuario
      const user = this.users.find(u => u.email === email);

      if (!user) {
        return this.error('Usuario no encontrado', 404);
      }

      // En un caso real verificarías la contraseña con hash
      return of(new HttpResponse({
        status: 200,
        body: {
          token: `mock-jwt-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
          user: { ...user }
        }
      })).pipe(delay(500));
    }

    // Si no coincide con ninguna ruta simulada, pasar la solicitud
    return next.handle(request);
  }

  private error(message: string, status: number): Observable<HttpEvent<any>> {
    return of(new HttpResponse({
      status: status,
      body: { message }
    })).pipe(delay(500));
  }
}
