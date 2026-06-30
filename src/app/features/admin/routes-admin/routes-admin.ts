// src/app/features/admin/routes-admin/routes-admin.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TipoTransporteService } from '../../../core/services/tipo-transporte.service';
import { SindicatoService } from '../../../core/services/sindicato.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Ruta } from '../../../core/models/transit.models';
import { finalize, Subscription } from 'rxjs';
import { RouteService } from '../../../core/services/route.service';

@Component({
  selector: 'app-routes-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './routes-admin.html',
  styleUrl: './routes-admin.css'
})
export class RoutesAdminComponent implements OnInit, OnDestroy {
  // ============================================================
  // SERVICIOS
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly tipoTransporteService = inject(TipoTransporteService);
  readonly sindicatoService = inject(SindicatoService);
  readonly gamificationService = inject(GamificationService);
  private router = inject(Router);

  private subscriptions: Subscription[] = [];

  // ============================================================
  // ESTADO
  // ============================================================
  searchTerm = signal('');
  selectedEstado = signal<string>('todos');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // ============================================================
  // SINDICATOS Y TIPOS PARA FILTROS
  // ============================================================
  sindicatos = signal<any[]>([]);
  tiposTransporte = signal<any[]>([]);

  // ============================================================
  // RUTAS FILTRADAS
  // ============================================================
  filteredRoutes = computed(() => {
    const routes = this.routeService.routes();
    const search = this.searchTerm().toLowerCase().trim();
    const estado = this.selectedEstado();

    return routes.filter(r => {
      const matchSearch = !search ||
        r.nombreRuta.toLowerCase().includes(search) ||
        r.codigo.toLowerCase().includes(search) ||
        (r.sindicatoNombre?.toLowerCase().includes(search) ?? false) ||
        (r.tipoTransporteNombre?.toLowerCase().includes(search) ?? false);

      const matchEstado = estado === 'todos' || r.estado === estado;

      return matchSearch && matchEstado;
    });
  });

  // ============================================================
  // ESTADOS PARA FILTRO
  // ============================================================
  estados = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'Activo' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'suspendido', label: 'Suspendido' }
  ];

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar rutas desde el backend
    const routeSub = this.routeService.loadAllRoutes()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage.set('No se pudieron cargar las rutas');
          }
        },
        error: (err) => {
          console.error('Error al cargar rutas:', err);
          this.errorMessage.set('Error al cargar las rutas');
        }
      });
    this.subscriptions.push(routeSub);

    // Cargar sindicatos para el filtro
    const sindicatoSub = this.sindicatoService.obtenerTodos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sindicatos.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error al cargar sindicatos:', err);
      }
    });
    this.subscriptions.push(sindicatoSub);

    // Cargar tipos de transporte para el filtro
    const tipoSub = this.tipoTransporteService.obtenerTodos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tiposTransporte.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error al cargar tipos de transporte:', err);
      }
    });
    this.subscriptions.push(tipoSub);
  }

  recargar() {
    this.loadData();
  }

  // ============================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================
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

  getTransitLabel(typeId: number): string {
    const tipo = this.tiposTransporte().find(t => t.id === typeId);
    if (tipo) {
      return tipo.icono ? `${tipo.icono} ${tipo.nombre}` : tipo.nombre;
    }
    return `Tipo ${typeId}`;
  }

  getSindicatoNombre(sindicatoId: number): string {
    const sindicato = this.sindicatos().find(s => s.id === sindicatoId);
    return sindicato?.nombre || `Sindicato ${sindicatoId}`;
  }

  // ============================================================
  // ACCIONES
  // ============================================================

  /**
   * Editar ruta - Redirige al editor
   */
  editRoute(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/routes/edit', id]);
  }

  /**
   * Ver detalles de ruta
   */
  viewRoute(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/routes', id]);
  }

  /**
   * Eliminar ruta
   */
  deleteRoute(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta ruta?')) {
      this.isLoading.set(true);
      this.routeService.deleteRoute(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.gamificationService.notification.set('🗑️ Ruta eliminada correctamente');
              setTimeout(() => this.gamificationService.notification.set(''), 3000);
            } else {
              this.gamificationService.notification.set('❌ Error al eliminar la ruta');
              setTimeout(() => this.gamificationService.notification.set(''), 3000);
            }
          },
          error: (err) => {
            console.error('Error al eliminar ruta', err);
            this.gamificationService.notification.set('❌ Error al eliminar la ruta');
            setTimeout(() => this.gamificationService.notification.set(''), 3000);
          }
        });
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================
  get totalRoutes(): number {
    return this.filteredRoutes().length;
  }

  get isLoadingRoutes(): boolean {
    return this.isLoading() || this.routeService.isLoading();
  }
}