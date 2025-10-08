import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockApiInterceptor } from './core/interceptor/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        // Usamos el interceptor de forma moderna con Angular 16+
        (req, next) => {
          // Adaptar el interceptor de clase a la firma funcional
          const mockInterceptor = new MockApiInterceptor();
          // next es una función, así que creamos un HttpHandler compatible
          const handler = { handle: next } as import('@angular/common/http').HttpHandler;
          return mockInterceptor.intercept(req, handler);
        }
      ])
    )
  ]
};
