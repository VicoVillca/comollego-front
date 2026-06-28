import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouteService } from '../../../core/services/route.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Ruta } from '../../../core/models/transit.models';

@Component({
  selector: 'app-routes-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './routes-admin.html',
  styleUrl: './routes-admin.css'
})
export class RoutesAdminComponent implements OnInit {
  // ============================================================
  // SERVICIOS
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly gamificationService = inject(GamificationService);
  private router = inject(Router); // 👈 AGREGAR Router

  // ============================================================
  // ESTADO
  // ============================================================
  searchTerm = signal('');
  selectedEstado = signal<string>('todos');
  isLoading = signal(true);

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
        (r.sindicatoNombre?.toLowerCase().includes(search) ?? false);

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
    setTimeout(() => this.isLoading.set(false), 300);
  }

  // ============================================================
  // MÉTODOS
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
    const map: Record<number, string> = {
      1: 'Minibús',
      2: 'Trufi',
      3: 'Teleférico',
      4: 'PumaKatari',
      5: 'Micro'
    };
    return map[typeId] || `Tipo ${typeId}`;
  }

  // ============================================================
  // 🔥 EDITAR RUTA - Redirige al editor
  // ============================================================
  editRoute(id: number, event: Event) {
    event.stopPropagation();
    // 🔥 Navegar directamente al editor con el ID
    this.router.navigate(['/admin/routes/edit', id]);
  }

  // ============================================================
  // 🔥 VER DETALLES DE RUTA
  // ============================================================
  viewRoute(id: number, event: Event) {
    event.stopPropagation();
    // 🔥 Navegar a los detalles
    this.router.navigate(['/admin/routes', id]);
  }

  // ============================================================
  // 🔥 ELIMINAR RUTA
  // ============================================================
  deleteRoute(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta ruta?')) {
      this.routeService.deleteRoute(id).subscribe({
        next: () => {
          this.gamificationService.notification.set('🗑️ Ruta eliminada correctamente');
          setTimeout(() => this.gamificationService.notification.set(''), 3000);
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
}