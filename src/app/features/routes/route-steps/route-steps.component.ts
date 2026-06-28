import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RutaResultado } from '../../../core/services/route-search.service';
import { GamificationService } from '../../../core/services/gamification.service';

@Component({
  selector: 'app-route-steps',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './route-steps.component.html',
  styleUrl: './route-steps.component.css'
})
export class RouteStepsComponent {
  // ============================================================
  // INPUTS
  // ============================================================
  ruta = input<RutaResultado | null>(null);
  origenNombre = input<string>('');
  destinoNombre = input<string>('');

  // ============================================================
  // OUTPUTS
  // ============================================================
  onClose = output<void>();
  onBack = output<void>();
  onShowInMap = output<void>();

  // ============================================================
  // SERVICIOS
  // ============================================================
  private gamificationService = inject(GamificationService);

  // ============================================================
  // MÉTODOS
  // ============================================================
  close() {
    this.onClose.emit();
  }

  back() {
    this.onBack.emit();
  }

  showInMap() {
    this.onShowInMap.emit();
    this.gamificationService.notification.set('🗺️ Mostrando ruta en el mapa');
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  getIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'walk': '🚶',
      'bus': '🚌',
      'train': '🚆',
      'teleferico': '🚠',
      'minibus': '🚐'
    };
    return iconos[tipo] || '🚌';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'walk': 'Caminar',
      'bus': 'Bus',
      'train': 'Tren',
      'teleferico': 'Teleférico',
      'minibus': 'Minibús'
    };
    return labels[tipo] || tipo;
  }

  getIconoTransporte(tipo: string): string {
    const iconos: Record<string, string> = {
      'Teleférico': '🚠',
      'Bus': '🚌',
      'Minibús': '🚐',
      'Trufi': '🚗',
      'Micro': '🚌'
    };
    return iconos[tipo] || '🚌';
  }
}