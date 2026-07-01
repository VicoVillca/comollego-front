import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/auth/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { RouteService } from '../../../core/services/route.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, RouterModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  readonly authService = inject(AuthService);
  readonly gamificationService = inject(GamificationService);
  readonly routeService = inject(RouteService);
  private router = inject(Router);

  // ============================================================
  // ESTADO
  // ============================================================
  currentUser = signal<any>(null);
  isSidebarCollapsed = signal(false);
  activeMenuItem = signal('dashboard');

  // ============================================================
  // MENÚ ITEMS
  // ============================================================
  menuItems = [
    { id: 'dashboard', icon: 'pi pi-home', label: 'Dashboard' },
    { id: 'routes', icon: 'pi pi-car', label: 'Rutas' },
    { id: 'sindicatos', icon: 'pi pi-users', label: 'Sindicatos' },
    { id: 'lugares', icon: 'pi pi-map-marker', label: 'Lugares' },
    { id: 'paradas', icon: 'pi pi-stop-circle', label: 'Paradas' },
    { id: 'historial', icon: 'pi pi-history', label: 'Historial' },
    { id: 'config', icon: 'pi pi-cog', label: 'Configuración' }
  ];

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    if (!this.currentUser()) {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.currentUser.set(JSON.parse(userData));
      }
    }
  }

  // ============================================================
  // MÉTODOS
  // ============================================================
  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  setActiveMenu(itemId: string) {
    this.activeMenuItem.set(itemId);
  }

  logout() {
    this.authService.logout();
    this.gamificationService.notification.set('👋 Sesión cerrada');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
    this.router.navigate(['/']);
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getRouteCount(): number {
    return this.routeService.routes().length;
  }
}