import { Component, input, inject, signal, computed, OnInit, effect, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouteService } from '../../services/route.service';
import { SimulationService } from '../../services/simulation.service';
import { GamificationService } from '../../services/gamification.service';
import {   
  Ruta, 
  Parada, 
  RutaHistorial, 
  Comentario  
} from '../../models/transit.models';
import { SINDICATOS_MOCK } from '../../data/mock-data';

// 📦 Interfaz para los datos del mapa
export interface MapData {
  polyline: string;
  stops: Parada[];
  color: string;
}




@Component({
  selector: 'app-route-details',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './route-details.html',
  styleUrls: ['./route-details.css']
})
export class RouteDetailsComponent implements OnInit, OnDestroy {
  // ============================================================
  // 1. INPUT Y OUTPUT - SOLO AGREGAMOS ESTO
  // ============================================================
  route = input.required<Ruta>();
  mapDataChanged = output<{ polyline: string; stops: Parada[]; color: string }>(); // 🔥 NUEVO
  directionChanged = output<'ida' | 'vuelta'>(); // 🔥 NUEVO

  // ============================================================
  // 2. SERVICIOS (IGUAL)
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly simulationService = inject(SimulationService);
  readonly gamificationService = inject(GamificationService);

  // ============================================================
  // 3. ESTADO (TODO IGUAL)
  // ============================================================
  isExpanded = signal(false);
  activeTab = signal<'stops' | 'comments' | 'history'>('stops');
  activeDirection = signal<'ida' | 'vuelta'>('ida'); // ✅ ESTO SIGUE IGUAL
  
  commentText = signal('');
  commentStars = signal(5);
  showConfirmDelete = signal(false);
  
  comments = signal<Comentario[]>([]);
  historyVersions = signal<RutaHistorial[]>([]);
  isLoadingComments = signal(false);
  isLoadingHistory = signal(false);
  commentSubmittedMsg = signal('');

  // ============================================================
  // 4. COMPUTADAS (TODO IGUAL)
  // ============================================================
  sortedHistory = computed(() => {
    return [...this.historyVersions()].sort((a, b) => b.version - a.version);
  });

  // ============================================================
  // 5. MAPA DE TIPOS (IGUAL)
  // ============================================================
  private readonly transitLabelsMap: Record<number, string> = {
    1: 'Minibús Paceño',
    2: 'Trufi Compartido Express',
    3: 'Mi Teleférico (Línea por Cable)',
    4: 'PumaKatari / ChikiTiti',
    5: 'Micro Tradicional / Dodge'
  };

  // ============================================================
  // 6. EFECTO - IGUAL PERO AGREGAMOS emitMapData()
  // ============================================================
  private routeEffect = effect(() => {
    const r = this.route();
    if (r?.id) {
      this.loadComments();
      this.loadHistory();
      //this.activeDirection.set('ida');
      const mobile = window.innerWidth < 768;
      if (mobile) {
        this.isExpanded.set(false);
      } else {
        this.isExpanded.set(true);
      }
      
      // 🔥 SOLO AGREGAMOS ESTA LÍNEA
      this.emitMapData();
    }
  });

  // ============================================================
  // 7. CICLO DE VIDA (IGUAL)
  // ============================================================
  ngOnInit() {
    this.loadComments();
    this.loadHistory();
  }

  ngOnDestroy() {
    this.routeEffect.destroy();
  }

  // ============================================================
  // 8. 🔥 NUEVO: EMITIR DATOS AL MAPA (3 MÉTODOS NUEVOS)
  // ============================================================
  
  // Método para emitir los datos al mapa
  private emitMapData() {
    const r = this.route();
    const direction = this.activeDirection();
    
    
    if (!r) return;
    
    const polyline = direction === 'ida' 
      ? (r.polylineIda || '') 
      : (r.polylineVuelta || r.polylineIda || '');
    
    const stops = direction === 'ida' 
      ? (r.paradas || []) 
      : (r.paradasVuelta || r.paradas || []);
    
      
    this.mapDataChanged.emit({
      polyline: polyline,
      stops: stops,
      color: r.color || '#3B82F6'
    });
  }

  // 🔥 NUEVO: Este método se llama cuando cambia la dirección
  // Lo conectaremos en el HTML
  onDirectionChange(direction: 'ida' | 'vuelta') {
    
    this.activeDirection.set(direction);

    
    this.emitMapData(); // 🔥 Emitir al mapa cuando cambia dirección
    this.directionChanged.emit(direction);
  }

  // ============================================================
  // 9. MÉTODOS DE ACCESO (TODOS IGUALES)
  // ============================================================
  getStops(): Parada[] {
    const r = this.route();
    const direction = this.activeDirection();
    
    if (direction === 'ida') {
      return r.paradas || [];
    } else {
      return r.paradasVuelta || r.paradas || [];
    }
  }

  getComments(): Comentario[] {
    return this.comments();
  }

  getHistory(): RutaHistorial[] {
    return this.historyVersions();
  }

  getAverageRating(): number {
    const comments = this.getComments();
    if (!comments.length) return 0;
    const sum = comments.reduce((acc, c) => acc + (c.puntuacion || 0), 0);
    return Math.round((sum / comments.length) * 10) / 10;
  }

  getAverageRatingDisplay(): string {
    const avg = this.getAverageRating();
    return avg > 0 ? avg.toFixed(1) : 'New';
  }

