import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'details/:id',
    renderMode: RenderMode.Server, // Usar renderizado del lado del servidor
  },
  {
    path: 'products',
    renderMode: RenderMode.Server, // Usar renderizado del lado del servidor
  },
  {
    path: 'services',
    renderMode: RenderMode.Server, // Usar renderizado del lado del servidor
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender, // Usar prerenderizado para todas las demás rutas
  }
];
