import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { GamificationService } from '../../../core/services/gamification.service';
import { RutaResultado } from '../../../core/services/route-search.service';

@Component({
  selector: 'app-route-results',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './route-results.component.html',
  styleUrl: './route-results.component.css'
})
export class RouteResultsComponent implements OnInit {
  // ============================================================
  // INPUTS
  // ============================================================
  resultados = input<RutaResultado[]>([]);
  isLoading = input(false);
  origenNombre = input<string>('');
  destinoNombre = input<string>('');

  // ============================================================
  // OUTPUTS
  // ============================================================
  onSelectRoute = output<RutaResultado>();
  onClose = output<void>();
  onBack = output<void>();

  // ============================================================
  // SERVICIOS
  // ============================================================
  private gamificationService = inject(GamificationService);

  // ============================================================
  // ESTADO
  // ============================================================
  isCollapsed = signal<boolean>(false); // 🔥 Inicia expandido (false)

  // ============================================================
  // COMPUTADAS
  // ============================================================
  get totalResultados(): number {
    return this.resultados().length;
  }

  get isLoadingResultados(): boolean {
    return this.isLoading();
  }

  get isEmpty(): boolean {
    return !this.isLoading() && this.totalResultados === 0;
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.checkIfMobile();
  }

  // ============================================================
  // MÉTODOS
  // ============================================================
  private checkIfMobile(): void {
    const isMobile = window.innerWidth <= 768;
    // Siempre expandido en móvil y desktop
    this.isCollapsed.set(false);
    console.log('📱 isMobile:', isMobile, 'isCollapsed:', this.isCollapsed());
  }

  toggleCollapse(): void {
    this.isCollapsed.update(value => !value);
    console.log('🔄 toggleCollapse:', this.isCollapsed());
  }

  selectRoute(resultado: RutaResultado) {
    this.onSelectRoute.emit(resultado);
    this.gamificationService.notification.set(`🗺️ Ruta seleccionada: ${resultado.nombre}`);
    setTimeout(() => this.gamificationService.notification.set(''), 3000);
  }

  close() {
    this.onClose.emit();
  }

  back() {
    this.onBack.emit();
  }

  getIcono(tipo: string): string {
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