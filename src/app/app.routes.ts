import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/pages.routes'),
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  },
];
