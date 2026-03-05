import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    // Ignorar errores de navegación cancelada (normales en Angular)
    if (message.includes('Navigation cancelled') || message.includes('NG04002')) {
      return;
    }

    console.error('[GlobalErrorHandler]', error);

    // Aquí se puede integrar un servicio de monitoreo externo (Sentry, LogRocket, etc.)
    // Ejemplo: Sentry.captureException(error);
  }
}
