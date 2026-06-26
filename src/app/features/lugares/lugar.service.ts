import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.models';
import { Lugar } from '../../core/models/transit.models';

@Injectable({
  providedIn: 'root'
})
export class LugarService {
  private http = inject(HttpClient);

  /**
   * Buscar lugares por término
   * @param term - Término de búsqueda (ej: "lap", "plaza")
   * @returns Observable con la respuesta del backend
   */
  buscarLugares(term: string): Observable<ApiResponse<Lugar[]>> {
    return this.http.get<ApiResponse<Lugar[]>>(
      `${environment.apiUrl}/lugares/buscar?term=${encodeURIComponent(term)}`
    );
  }

  /**
   * Crear un nuevo lugar
   */
  crearLugar(lugar: Partial<Lugar>): Observable<ApiResponse<Lugar>> {
    return this.http.post<ApiResponse<Lugar>>(
      `${environment.apiUrl}/lugares`,
      lugar
    );
  }
}