  getSindicatoName(sindicatoId: number): string {
    const found = SINDICATOS_MOCK.find(s => s.id === sindicatoId);
    return found ? found.nombre : 'Sindicato no encontrado';
  }

  getSindicatoDesc(sindicatoId: number): string {
    const found = SINDICATOS_MOCK.find(s => s.id === sindicatoId);
    return found?.descripcion || 'Cooperativa de transporte paceño';
  }

  // ============================================================
  // 10. CARGA DE DATOS (TODO IGUAL)
  // ============================================================
  loadComments() {
    const r = this.route();
    if (!r?.id) return;
    this.isLoadingComments.set(true);
    this.routeService.getCommentsByRouteId(r.id).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.comments.set([]);
        this.isLoadingComments.set(false);
      }
    });
  }

  loadHistory() {
    const r = this.route();
    if (!r?.id) return;
    this.isLoadingHistory.set(true);
    this.routeService.getHistoryByRouteId(r.id).subscribe({
      next: (data) => {
        this.historyVersions.set(data);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.historyVersions.set([]);
        this.isLoadingHistory.set(false);
      }
    });
  }

  // ============================================================
  // 11. UTILIDADES (TODO IGUAL)
  // ============================================================
  getHeaderGradient(color: string): string {
    return `linear-gradient(160deg, ${color}cc 0%, ${color} 100%)`;
  }

  getTransitLabel(typeId: number): string {
    const r = this.route();
    if (r.tipoTransporteNombre) {
      return r.tipoTransporteNombre;
    }
    return this.transitLabelsMap[typeId] || `Tipo ${typeId}`;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'activo': 'estado-activo',
      'mantenimiento': 'estado-mantenimiento',
      'suspendido': 'estado-suspendido'
    };
    return map[estado] || '';
  }

  // ============================================================
  // 12. SIMULACIÓN (TODO IGUAL)
  // ============================================================
  toggleSimulation() {
    const r = this.route();
    if (this.simulationService.simulatingRouteId() === r.id) {
      this.simulationService.stopSimulation();
    } else {
      this.simulationService.startSimulation(r.id);
    }
  }

  isSimulating(): boolean {
    return this.simulationService.simulatingRouteId() === this.route().id;
  }

  // ============================================================
  // 13. ELIMINAR (TODO IGUAL)
  // ============================================================
  confirmDelete() {
    this.showConfirmDelete.set(true);
  }

  cancelDelete() {
    this.showConfirmDelete.set(false);
  }

deleteAndClose() {
  const r = this.route();
  this.routeService.deleteRoute(r.id).subscribe({
    next: () => {
      // Limpiar mapa y cerrar
      this.mapDataChanged.emit({
        polyline: '',
        stops: [],
        color: '#94a3b8'
      });
      this.routeService.closeDetails();
      this.gamificationService.triggerExpGain(2, 'Ruta eliminada');
      this.showConfirmDelete.set(false);
    },
    error: (err) => {
      console.error('Error al eliminar ruta', err);
      this.showConfirmDelete.set(false);
    }
  });
}

  // ============================================================
// CERRAR CARD Y LIMPIAR MAPA
// ============================================================
closeDetails() {
  // Emitir datos vacíos para limpiar el mapa
  this.mapDataChanged.emit({
    polyline: '',
    stops: [],
    color: '#94a3b8'
  });
  
  // Cerrar el card
  this.routeService.closeDetails();
}

  // ============================================================
  // 14. COMENTARIOS (TODO IGUAL)
  // ============================================================
  submitComment(e?: Event) {
    if (e) e.preventDefault();
    const text = this.commentText().trim();
    const stars = this.commentStars();
    if (!text || stars === 0) return;
    
    const r = this.route();
    this.routeService.addComment(r.id, text, stars).subscribe({
      next: (newComment) => {
        this.comments.update(prev => [newComment, ...prev]);
        this.commentText.set('');
        this.commentStars.set(5);
        this.commentSubmittedMsg.set('¡Comentario agregado exitosamente! +1 punto de gamificación.');
        this.gamificationService.triggerExpGain(1, 'Comentario registrado');
        setTimeout(() => this.commentSubmittedMsg.set(''), 4000);
      },
      error: (err) => {
        console.error('Error al enviar comentario', err);
      }
    });
  }

  // ============================================================
  // 15. HISTORIAL (TODO IGUAL)
  // ============================================================
  restoreVersion(versionNumber: number) {
    const r = this.route();
    this.routeService.restoreVersion(r.id, versionNumber).subscribe({
      next: () => {
        this.gamificationService.triggerExpGain(1, 'Versión restaurada');
        this.routeService.refreshRoute(r.id);
        this.loadHistory();
      },
      error: (err) => {
        console.error('Error al restaurar versión', err);
      }
    });
  }

  // ============================================================
  // 16. MANEJAR CLICK EN PARADA (TODO IGUAL)
  // ============================================================
  onStopSelect(stop: Parada) {
    console.log('Parada seleccionada:', stop);
  }

  onStopHover(stop: Parada | null) {
    console.log('Hover parada:', stop);
  }

  // ============================================================
  // 17. EXPANDIR / COLAPSAR (TODO IGUAL)
  // ============================================================
  toggleExpand() {
    this.isExpanded.update(v => !v);
  }
}