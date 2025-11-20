import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'details/:id',
    renderMode: RenderMode.Server, // Usar renderizado del lado del servidor
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
