import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { RouteService } from '../../../core/services/route.service';
import { Ruta } from '../../../core/models/transit.models';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule],
  templateUrl: './route-list.html',
  styleUrl: './route-list.css'
})
export class RouteListComponent {
  readonly routeService = inject(RouteService);
  visibleCount = signal(5);

  // Lista de estados disponibles para el filtro
  estados: Array<'activo' | 'mantenimiento' | 'suspendido' | 'todos'> = [
    'todos',
    'activo',
    'mantenimiento',
    'suspendido'
  ];

  // Lista de tipos de transporte (se puede obtener de un servicio)
  tiposTransporte = [
    { id: 1, nombre: 'Minibús' },
    { id: 2, nombre: 'Trufi' },
    { id: 3, nombre: 'Teleférico' },
    { id: 4, nombre: 'PumaKatari' },
    { id: 5, nombre: 'Micro' }
  ];

  // Señal computada de rutas filtradas (ya viene del servicio)
  readonly filteredRoutes = this.routeService.filteredRoutes;

  // ============================================================
  // GETTERS / SETTERS PARA FILTROS
  // ============================================================
  get searchValue(): string {
    return this.routeService.filters().search || '';
  }

  set searchValue(val: string) {
    this.routeService.filters.update(f => ({ ...f, search: val }));
  }

  get currentEstado(): 'activo' | 'mantenimiento' | 'suspendido' | 'todos' {
    return this.routeService.filters().estado || 'todos';
  }

  set currentEstado(val: 'activo' | 'mantenimiento' | 'suspendido' | 'todos') {
    this.routeService.filters.update(f => ({ ...f, estado: val }));
  }

  get currentTipoTransporteId(): number | undefined {
    return this.routeService.filters().tipoTransporteId;
  }

  set currentTipoTransporteId(val: number | undefined) {
    this.routeService.filters.update(f => ({ ...f, tipoTransporteId: val }));
  }

  // ============================================================
  // MÉTODOS PARA EVENTOS DEL TEMPLATE
  // ============================================================
  onSearchChange(val: string) {
    this.searchValue = val;
  }

  onEstadoChange(val: 'activo' | 'mantenimiento' | 'suspendido' | 'todos') {
    this.currentEstado = val;
  }

  onTipoChange(id: number | undefined) {
    this.currentTipoTransporteId = id;
  }

  loadMore() {
    this.visibleCount.update(c => c + 5);
  }

  // ============================================================
  // UTILIDADES PARA MOSTRAR NOMBRES Y CLASES
  // ============================================================
  /** Obtiene el nombre del tipo de transporte por ID */
  getTransitLabel(typeId: number): string {
    const found = this.tiposTransporte.find(t => t.id === typeId);
    return found ? found.nombre : `Tipo ${typeId}`;
  }

  /** Obtiene el nombre del tipo desde la ruta (si viene) o por ID */
  getTransitName(route: Ruta): string {
    return route.tipoTransporteNombre || this.getTransitLabel(route.tipoTransporteId);
  }

  /** Devuelve las clases CSS para el estado de la ruta */
  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'activo': 'estado-activo',
      'mantenimiento': 'estado-mantenimiento',
      'suspendido': 'estado-suspendido'
    };
    return map[estado] || '';
  }
}