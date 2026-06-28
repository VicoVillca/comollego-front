import { Component, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../../core/services/route.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './app-navigation.component.html',
  styleUrl: './app-navigation.component.css'
})
export class AppNavigationComponent {
  // ============================================================
  // SERVICIOS
  // ============================================================
  authService = inject(AuthService);
  routeService = inject(RouteService);
  gamificationService = inject(GamificationService);
  private router = inject(Router);

  // ============================================================
  // OUTPUTS
  // ============================================================
  onLineSearch = output<void>();
  onAppDialog = output<void>();
  onDevDialog = output<void>();
  onAdmin = output<void>();

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  showLineSearch = signal(false);
  showAppDialog = signal(false);
  showDevDialog = signal(false);

  // ============================================================
  // MÉTODOS PARA ABRIR MODALES
  // ============================================================
  
  toggleLineSearch() {
    this.showLineSearch.update(v => !v);
    this.onLineSearch.emit();
  }

  toggleAppDialog() {
    this.showAppDialog.update(v => !v);
    this.onAppDialog.emit();
  }

  toggleDevDialog() {
    this.showDevDialog.update(v => !v);
    this.onDevDialog.emit();
  }

  goToAdmin() {
    this.onAdmin.emit();
  }

  closeLineSearch() {
    this.showLineSearch.set(false);
  }

  closeAppDialog() {
    this.showAppDialog.set(false);
  }

  closeDevDialog() {
    this.showDevDialog.set(false);
  }

  // ============================================================
  // SELECT ROUTE (para el modal de líneas)
  // ============================================================
  selectRoute(route: any) {
    this.routeService.selectRoute(route.id);
    this.showLineSearch.set(false);
    this.routeService.filters.update(f => ({...f, search: ''}));
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  getTransitName(route: any): string {
    if (route.tipoTransporteNombre) {
      return route.tipoTransporteNombre;
    }
    const map: Record<number, string> = {
      1: 'Minibús',
      2: 'Trufi',
      3: 'Teleférico',
      4: 'PumaKatari',
      5: 'Micro'
    };
    return map[route.tipoTransporteId] || `Tipo ${route.tipoTransporteId}`;
  }
}