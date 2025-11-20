import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender, // Home page puede pre-renderizarse
  },
  {
    path: 'products',
    renderMode: RenderMode.Server, // Products usa datos dinámicos, usar SSR
  },
  {
    path: 'services',
    renderMode: RenderMode.Server, // Services usa datos dinámicos, usar SSR
  },
  {
    path: 'products/:id',
    renderMode: RenderMode.Server, // Detalle de producto usa parámetros dinámicos
  },
  {
    path: 'details/:id',
    renderMode: RenderMode.Server, // Detalle de servicio usa parámetros dinámicos
  },
  {
    path: 'cart',
    renderMode: RenderMode.Client, // Carrito requiere autenticación
  },
  {
    path: 'orders',
    renderMode: RenderMode.Client, // Órdenes requieren autenticación
  },
  {
    path: 'orders/:id',
    renderMode: RenderMode.Client, // Detalle de orden requiere autenticación
  },
  {
    path: 'addresses',
    renderMode: RenderMode.Client, // Direcciones requieren autenticación
  },
  {
    path: 'profile',
    renderMode: RenderMode.Client, // Perfil requiere autenticación
  },
  {
    path: '**',
    renderMode: RenderMode.Server, // Todas las demás rutas usan SSR
  },
];
