import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  Ruta, 
  RutaFilter, 
  Comentario, 
  RutaHistorial,
  Parada
} from '../models/transit.models';
import { RUTAS_MOCK, COMENTARIOS_MOCK, HISTORIAL_MOCK } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  // ============================================================
  // 1. ESTADO PRINCIPAL (RUTAS)
  // ============================================================
  private readonly routesState = signal<Ruta[]>(this.loadRoutes());
  readonly routes = this.routesState.asReadonly();

  // ============================================================
  // 2. SELECCIÓN Y FILTROS
  // ============================================================
  readonly selectedRouteId = signal<number | null>(this.routesState()[0]?.id ?? null);
  readonly selectedRoute = computed(() => {
    const id = this.selectedRouteId();
    return id !== null ? this.routesState().find(r => r.id === id) ?? null : null;
  });

  readonly filters = signal<RutaFilter>({
    search: '',
    estado: 'todos',
    sindicatoId: undefined,
    tipoTransporteId: undefined
  });

  // ============================================================
  // 3. UI STATE
  // ============================================================
  readonly isEditing = signal(false);
  readonly isCreating = signal(false);
  readonly isSidebarClosed = signal(false);
  readonly mobileViewMode = signal<'map' | 'panel'>('map');
  readonly activeDirection = signal<'ida' | 'vuelta'>('ida');

  // ============================================================
  // 4. LISTA FILTRADA
  // ============================================================
  readonly filteredRoutes = computed(() => {
    const rutas = this.routesState();

    const f = this.filters();
    const term = (f.search || '').toLowerCase().trim();

    return rutas.filter(ruta => {
      const matchSearch = !term ||
        ruta.nombreRuta.toLowerCase().includes(term) ||
        (ruta.sindicatoNombre?.toLowerCase().includes(term) ?? false) ||
        (ruta.tipoTransporteNombre?.toLowerCase().includes(term) ?? false);

      const matchEstado = f.estado === 'todos' || ruta.estado === f.estado;
      const matchSindicato = f.sindicatoId === undefined || ruta.sindicatoId === f.sindicatoId;
      const matchTipo = f.tipoTransporteId === undefined || ruta.tipoTransporteId === f.tipoTransporteId;

      return matchSearch && matchEstado && matchSindicato && matchTipo;
    });
  });

  // ============================================================
  // 5. PERSISTENCIA LOCAL (solo rutas)
  // ============================================================
  constructor() {
    effect(() => {
      try {
        localStorage.setItem('comollego_routes_state', JSON.stringify(this.routesState()));
      } catch (e) {
        console.error('Failed to persist routes', e);
      }
    });
  }

  private loadRoutes(): Ruta[] {
    return RUTAS_MOCK;
  }

  // ============================================================
  // 6. MÉTODOS DE SELECCIÓN / UI
  // ============================================================
  selectRoute(id: number | null) {
    this.selectedRouteId.set(id);
    this.isEditing.set(false);
    this.isCreating.set(false);
    //this.activeDirection.set('ida');
    if (id !== null) this.mobileViewMode.set('map');
  }

  closeDetails() {
    this.selectedRouteId.set(null);
  }
  

  startCreating() {
    this.selectedRouteId.set(null);
    this.isEditing.set(false);
    this.isCreating.set(true);
    this.isSidebarClosed.set(false);
    this.mobileViewMode.set('panel');
  }

  startEditing(id?: number) {
    if (id !== undefined) this.selectRoute(id);
    if (!this.selectedRoute()) return;
    this.isCreating.set(false);
    this.isEditing.set(true);
    this.isSidebarClosed.set(false);
    this.mobileViewMode.set('panel');
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.isCreating.set(false);
  }

  // ============================================================
  // 7. CRUD DE RUTAS
  // ============================================================
  /** Guarda una ruta (crea o actualiza) */
  saveRoute(route: Ruta): Observable<Ruta> {
    this.routesState.update(prev => {
      const index = prev.findIndex(r => r.id === route.id);
      const now = new Date().toISOString();
      const toSave = { ...route, updatedAt: now };
      if (index === -1) {
        // Asignar ID si no tiene
        if (!toSave.id) toSave.id = Date.now();
        return [toSave, ...prev];
      }
      const next = [...prev];
      next[index] = toSave;
      return next;
    });
    this.selectRoute(route.id);
    return of(route);
  }

  /** Actualiza una ruta existente con cambios parciales */
  updateRoute(id: number, changes: Partial<Ruta>): Observable<Ruta> {
    const updated = this.routesState.update(prev => {
      const index = prev.findIndex(r => r.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...changes, updatedAt: new Date().toISOString() };
      return next;
    });
    const found = this.routesState().find(r => r.id === id);
    return of(found!);
  }

  /** Elimina una ruta (baja lógica) */
  deleteRoute(id: number): Observable<void> {
    this.routesState.update(prev => prev.filter(r => r.id !== id));
    if (this.selectedRouteId() === id) this.selectRoute(null);
    return of(void 0);
  }

  /** Refresca la ruta seleccionada (para recargar después de restauración) */
  refreshRoute(id: number): void {
    this.selectRoute(id);
  }

  // ============================================================
  // 8. COMENTARIOS (operaciones simuladas)
  // ============================================================
  /** Obtiene todos los comentarios de una ruta */
  getCommentsByRouteId(routeId: number): Observable<Comentario[]> {
    const comments = COMENTARIOS_MOCK.filter(c => c.rutaId === routeId);
    return of(comments);
  }

  /** Añade un comentario a una ruta */
  addComment(routeId: number, texto: string, puntuacion: number): Observable<Comentario> {
    const newComment: Comentario = {
      id: Date.now(),
      rutaId: routeId,
      usuarioId: 1, // mock
      comentario: texto,
      puntuacion,
      usuarioNombre: 'Usuario Mock',
      fechaFormateada: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      active: true
    };
    return of(newComment);
  }

  // ============================================================
  // 9. HISTORIAL / VERSIONES
  // ============================================================
  /** Obtiene el historial de versiones de una ruta */
  getHistoryByRouteId(routeId: number): Observable<RutaHistorial[]> {
    const history = HISTORIAL_MOCK.filter(h => h.rutaId === routeId);
    return of(history);
  }

  /** Restaura una versión anterior de la ruta */
  restoreVersion(routeId: number, versionNumber: number): Observable<void> {
    // Buscar la versión en el historial
    const version = HISTORIAL_MOCK.find(h => h.rutaId === routeId && h.version === versionNumber);
    if (!version) {
      console.error('Versión no encontrada');
      return of(void 0);
    }

    // Construir la ruta restaurada a partir de los datos de la versión
    const restoredRoute: Partial<Ruta> = {
      nombreRuta: version.nombreRuta,
      color: version.color,
      polylineIda: version.polylineIda,
      polylineVuelta: version.polylineVuelta,
      distanciaKm: version.distanciaKm,
      duracionMin: version.duracionMin,
      intervaloMin: version.intervaloMin,
      estado: version.estado as 'activo' | 'mantenimiento' | 'suspendido',
      numeroParadas: version.numeroParadas,
      paradas: version.paradasJson ? JSON.parse(version.paradasJson) : undefined,
      sindicatoId: version.sindicatoId,
      tipoTransporteId: version.tipoTransporteId,
      versionActual: version.version + 1 // incrementamos la versión actual
    };

    // Actualizar la ruta en el estado
    this.routesState.update(prev => {
      const index = prev.findIndex(r => r.id === routeId);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...restoredRoute, updatedAt: new Date().toISOString() };
      return next;
    });

    // Recargar la ruta seleccionada
    this.selectRoute(routeId);
    return of(void 0);
  }

  // ============================================================
  // 10. MÉTODOS ADICIONALES (compatibilidad)
  // ============================================================
  /** Obtiene la ruta actual (señal) */
  getCurrentRoute() {
    return this.selectedRoute;
  }

  /** Alterna la dirección (ida/vuelta) – solo UI */
  toggleDirection() {
    this.activeDirection.set(this.activeDirection() === 'ida' ? 'vuelta' : 'ida');
  }
}