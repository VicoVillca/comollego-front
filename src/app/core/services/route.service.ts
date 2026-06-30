// src/app/core/services/ruta.service.ts
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Ruta,
  RutaFilter,
  Comentario,
  RutaHistorial,
  Parada,
  RutaBackendResponse,
  RutaDto,
  ApiResponse,
  PageableResponse,
  toFrontendRuta,
  toFrontendRutas,
  toBackendRutaDto
} from '../models/transit.models';
import { COMENTARIOS_MOCK, HISTORIAL_MOCK } from '../../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  // ============================================================
  // INYECCIONES
  // ============================================================
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rutas`;

  // ============================================================
  // 1. ESTADO PRINCIPAL (RUTAS)
  // ============================================================
  private readonly routesState = signal<Ruta[]>([]);
  readonly routes = this.routesState.asReadonly();
  isLoading = signal(false);
  error = signal<string | null>(null);

  // ============================================================
  // 2. SELECCIÓN Y FILTROS
  // ============================================================
  readonly selectedRouteId = signal<number | null>(null);
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
  // 4. DRAFT PARA EL EDITOR
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
        (ruta.codigo?.toLowerCase().includes(term) ?? false) ||
        (ruta.sindicatoNombre?.toLowerCase().includes(term) ?? false) ||
        (ruta.tipoTransporteNombre?.toLowerCase().includes(term) ?? false);

      const matchEstado = f.estado === 'todos' || ruta.estado === f.estado;
      const matchSindicato = f.sindicatoId === undefined || ruta.sindicatoId === f.sindicatoId;
      const matchTipo = f.tipoTransporteId === undefined || ruta.tipoTransporteId === f.tipoTransporteId;

      return matchSearch && matchEstado && matchSindicato && matchTipo;
    });
  });

  // ============================================================
  // 6. CONSTRUCTOR - CARGAR RUTAS AL INICIAR
  // ============================================================
  constructor() {
    // Cargar datos desde el backend al iniciar
    this.loadAllRoutes().subscribe();
  }

  // ============================================================
  // 7. MÉTODOS HTTP PARA RUTAS ✅ (DESARROLLADO)
  // ============================================================

  /**
   * Cargar todas las rutas desde el backend
   */
  loadAllRoutes(): Observable<ApiResponse<RutaBackendResponse[]>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<RutaBackendResponse[]>>(this.apiUrl)
      .pipe(
        tap({
          next: (response) => {
            if (response.success && response.data) {
            
              const rutas = toFrontendRutas(response.data);
              console.log("Vicoooo")
              console.log(rutas[0].paradas.length)
              this.routesState.set(rutas);
              console.log(`✅ ${rutas.length} rutas cargadas desde backend`);
            } else {
              this.error.set('No se pudieron cargar las rutas');
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set('Error al cargar rutas');
            this.isLoading.set(false);
            console.error('Error cargando rutas:', err);
          }
        })
      );
  }

  /**
   * Cargar una ruta específica por ID
   */
  loadRoute(id: number): Observable<ApiResponse<RutaBackendResponse>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<RutaBackendResponse>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap({
          next: (response) => {
            if (response.success && response.data) {
              const ruta = toFrontendRuta(response.data);
              this.routesState.update(list => {
                const index = list.findIndex(r => r.id === id);
                if (index !== -1) {
                  const updated = [...list];
                  updated[index] = ruta;
                  return updated;
                }
                return [...list, ruta];
              });
              this.selectedRouteId.set(id);
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set(`Error al cargar ruta ${id}`);
            this.isLoading.set(false);
            console.error('Error cargando ruta:', err);
          }
        })
      );
  }

  /**
   * Crear una nueva ruta
   */
// El servicio ya está bien, solo asegurar que usa los adaptadores

/**
 * Crear una nueva ruta
 */
createRoute(ruta: Partial<Ruta>): Observable<ApiResponse<RutaBackendResponse>> {
  this.isLoading.set(true);
  this.error.set(null);

  // ✅ Usar toBackendRutaDto para transformar correctamente
  const rutaDto = toBackendRutaDto(ruta);
  
  console.log('📦 Creando ruta:', rutaDto);

  return this.http.post<ApiResponse<RutaBackendResponse>>(this.apiUrl, rutaDto)
    .pipe(
      tap({
        next: (response) => {
          if (response.success && response.data) {
            const nuevaRuta = toFrontendRuta(response.data);
            this.routesState.update(list => [nuevaRuta, ...list]);
            this.selectedRouteId.set(nuevaRuta.id);
            console.log('✅ Ruta creada:', nuevaRuta.nombreRuta);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear la ruta');
          this.isLoading.set(false);
          console.error('Error creando ruta:', err);
        }
      })
    );
}

/**
 * Actualizar una ruta existente
 */
updateRoute(id: number, ruta: Partial<Ruta>): Observable<ApiResponse<RutaBackendResponse>> {
  this.isLoading.set(true);
  this.error.set(null);

  console.log("vicovilclca routesdsd 1")
  console.log(ruta.paradas?.length)
  // ✅ Usar toBackendRutaDto para transformar correctamente
  const rutaDto = toBackendRutaDto({ ...ruta, id });
  
  console.log("vicovilclca routesdsds 2")
  console.log(rutaDto.paradasIda.length)
  console.log('📦 Actualizando ruta:', rutaDto);

  return this.http.put<ApiResponse<RutaBackendResponse>>(`${this.apiUrl}/${id}`, rutaDto)
    .pipe(
      tap({
        next: (response) => {
          if (response.success && response.data) {
            const rutaActualizada = toFrontendRuta(response.data);
            this.routesState.update(list =>
              list.map(r => r.id === id ? rutaActualizada : r)
            );
            this.selectedRouteId.set(id);
            console.log('✅ Ruta actualizada:', rutaActualizada.nombreRuta);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(`Error al actualizar la ruta ${id}`);
          this.isLoading.set(false);
          console.error('Error actualizando ruta:', err);
        }
      })
    );
}

  /**
   * Eliminar una ruta
   */
  deleteRoute(id: number): Observable<ApiResponse<void>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap({
          next: (response) => {
            if (response.success) {
              this.routesState.update(list => list.filter(r => r.id !== id));
              if (this.selectedRouteId() === id) {
                this.selectedRouteId.set(null);
              }
              console.log('🗑️ Ruta eliminada:', id);
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set(`Error al eliminar la ruta ${id}`);
            this.isLoading.set(false);
            console.error('Error eliminando ruta:', err);
          }
        })
      );
  }

  // ============================================================
  // 8. MÉTODOS PARA EL DRAFT (EDITOR)
  // ============================================================

  updateDraft(draft: Partial<Ruta>) {
    console.log('📝 RouteService.updateDraft:', draft);
    this.activeEditDraft.set(draft);
  }

  clearDraft() {
    this.activeEditDraft.set({});
  }

  // ============================================================
  // 9. MÉTODOS DE SELECCIÓN / UI
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
      // Cargar la ruta desde el backend si no está en la lista
      const existing = this.routesState().find(r => r.id === id);
      if (!existing) {
        this.loadRoute(id).subscribe();
        return;
      }
    }

    const route = this.selectedRoute();
    console.log('📦 Ruta para editar:', route);

    if (route) {
      this.isEditing.set(true);
      this.isCreating.set(false);
      this.isSidebarClosed.set(false);
      this.mobileViewMode.set('panel');

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
        polylineVuelta: route.polylineVuelta || '',
        paradas: route.paradas || [],
        paradasVuelta: route.paradasVuelta || route.paradas || [],
        versionActual: route.versionActual || 1
      };

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
  // 10. GUARDAR RUTA
  // ============================================================

  /**
   * Guardar ruta (crear o actualizar) - Usa HTTP
   */
  saveRoute(route: Ruta): Observable<Ruta> {
    // Verificar si la ruta ya existe (edición) o es nueva
    const existing = this.routesState().find(r => r.id === route.id);
    const isNew = !existing || route.id === 0;

      console.log("vicovilclca route")
  console.log(route.paradas.length)
    return new Observable(observer => {
      if (isNew) {
        // Crear nueva ruta
        this.createRoute(route).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const nuevaRuta = toFrontendRuta(response.data);
              observer.next(nuevaRuta);
              observer.complete();
            } else {
              observer.error('Error al crear la ruta');
            }
          },
          error: (err) => {
            observer.error(err);
          }
        });
      } else {
        // Actualizar ruta existente
        this.updateRoute(route.id, route).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const rutaActualizada = toFrontendRuta(response.data);
              observer.next(rutaActualizada);
              observer.complete();
            } else {
              observer.error('Error al actualizar la ruta');
            }
          },
          error: (err) => {
            observer.error(err);
          }
        });
      }
    });
  }

  // ============================================================
  // 11. COMENTARIOS - CON MOCKS 🟡 (NO DESARROLLADO AÚN)
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
      usuarioEmail: 'mock@email.com',
      fechaFormateada: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      active: true
    };
    return of(newComment);
  }

  // ============================================================
  // 12. HISTORIAL - CON MOCKS 🟡 (NO DESARROLLADO AÚN)
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

    // Actualizar en el backend
    this.updateRoute(routeId, restoredRoute).subscribe({
      next: () => {
        console.log('✅ Versión restaurada');
      },
      error: (err) => {
        console.error('Error restaurando versión:', err);
      }
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