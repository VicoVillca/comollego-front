import { Component, input, inject, signal, computed, OnInit, effect, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { RouteService } from '../../../core/services/route.service';
import { SimulationService } from '../../../core/services/simulation.service';
import { GamificationService } from '../../../core/services/gamification.service';
import {   
  Ruta, 
  Parada, 
  RutaHistorial, 
  Comentario  
} from '../../../core/models/transit.models';
import { SINDICATOS_MOCK } from '../../../data/mock-data';

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
  // 1. INPUT Y OUTPUT
  // ============================================================
  route = input.required<Ruta>();
  mapDataChanged = output<{ polyline: string; stops: Parada[]; color: string }>();
  directionChanged = output<'ida' | 'vuelta'>();

  // ============================================================
  // 2. SERVICIOS
  // ============================================================
  readonly routeService = inject(RouteService);
  readonly simulationService = inject(SimulationService);
  readonly gamificationService = inject(GamificationService);
  private router = inject(Router);

  // ============================================================
  // 3. ESTADO
  // ============================================================
  isExpanded = signal(false);
  activeTab = signal<'stops' | 'comments'>('stops');
  activeDirection = signal<'ida' | 'vuelta'>('ida');
  
  commentText = signal('');
  commentStars = signal(5);
  showConfirmDelete = signal(false);
  
  comments = signal<Comentario[]>([]);
  historyVersions = signal<RutaHistorial[]>([]);
  isLoadingComments = signal(false);
  isLoadingHistory = signal(false);
  commentSubmittedMsg = signal('');

  // ============================================================
  // 4. COMPUTADAS
  // ============================================================
  sortedHistory = computed(() => {
    return [...this.historyVersions()].sort((a, b) => b.version - a.version);
  });

  // ============================================================
  // 5. MAPA DE TIPOS Y EMOJIS
  // ============================================================
  private readonly transitLabelsMap: Record<number, string> = {
    1: 'Minibús',
    2: 'Trufi',
    3: 'Teleférico',
    4: 'PumaKatari',
    5: 'Micro'
  };

  // 👇 EMOJIS DE TRANSPORTE - MÁS VISUALES Y GRATIS
  private readonly transportEmojis: Record<number, string> = {
    1: '🚐',  // Minibús
    2: '🚗',  // Trufi
    3: '🚠',  // Teleférico
    4: '🚌',  // PumaKatari
    5: '🚛'   // Micro
  };

  // ============================================================
  // 6. EFECTO
  // ============================================================
  private routeEffect = effect(() => {
    const r = this.route();
    if (r?.id) {
      this.loadComments();
      this.loadHistory();
      const mobile = window.innerWidth < 768;
      if (mobile) {
        this.isExpanded.set(false);
      } else {
        this.isExpanded.set(true);
      }
      this.emitMapData();
    }
  });

  // ============================================================
  // 7. CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.loadComments();
    this.loadHistory();
  }

  ngOnDestroy() {
    this.routeEffect.destroy();
  }

  // ============================================================
  // 8. EMITIR DATOS AL MAPA
  // ============================================================
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

  // ============================================================
  // 9. CAMBIAR DIRECCIÓN
  // ============================================================
  onDirectionChange(direction: 'ida' | 'vuelta') {
    this.activeDirection.set(direction);
    this.emitMapData();
    this.directionChanged.emit(direction);
  }

  // ============================================================
  // 10. MÉTODOS DE ACCESO
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
  // 11. CARGA DE DATOS
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
  // 12. UTILIDADES VISUALES
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

  // 👇 NUEVO MÉTODO PARA OBTENER EMOJI
  getTransportEmoji(tipoId: number): string {
    return this.transportEmojis[tipoId] || '🚗';
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
  // 13. CERRAR CARD Y LIMPIAR MAPA
  // ============================================================
  closeDetails() {
    this.mapDataChanged.emit({
      polyline: '',
      stops: [],
      color: '#94a3b8'
    });
    this.routeService.closeDetails();
  }

  // ============================================================
  // 14. COMENTARIOS
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
  // 15. EXPANDIR / COLAPSAR
  // ============================================================
  toggleExpand() {
    this.isExpanded.update(v => !v);
  }

  // ============================================================
  // 16. MANEJAR CLICK EN PARADA
  // ============================================================
  onStopSelect(stop: Parada) {
    console.log('Parada seleccionada:', stop);
  }

  onStopHover(stop: Parada | null) {
    console.log('Hover parada:', stop);
  }
}