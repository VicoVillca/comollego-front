import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RouteService } from '../../../core/services/route.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly authService = inject(AuthService);

  // ============================================================
  // ESTADO
  // ============================================================
  currentUser = signal<any>(null);
  isLoading = signal(true);

  // ============================================================
  // DATOS DEL DASHBOARD
  // ============================================================
  stats = computed(() => {
    const routes = this.routeService.routes();
    const activeRoutes = routes.filter(r => r.estado === 'activo');
    const maintenanceRoutes = routes.filter(r => r.estado === 'mantenimiento');
    const suspendedRoutes = routes.filter(r => r.estado === 'suspendido');
    
    // Contar paradas totales
    let totalStops = 0;
    routes.forEach(r => {
      if (r.paradas) totalStops += r.paradas.length;
      if (r.paradasVuelta) totalStops += r.paradasVuelta.length;
    });

    return {
      totalRoutes: routes.length,
      activeRoutes: activeRoutes.length,
      maintenanceRoutes: maintenanceRoutes.length,
      suspendedRoutes: suspendedRoutes.length,
      totalStops: totalStops,
      sindicatos: 4,
      tiposTransporte: 5
    };
  });

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
    setTimeout(() => this.isLoading.set(false), 300);
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

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'activo': 'estado-activo',
      'mantenimiento': 'estado-mantenimiento',
      'suspendido': 'estado-suspendido'
    };
    return map[estado] || '';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      'activo': 'Activo',
      'mantenimiento': 'Mantenimiento',
      'suspendido': 'Suspendido'
    };
    return map[estado] || estado;
  }

  getTransitName(typeId: number): string {
    const map: Record<number, string> = {
      1: 'Minibús',
      2: 'Trufi',
      3: 'Teleférico',
      4: 'PumaKatari',
      5: 'Micro'
    };
    return map[typeId] || `Tipo ${typeId}`;
  }
}