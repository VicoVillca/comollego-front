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
  // 4. 🔥 DRAFT PARA EL EDITOR - SEÑAL PÚBLICA
  // ============================================================
  readonly activeEditDraft = signal<Partial<Ruta>>({});

  // ============================================================
  // 5. LISTA FILTRADA
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
  // 6. PERSISTENCIA LOCAL
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
  // 7. 🔥 MÉTODOS PARA EL DRAFT
  // ============================================================
  updateDraft(draft: Partial<Ruta>) {
    console.log('📝 RouteService.updateDraft:', draft);
    this.activeEditDraft.set(draft);
  }

  clearDraft() {
    this.activeEditDraft.set({});
  }

  // ============================================================
  // 8. MÉTODOS DE SELECCIÓN / UI
  // ============================================================
  selectRoute(id: number | null) {
    this.selectedRouteId.set(id);
    this.isEditing.set(false);
    this.isCreating.set(false);
    if (id !== null) this.mobileViewMode.set('map');
  }

  closeDetails() {
    this.selectedRouteId.set(null);
    this.clearDraft();
  }

  startCreating() {
    this.selectedRouteId.set(null);
    this.isEditing.set(false);
    this.isCreating.set(true);
    this.isSidebarClosed.set(false);
    this.mobileViewMode.set('panel');
    
    // 🔥 Crear draft vacío
    const draft: Partial<Ruta> = {
      nombreRuta: '',
      codigo: '',
      color: '#3b82f6',
      polylineIda: '',
      polylineVuelta: '',
      paradas: [],
      paradasVuelta: [],
      sindicatoId: 1,
      tipoTransporteId: 1,
      estado: 'activo',
      distanciaKm: 0,
      duracionMin: 0,
      intervaloMin: 5
    };
    this.updateDraft(draft);
  }

  startEditing(id?: number) {
    console.log('✏️ RouteService.startEditing:', id);
    
    if (id !== undefined) {
      this.selectRoute(id);
    }
    
    const route = this.selectedRoute();
    console.log('📦 Ruta para editar:', route);
    
    if (route) {
      this.isEditing.set(true);
      this.isCreating.set(false);
      this.isSidebarClosed.set(false);
      this.mobileViewMode.set('panel');
      
      // 🔥 Cargar el draft desde la ruta seleccionada
      const draft: Partial<Ruta> = {
        id: route.id,
        nombreRuta: route.nombreRuta,
        codigo: route.codigo,
        color: route.color,
        tipoTransporteId: route.tipoTransporteId,
        estado: route.estado,
        distanciaKm: route.distanciaKm,
        duracionMin: route.duracionMin,
        intervaloMin: route.intervaloMin,
        sindicatoId: route.sindicatoId,
        polylineIda: route.polylineIda || '',
        polylineVuelta: route.polylineVuelta || route.polylineIda || '',
        paradas: route.paradas || [],
        paradasVuelta: route.paradasVuelta || route.paradas || [],
        versionActual: route.versionActual || 1
      };
      
      console.log('📝 Draft creado en startEditing:', draft);
      console.log('📝 Paradas en draft:', draft.paradas?.length || 0);
      console.log('📝 PolylineIda en draft:', draft.polylineIda);
      
      // 🔥 Actualizar el draft
      this.updateDraft(draft);
    } else {
      console.warn('⚠️ No hay ruta seleccionada para editar');
    }
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.isCreating.set(false);
    this.clearDraft();
  }

  // ============================================================
  // 9. CRUD DE RUTAS
  // ============================================================
  saveRoute(route: Ruta): Observable<Ruta> {
    this.routesState.update(prev => {
      const index = prev.findIndex(r => r.id === route.id);
      const now = new Date().toISOString();
      const toSave = { ...route, updatedAt: now };
      if (index === -1) {
        if (!toSave.id) toSave.id = Date.now();
        return [toSave, ...prev];
      }
      const next = [...prev];
      next[index] = toSave;
      return next;
    });
    this.selectRoute(route.id);
    this.cancelEditing();
    return of(route);
  }

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

  deleteRoute(id: number): Observable<void> {
    this.routesState.update(prev => prev.filter(r => r.id !== id));
    if (this.selectedRouteId() === id) this.selectRoute(null);
    return of(void 0);
  }

  refreshRoute(id: number): void {
    this.selectRoute(id);
  }

  // ============================================================
  // 10. COMENTARIOS
  // ============================================================
  getCommentsByRouteId(routeId: number): Observable<Comentario[]> {
    const comments = COMENTARIOS_MOCK.filter(c => c.rutaId === routeId);
    return of(comments);
  }

  addComment(routeId: number, texto: string, puntuacion: number): Observable<Comentario> {
    const newComment: Comentario = {
      id: Date.now(),
      rutaId: routeId,
      usuarioId: 1,
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
  // 11. HISTORIAL
  // ============================================================
  getHistoryByRouteId(routeId: number): Observable<RutaHistorial[]> {
    const history = HISTORIAL_MOCK.filter(h => h.rutaId === routeId);
    return of(history);
  }

  restoreVersion(routeId: number, versionNumber: number): Observable<void> {
    const version = HISTORIAL_MOCK.find(h => h.rutaId === routeId && h.version === versionNumber);
    if (!version) {
      console.error('Versión no encontrada');
      return of(void 0);
    }

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
      versionActual: version.version + 1
    };

    this.routesState.update(prev => {
      const index = prev.findIndex(r => r.id === routeId);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...restoredRoute, updatedAt: new Date().toISOString() };
      return next;
    });

    this.selectRoute(routeId);
    return of(void 0);
  }

  getCurrentRoute() {
    return this.selectedRoute;
  }

  toggleDirection() {
    this.activeDirection.set(this.activeDirection() === 'ida' ? 'vuelta' : 'ida');
  }
}