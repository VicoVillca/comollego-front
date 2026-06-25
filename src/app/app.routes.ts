import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./app.component').then(m => m.AppComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];