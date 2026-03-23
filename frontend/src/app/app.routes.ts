import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'busqueda',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/busqueda/busqueda').then((m) => m.Busqueda),
  },
  {
    path: 'estadisticas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/estadisticas/estadisticas').then((m) => m.Estadisticas),
  },
  {
    path: 'admin/empresas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/empresas/empresas').then((m) => m.AdminEmpresas),
  },
  {
    path: 'admin/usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/usuarios/usuarios').then((m) => m.AdminUsuarios),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
  },
  { path: '**', redirectTo: 'login' },
];
