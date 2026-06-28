import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ============================================================
  // RUTA PÚBLICA - Mapa principal (sin login)
  // ============================================================
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent)
  },

  // ============================================================
  // RUTA LOGIN (para administradores)
  // ============================================================
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.component')
      .then(m => m.LoginComponent)
  },

  // ============================================================
  // RUTAS ADMIN (protegidas con AuthGuard)
  // ============================================================
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout')
      .then(m => m.AdminLayoutComponent),
    children: [
      // Dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard')
          .then(m => m.AdminDashboardComponent)
      },
      
      // Rutas
      {
        path: 'routes',
        loadComponent: () => import('./features/admin/routes-admin/routes-admin')
          .then(m => m.RoutesAdminComponent)
      },
      {
        path: 'routes/create',
        loadComponent: () => import('./features/routes/route-editor/route-editor')
          .then(m => m.RouteEditorComponent)
      },
      {
        path: 'routes/edit/:id',
        loadComponent: () => import('./features/routes/route-editor/route-editor')
          .then(m => m.RouteEditorComponent)
      },
      {
        path: 'routes/:id',
        loadComponent: () => import('./features/routes/route-details/route-details')
          .then(m => m.RouteDetailsComponent)
      },
      
      // Sindicatos
      {
        path: 'sindicatos',
        loadComponent: () => import('./features/admin/sindicatos-admin/sindicatos-admin')
          .then(m => m.SindicatosAdminComponent)
      },
      
      // Lugares (vacío - en desarrollo)
      {
        path: 'lugares',
        loadComponent: () => import('./features/admin/lugares-admin/lugares-admin')
          .then(m => m.LugaresAdminComponent)
      },
      
      // Paradas (vacío - en desarrollo)
      {
        path: 'paradas',
        loadComponent: () => import('./features/admin/paradas-admin/paradas-admin')
          .then(m => m.ParadasAdminComponent)
      },
      
      // Historial (vacío - en desarrollo)
      {
        path: 'historial',
        loadComponent: () => import('./features/admin/historial-admin/historial-admin')
          .then(m => m.HistorialAdminComponent)
      },
      
      // Configuración (vacío - en desarrollo)
      {
        path: 'config',
        loadComponent: () => import('./features/admin/config-admin/config-admin')
          .then(m => m.ConfigAdminComponent)
      }
    ]
  },

  // ============================================================
  // WILDCARD - Redirigir a inicio
  // ============================================================
  {
    path: '**',
    redirectTo: ''
  }
];