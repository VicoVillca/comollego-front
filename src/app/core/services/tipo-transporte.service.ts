// src/app/core/services/tipo-transporte.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TipoTransporte, ApiResponse } from '../models/transit.models';

@Injectable({
  providedIn: 'root'
})
export class TipoTransporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tipos-transporte`;

  // ============================================================
  // SIGNALS PARA ESTADO LOCAL
  // ============================================================
  private tiposState = signal<TipoTransporte[]>([]);
  readonly tipos = this.tiposState.asReadonly();
  isLoading = signal(false);
  error = signal<string | null>(null);

  // ============================================================
  // MÉTODOS HTTP
  // ============================================================

  /**
   * Obtener todos los tipos de transporte
   */
  obtenerTodos(): Observable<ApiResponse<TipoTransporte[]>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<TipoTransporte[]>>(this.apiUrl)
      .pipe(
        tap({
          next: (response) => {
            if (response.success && response.data) {
              this.tiposState.set(response.data);
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set('Error al cargar tipos de transporte');
            this.isLoading.set(false);
            console.error('Error cargando tipos de transporte:', err);
          }
        })
      );
  }

  /**
   * Obtener un tipo de transporte por ID
   */
  obtenerPorId(id: number): Observable<ApiResponse<TipoTransporte>> {
    return this.http.get<ApiResponse<TipoTransporte>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo tipo de transporte
   */
  crearTipo(tipo: Partial<TipoTransporte>): Observable<ApiResponse<TipoTransporte>> {
    return this.http.post<ApiResponse<TipoTransporte>>(this.apiUrl, tipo)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.tiposState.update(list => [...list, response.data!]);
          }
        })
      );
  }

  /**
   * Actualizar un tipo de transporte
   */
  actualizarTipo(id: number, tipo: Partial<TipoTransporte>): Observable<ApiResponse<TipoTransporte>> {
    return this.http.put<ApiResponse<TipoTransporte>>(`${this.apiUrl}/${id}`, tipo)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.tiposState.update(list =>
              list.map(t => t.id === id ? response.data! : t)
            );
          }
        })
      );
  }

  /**
   * Eliminar un tipo de transporte
   */
  eliminarTipo(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.tiposState.update(list => list.filter(t => t.id !== id));
        })
      );
  }

  // ============================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================

  /**
   * Obtener un tipo por su ID (desde la signal)
   */
  getTipoById(id: number): TipoTransporte | undefined {
    return this.tiposState().find(t => t.id === id);
  }

  /**
   * Obtener el nombre de un tipo por su ID
   */
  getNombreTipo(id: number): string {
    const tipo = this.getTipoById(id);
    return tipo ? tipo.nombre : `Tipo ${id}`;
  }

  /**
   * Obtener el icono de un tipo por su ID
   */
  getIconoTipo(id: number): string {
    const tipo = this.getTipoById(id);
    return tipo?.icono || '🚌';
  }

  /**
   * Obtener el nombre con icono de un tipo por su ID
   */
  getNombreConIcono(id: number): string {
    const tipo = this.getTipoById(id);
    if (tipo) {
      return tipo.icono ? `${tipo.icono} ${tipo.nombre}` : tipo.nombre;
    }
    return `Tipo ${id}`;
  }

  /**
   * Recargar la lista desde el backend
   */
  refresh(): void {
    this.obtenerTodos().subscribe();
  }
}